import { ProjectFile, TerminalOutputLine, ProviderProfile } from '../types/models';
import { runPythonCode, installPipPackage } from './pyodideRunner';
import { VirtualGitEngine } from './gitService';
import { runClaudeCodeReplicate } from './claudeCodeReplicate';
import { loadInstalledPackages } from './storage';

export interface TerminalExecutionOptions {
  command: string;
  files: Record<string, ProjectFile>;
  cwd: string;
  provider: ProviderProfile;
  onFilesChanged: (files: Record<string, ProjectFile>) => void;
  onStreamOutput?: (chunk: string) => void;
}

export async function executeTerminalCommand(options: TerminalExecutionOptions): Promise<TerminalOutputLine> {
  const { command, files, cwd, provider, onFilesChanged, onStreamOutput } = options;
  const trimmed = command.trim();
  const timestamp = Date.now();
  const id = `term_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;

  if (!trimmed) {
    return { id, command, output: '', exitCode: 0, timestamp };
  }

  // Built-in command handling
  const gitEngine = new VirtualGitEngine(files);

  // 1. uname -a
  if (trimmed === 'uname -a') {
    return {
      id,
      command,
      output: 'Linux pocket 5.15.0-arm64 #1 SMP PREEMPT Mobile Harness Web WebAssembly aarch64 GNU/Linux',
      exitCode: 0,
      timestamp,
    };
  }

  // 2. pwd
  if (trimmed === 'pwd') {
    return {
      id,
      command,
      output: cwd || '/workspace',
      exitCode: 0,
      timestamp,
    };
  }

  // 3. node -v
  if (trimmed === 'node -v' || trimmed === 'node --version') {
    return {
      id,
      command,
      output: 'v20.18.0 (WebContainer Virtual Node)',
      exitCode: 0,
      timestamp,
    };
  }

  // 4. claude --version
  if (trimmed === 'claude --version' || trimmed === 'claude -v') {
    return {
      id,
      command,
      output: 'claude-code 0.2.29 (Mobile Harness Web Replicate)',
      exitCode: 0,
      timestamp,
    };
  }

  // 5. python --version / python3 --version
  if (trimmed === 'python --version' || trimmed === 'python3 --version' || trimmed === 'python -V' || trimmed === 'python3 -V') {
    return {
      id,
      command,
      output: 'Python 3.12.7 (Pyodide WebAssembly with micropip backend)',
      exitCode: 0,
      timestamp,
    };
  }

  // 6. df -h
  if (trimmed === 'df -h') {
    return {
      id,
      command,
      output: `Filesystem      Size  Used Avail Use% Mounted on\n/dev/root        64G   12G   52G  19% /\ntmpfs           4.0G     0  4.0G   0% /dev/shm\n/workspace       64G  2.4M   52G   1% /workspace`,
      exitCode: 0,
      timestamp,
    };
  }

  // 7. free -m
  if (trimmed === 'free -m') {
    return {
      id,
      command,
      output: `               total        used        free      shared  buff/cache   available\nMem:            7850        1820        4910         120        1120        5910\nSwap:           2048           0        2048`,
      exitCode: 0,
      timestamp,
    };
  }

  // 8. ls / ls -la / ls -l
  if (trimmed === 'ls' || trimmed.startsWith('ls ')) {
    const fileList = Object.keys(files);
    if (fileList.length === 0) {
      return { id, command, output: '', exitCode: 0, timestamp };
    }
    if (trimmed.includes('-l')) {
      const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      let out = `total ${fileList.length * 4}\n`;
      for (const p of fileList) {
        const size = files[p].content.length;
        out += `-rw-r--r-- 1 root root ${size.toString().padStart(6, ' ')} ${now} ${p}\n`;
      }
      return { id, command, output: out.trimEnd(), exitCode: 0, timestamp };
    }
    return { id, command, output: fileList.join('  '), exitCode: 0, timestamp };
  }

  // 9. cat <file>
  if (trimmed.startsWith('cat ')) {
    const filename = trimmed.substring(4).trim().replace(/^\/+/, '');
    const file = files[filename];
    if (!file) {
      return {
        id,
        command,
        output: `cat: ${filename}: No such file or directory`,
        exitCode: 1,
        timestamp,
      };
    }
    return {
      id,
      command,
      output: file.content,
      exitCode: 0,
      timestamp,
    };
  }

  // 10. pip list
  if (trimmed === 'pip list') {
    const pkgs = loadInstalledPackages();
    let out = 'Package    Version\n---------- -------\n';
    for (const p of pkgs) {
      out += `${p.name.padEnd(10, ' ')} ${p.version}\n`;
    }
    return { id, command, output: out.trimEnd(), exitCode: 0, timestamp };
  }

  // 11. pip install <pkg>
  if (trimmed.startsWith('pip install')) {
    const pkg = trimmed.replace(/^pip\s+install\s+/, '').trim();
    if (!pkg) {
      return { id, command, output: 'ERROR: You must give at least one requirement to install', exitCode: 1, timestamp };
    }

    onStreamOutput?.(`Collecting ${pkg}...\nInstalling wheel via Pyodide micropip backend in browser...\n`);
    const res = await installPipPackage(pkg, (msg) => onStreamOutput?.(msg));
    return {
      id,
      command,
      output: res.message,
      exitCode: res.success ? 0 : 1,
      timestamp,
    };
  }

  // 12. python3 / python execution
  if (trimmed.startsWith('python') || trimmed.startsWith('python3')) {
    let pyCode = '';
    const matchInline = trimmed.match(/^python3?\s+-c\s+["'](.*)["']/);
    const matchFile = trimmed.match(/^python3?\s+([^\s]+)/);

    if (matchInline) {
      pyCode = matchInline[1];
    } else if (matchFile) {
      const filePath = matchFile[1].replace(/^\/+/, '');
      const file = files[filePath];
      if (!file) {
        return {
          id,
          command,
          output: `python: can't open file '${filePath}': [Errno 2] No such file or directory`,
          exitCode: 2,
          timestamp,
        };
      }
      pyCode = file.content;
    } else {
      pyCode = 'import sys; print(f"Python {sys.version} on WebAssembly")';
    }

    onStreamOutput?.('[Running Python 3.12 WebAssembly...]\n');
    const pyRes = await runPythonCode(pyCode, files, (chunk) => onStreamOutput?.(chunk));
    const combinedOutput = pyRes.stdout + (pyRes.stderr ? (pyRes.stdout ? '\n' : '') + pyRes.stderr : '');
    return {
      id,
      command,
      output: combinedOutput.trimEnd() || '(execution completed with code 0)',
      exitCode: pyRes.exitCode,
      timestamp,
    };
  }

  // 13. git commands
  if (trimmed.startsWith('git ')) {
    const gitSub = trimmed.substring(4).trim();
    if (gitSub === 'status') {
      return { id, command, output: gitEngine.status(), exitCode: 0, timestamp };
    }
    if (gitSub.startsWith('commit')) {
      const msgMatch = gitSub.match(/-m\s+["'](.*)["']/);
      const commitMsg = msgMatch ? msgMatch[1] : 'Update project files';
      return { id, command, output: gitEngine.commit(commitMsg), exitCode: 0, timestamp };
    }
    if (gitSub === 'log') {
      return { id, command, output: gitEngine.log(), exitCode: 0, timestamp };
    }
    if (gitSub.startsWith('add')) {
      return { id, command, output: '', exitCode: 0, timestamp };
    }
    if (gitSub === 'branch') {
      return { id, command, output: '* main', exitCode: 0, timestamp };
    }
    return { id, command, output: `git: '${gitSub}' executed successfully`, exitCode: 0, timestamp };
  }

  // 14. claude agent command
  if (trimmed.startsWith('claude')) {
    let agentPrompt = '';
    const matchP = trimmed.match(/^claude\s+-p\s+["'](.*)["']/);
    const matchPlain = trimmed.match(/^claude\s+["'](.*)["']/);
    const matchRest = trimmed.replace(/^claude\s*/, '');

    if (matchP) {
      agentPrompt = matchP[1];
    } else if (matchPlain) {
      agentPrompt = matchPlain[1];
    } else if (matchRest.length > 0) {
      agentPrompt = matchRest;
    } else {
      agentPrompt = 'Hello, Claude Code! Please inspect the current workspace and summarize what we have.';
    }

    onStreamOutput?.(`[Claude Code Agent Starting: "${agentPrompt}"]\n`);

    try {
      const result = await runClaudeCodeReplicate(
        agentPrompt,
        [],
        files,
        provider,
        {
          onDelta: (text) => onStreamOutput?.(text),
          onActivity: (act) => onStreamOutput?.(`\n[${act.title}] ${act.detail}\n`),
          onFilesChanged: (newFiles) => onFilesChanged(newFiles),
        }
      );
      return {
        id,
        command,
        output: result || 'Agent completed successfully.',
        exitCode: 0,
        timestamp,
      };
    } catch (err: any) {
      return {
        id,
        command,
        output: `Claude Code Error: ${err.message || String(err)}`,
        exitCode: 1,
        timestamp,
      };
    }
  }

  // 15. touch <file>
  if (trimmed.startsWith('touch ')) {
    const filename = trimmed.substring(6).trim().replace(/^\/+/, '');
    if (filename && !files[filename]) {
      files[filename] = {
        path: filename,
        name: filename.split('/').pop() || filename,
        content: '',
        updatedAt: Date.now(),
      };
      onFilesChanged({ ...files });
    }
    return { id, command, output: '', exitCode: 0, timestamp };
  }

  // 16. rm <file>
  if (trimmed.startsWith('rm ')) {
    const filename = trimmed.replace(/^rm(\s+-rf|\s+-f|\s+-r)?\s+/, '').trim().replace(/^\/+/, '');
    if (files[filename]) {
      delete files[filename];
      onFilesChanged({ ...files });
      return { id, command, output: '', exitCode: 0, timestamp };
    }
    return { id, command, output: `rm: cannot remove '${filename}': No such file or directory`, exitCode: 1, timestamp };
  }

  // 17. echo
  if (trimmed.startsWith('echo ')) {
    const rest = trimmed.substring(5);
    // check redirection: echo "content" > file
    const redirMatch = rest.match(/^(.*?)\s*>\s*([^\s]+)$/);
    if (redirMatch) {
      const content = redirMatch[1].replace(/^["']|["']$/g, '');
      const filename = redirMatch[2].replace(/^\/+/, '');
      files[filename] = {
        path: filename,
        name: filename.split('/').pop() || filename,
        content: content + '\n',
        updatedAt: Date.now(),
      };
      onFilesChanged({ ...files });
      return { id, command, output: '', exitCode: 0, timestamp };
    }
    return { id, command, output: rest.replace(/^["']|["']$/g, ''), exitCode: 0, timestamp };
  }

  // Fallback unrecognized command
  return {
    id,
    command,
    output: `bash: ${trimmed.split(' ')[0]}: command not found`,
    exitCode: 127,
    timestamp,
  };
}
