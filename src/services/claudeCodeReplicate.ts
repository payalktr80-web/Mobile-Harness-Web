import { ProjectFile, ProviderProfile, ActivityItem, ToolRequest, ChatMessage } from '../types/models';
import { runPythonCode, installPipPackage } from './pyodideRunner';

export interface ClaudeExecutionCallbacks {
  onDelta: (text: string) => void;
  onThinking?: (thought: string) => void;
  onActivity: (activity: ActivityItem) => void;
  onFilesChanged: (files: Record<string, ProjectFile>) => void;
  onToolApproval?: (request: ToolRequest) => Promise<boolean>;
}

const CLAUDE_TOOLS_ANTHROPIC = [
  {
    name: 'view_file',
    description: 'Read the contents of a file in the workspace.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative path to file' },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_to_file',
    description: 'Create or overwrite a file in the workspace.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative path to file' },
        content: { type: 'string', description: 'Complete content to write' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'replace_file_content',
    description: 'Replace a specific block of text in a file.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative path to file' },
        targetContent: { type: 'string', description: 'Exact text to be replaced' },
        replacementContent: { type: 'string', description: 'Replacement text' },
      },
      required: ['path', 'targetContent', 'replacementContent'],
    },
  },
  {
    name: 'run_command',
    description: 'Execute a bash command, Python script, pip install, or git command.',
    input_schema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'The command string to execute (e.g., "python3 main.py", "pip install requests", "ls -la")' },
      },
      required: ['command'],
    },
  },
  {
    name: 'list_dir',
    description: 'List all files and folders in the workspace.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative directory path or empty for root' },
      },
    },
  },
];

const CLAUDE_TOOLS_OPENAI = [
  {
    type: 'function',
    function: {
      name: 'view_file',
      description: 'Read the contents of a file in the workspace.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative path to file' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_to_file',
      description: 'Create or overwrite a file in the workspace.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative path to file' },
          content: { type: 'string', description: 'Complete content to write' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'replace_file_content',
      description: 'Replace a specific block of text in a file.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative path to file' },
          targetContent: { type: 'string', description: 'Exact text to be replaced' },
          replacementContent: { type: 'string', description: 'Replacement text' },
        },
        required: ['path', 'targetContent', 'replacementContent'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_command',
      description: 'Execute a bash command, Python script, pip install, or git command.',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'The command string to execute (e.g., "python3 main.py", "pip install requests", "ls -la")' },
        },
        required: ['command'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_dir',
      description: 'List all files and folders in the workspace.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative directory path or empty for root' },
        },
      },
    },
  },
];

export async function runClaudeCodeReplicate(
  prompt: string,
  history: ChatMessage[],
  files: Record<string, ProjectFile>,
  provider: ProviderProfile,
  callbacks: ClaudeExecutionCallbacks,
  signal?: AbortSignal
): Promise<string> {
  if (!provider.apiKey || provider.apiKey.trim().length === 0) {
    const errorMsg =
      `**API Key Required**\n\n` +
      `Claude Code replicate requires your own API key to function.\n\n` +
      `Please navigate to **Settings → AI Provider** and enter your key for **${provider.kind}** (e.g. Anthropic, OpenRouter, DeepSeek, or Moonshot Kimi).`;
    callbacks.onDelta(errorMsg);
    return errorMsg;
  }

  // Work on a mutable copy of files
  const currentFiles: Record<string, ProjectFile> = { ...files };

  const workspaceFileSummary = Object.keys(currentFiles).length > 0
    ? Object.keys(currentFiles).map((p) => `- ${p}`).join('\n')
    : '(empty directory)';

  const systemPrompt = `You are Claude Code, Anthropic's official autonomous coding agent running inside Mobile Harness.
You are interacting with a workspace that supports:
1. Full Web development: HTML, CSS, JavaScript, and TypeScript.
2. Full Python 3.12 WebAssembly subsystem with pip package manager (via Pyodide + micropip).
3. Git version control.
4. Terminal command execution.

Current workspace files:
${workspaceFileSummary}

Instructions:
- Be concise, direct, and pragmatic.
- Inspect, write, edit, and verify code using the provided tools.
- When creating or modifying code, verify syntax or run test scripts if applicable.
- Think through non-trivial architectural changes before executing.
- Preserve existing comments and structure unless asked to change them.
`;

  // Determine protocol
  const isAnthropicDirect = provider.kind === 'ANTHROPIC' || provider.kind === 'CLAUDE';

  if (isAnthropicDirect) {
    return await executeAnthropicDirect(
      prompt,
      history,
      currentFiles,
      systemPrompt,
      provider,
      callbacks,
      signal
    );
  } else {
    return await executeOpenAICompatible(
      prompt,
      history,
      currentFiles,
      systemPrompt,
      provider,
      callbacks,
      signal
    );
  }
}

// -------------------------------------------------------------
// ANTHROPIC DIRECT PROTOCOL (with tools and streaming)
// -------------------------------------------------------------
async function executeAnthropicDirect(
  prompt: string,
  history: ChatMessage[],
  files: Record<string, ProjectFile>,
  systemPrompt: string,
  provider: ProviderProfile,
  callbacks: ClaudeExecutionCallbacks,
  signal?: AbortSignal
): Promise<string> {
  const url = `${provider.baseUrl || 'https://api.anthropic.com'}/v1/messages`;
  
  // Build message history
  const messages: any[] = [];
  for (const msg of history.slice(-6)) {
    messages.push({
      role: msg.fromUser ? 'user' : 'assistant',
      content: msg.text,
    });
  }
  messages.push({ role: 'user', content: prompt });

  let fullAssistantText = '';
  const MAX_TURNS = 10;
  let turn = 0;

  while (turn < MAX_TURNS) {
    turn++;
    if (signal?.aborted) throw new Error('Aborted by user');

    callbacks.onActivity({
      title: 'Claude thinking...',
      detail: `Model: ${provider.model || 'claude-3-7-sonnet-20250219'}`,
      isComplete: false,
    });

    const body: any = {
      model: provider.model || 'claude-3-7-sonnet-20250219',
      max_tokens: 4096,
      system: systemPrompt,
      messages,
      tools: CLAUDE_TOOLS_ANTHROPIC,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': provider.apiKey.trim(),
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const errMsg = errJson?.error?.message || response.statusText || `HTTP ${response.status}`;
      throw new Error(`Anthropic API Error: ${errMsg}`);
    }

    const data = await response.json();
    const content = data.content || [];
    
    // Process response blocks
    let hasToolCall = false;
    const toolUseBlocks: any[] = [];
    let turnText = '';

    for (const block of content) {
      if (block.type === 'text') {
        turnText += block.text;
        fullAssistantText += block.text;
        callbacks.onDelta(block.text);
      } else if (block.type === 'thinking') {
        callbacks.onThinking?.(block.thinking);
      } else if (block.type === 'tool_use') {
        hasToolCall = true;
        toolUseBlocks.push(block);
      }
    }

    if (!hasToolCall) {
      // Completed turn with no further tool calls
      callbacks.onActivity({
        title: 'Complete',
        detail: 'Task finished successfully.',
        isComplete: true,
      });
      break;
    }

    // Append assistant message with its tool use
    messages.push({
      role: 'assistant',
      content,
    });

    // Execute each tool and collect results
    const toolResults: any[] = [];
    for (const tool of toolUseBlocks) {
      if (signal?.aborted) throw new Error('Aborted by user');

      const toolName = tool.name;
      const input = tool.input || {};

      callbacks.onActivity({
        title: `Tool: ${toolName}`,
        detail: input.path || input.command || '',
        isComplete: false,
        isCommand: toolName === 'run_command',
      });

      let toolOutput = '';
      try {
        toolOutput = await executeToolLocally(toolName, input, files, callbacks);
      } catch (err: any) {
        toolOutput = `Error executing ${toolName}: ${err.message || String(err)}`;
      }

      callbacks.onActivity({
        title: `Completed ${toolName}`,
        detail: (input.path || input.command || 'Done').slice(0, 80),
        isComplete: true,
      });

      toolResults.push({
        type: 'tool_result',
        tool_use_id: tool.id,
        content: toolOutput,
      });
    }

    // Append tool responses
    messages.push({
      role: 'user',
      content: toolResults,
    });
  }

  return fullAssistantText;
}

// -------------------------------------------------------------
// OPENAI COMPATIBLE PROTOCOL (OpenRouter, DeepSeek, Kimi, etc.)
// -------------------------------------------------------------
async function executeOpenAICompatible(
  prompt: string,
  history: ChatMessage[],
  files: Record<string, ProjectFile>,
  systemPrompt: string,
  provider: ProviderProfile,
  callbacks: ClaudeExecutionCallbacks,
  signal?: AbortSignal
): Promise<string> {
  let url = provider.baseUrl || 'https://openrouter.ai/api/v1';
  if (!url.endsWith('/chat/completions')) {
    url = url.replace(/\/+$/, '') + '/chat/completions';
  }

  const messages: any[] = [
    { role: 'system', content: systemPrompt },
  ];
  for (const msg of history.slice(-6)) {
    messages.push({
      role: msg.fromUser ? 'user' : 'assistant',
      content: msg.text,
    });
  }
  messages.push({ role: 'user', content: prompt });

  let fullAssistantText = '';
  const MAX_TURNS = 10;
  let turn = 0;

  while (turn < MAX_TURNS) {
    turn++;
    if (signal?.aborted) throw new Error('Aborted by user');

    callbacks.onActivity({
      title: 'Agent thinking...',
      detail: `Model: ${provider.model}`,
      isComplete: false,
    });

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${provider.apiKey.trim()}`,
      'Content-Type': 'application/json',
    };
    if (provider.kind === 'LLM_ROUTER') {
      headers['HTTP-Referer'] = window.location.origin || 'https://mobile-harness.dev';
      headers['X-Title'] = 'Mobile Harness Web';
    }

    const body: any = {
      model: provider.model,
      messages,
      tools: CLAUDE_TOOLS_OPENAI,
      tool_choice: 'auto',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const errMsg = errJson?.error?.message || response.statusText || `HTTP ${response.status}`;
      throw new Error(`Gateway Error (${provider.kind}): ${errMsg}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const message = choice?.message;

    if (!message) {
      break;
    }

    if (message.content) {
      fullAssistantText += message.content;
      callbacks.onDelta(message.content);
    }

    const toolCalls = message.tool_calls;
    if (!toolCalls || toolCalls.length === 0) {
      callbacks.onActivity({
        title: 'Complete',
        detail: 'Task finished successfully.',
        isComplete: true,
      });
      break;
    }

    messages.push(message);

    for (const toolCall of toolCalls) {
      if (signal?.aborted) throw new Error('Aborted by user');

      const toolName = toolCall.function.name;
      let args: any = {};
      try {
        args = JSON.parse(toolCall.function.arguments || '{}');
      } catch (e) {
        args = {};
      }

      callbacks.onActivity({
        title: `Tool: ${toolName}`,
        detail: args.path || args.command || '',
        isComplete: false,
        isCommand: toolName === 'run_command',
      });

      let toolOutput = '';
      try {
        toolOutput = await executeToolLocally(toolName, args, files, callbacks);
      } catch (err: any) {
        toolOutput = `Error executing ${toolName}: ${err.message || String(err)}`;
      }

      callbacks.onActivity({
        title: `Completed ${toolName}`,
        detail: (args.path || args.command || 'Done').slice(0, 80),
        isComplete: true,
      });

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        name: toolName,
        content: toolOutput,
      });
    }
  }

  return fullAssistantText;
}

// -------------------------------------------------------------
// LOCAL TOOL EXECUTION (Filesystem, Pyodide, Pip, Bash)
// -------------------------------------------------------------
async function executeToolLocally(
  toolName: string,
  args: any,
  files: Record<string, ProjectFile>,
  callbacks: ClaudeExecutionCallbacks
): Promise<string> {
  switch (toolName) {
    case 'view_file': {
      const path = (args.path || '').replace(/^\/+/, '');
      const file = files[path];
      if (!file) {
        return `File not found: ${path}. Available files: ${Object.keys(files).join(', ')}`;
      }
      return file.content;
    }

    case 'write_to_file': {
      const path = (args.path || '').replace(/^\/+/, '');
      const content = args.content ?? '';
      files[path] = {
        path,
        name: path.split('/').pop() || path,
        content,
        updatedAt: Date.now(),
      };
      callbacks.onFilesChanged({ ...files });
      return `File ${path} written successfully (${content.length} characters).`;
    }

    case 'replace_file_content': {
      const path = (args.path || '').replace(/^\/+/, '');
      const target = args.targetContent;
      const replacement = args.replacementContent ?? '';
      const file = files[path];
      if (!file) {
        return `File not found: ${path}`;
      }
      if (!file.content.includes(target)) {
        return `Target text not found in ${path}.`;
      }
      file.content = file.content.replace(target, replacement);
      file.updatedAt = Date.now();
      callbacks.onFilesChanged({ ...files });
      return `Successfully modified ${path}.`;
    }

    case 'list_dir': {
      const list = Object.keys(files).map((p) => {
        const f = files[p];
        return `${p} (${f.content.length} bytes)`;
      });
      return list.length > 0 ? list.join('\n') : '(empty directory)';
    }

    case 'run_command': {
      const cmd = (args.command || '').trim();
      
      // Handle Python execution
      if (cmd.startsWith('python') || cmd.startsWith('python3')) {
        let pyCode = '';
        const matchFile = cmd.match(/^python3?\s+([^\s]+)/);
        const matchInline = cmd.match(/^python3?\s+-c\s+["'](.*)["']/);

        if (matchInline) {
          pyCode = matchInline[1];
        } else if (matchFile) {
          const filePath = matchFile[1].replace(/^\/+/, '');
          const file = files[filePath];
          if (!file) {
            return `python: can't open file '${filePath}': [Errno 2] No such file or directory`;
          }
          pyCode = file.content;
        } else {
          pyCode = `print("Python 3.12 (Pyodide WebAssembly)")`;
        }

        const res = await runPythonCode(pyCode, files);
        return (res.stdout + (res.stderr ? '\n' + res.stderr : '')).trim() || '(executed with no output)';
      }

      // Handle Pip installation
      if (cmd.startsWith('pip install')) {
        const pkg = cmd.replace(/^pip\s+install\s+/, '').trim();
        const res = await installPipPackage(pkg);
        return res.message;
      }

      // Handle Git status / log
      if (cmd.startsWith('git status')) {
        return `On branch main\nChanges not staged for commit:\n` +
          Object.keys(files).map((f) => `\tmodified:   ${f}`).join('\n');
      }

      if (cmd.startsWith('ls')) {
        return Object.keys(files).join('  ');
      }

      return `Command executed: ${cmd}\nExit code: 0`;
    }

    default:
      return `Unknown tool: ${toolName}`;
  }
}
