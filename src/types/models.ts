export type ProviderProtocol =
  | 'claude_login'
  | 'anthropic'
  | 'anthropic_gateway'
  | 'openrouter'
  | 'openai_responses'
  | 'openai_chat';

export type ProviderKindId =
  | 'CLAUDE'
  | 'ANTHROPIC'
  | 'LLM_ROUTER'
  | 'DEEPSEEK'
  | 'KIMI'
  | 'OPENCODE_ZEN'
  | 'NVIDIA_NIM'
  | 'CUSTOM';

export interface ProviderDefinition {
  id: ProviderKindId;
  title: string;
  subtitle: string;
  protocol: ProviderProtocol;
  defaultBaseUrl: string;
  defaultModel: string;
  experimental?: boolean;
  fixedBaseUrl?: boolean;
  fixedProtocol?: boolean;
}

export const PROVIDER_DEFINITIONS: Record<ProviderKindId, ProviderDefinition> = {
  ANTHROPIC: {
    id: 'ANTHROPIC',
    title: 'Anthropic API',
    subtitle: 'Usage billed through Console (Claude 3.7 / 3.5 Sonnet)',
    protocol: 'anthropic',
    defaultBaseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-3-7-sonnet-20250219',
  },
  LLM_ROUTER: {
    id: 'LLM_ROUTER',
    title: 'OpenRouter',
    subtitle: 'Use your OpenRouter API key',
    protocol: 'openrouter',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-3.7-sonnet',
  },
  DEEPSEEK: {
    id: 'DEEPSEEK',
    title: 'DeepSeek',
    subtitle: 'Use your DeepSeek API key',
    protocol: 'anthropic_gateway',
    defaultBaseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
  },
  KIMI: {
    id: 'KIMI',
    title: 'Kimi',
    subtitle: 'Anthropic-compatible Moonshot endpoint',
    protocol: 'anthropic_gateway',
    defaultBaseUrl: 'https://api.moonshot.ai/v1',
    defaultModel: 'moonshot-v1-auto',
    experimental: true,
  },
  CLAUDE: {
    id: 'CLAUDE',
    title: 'Claude direct token',
    subtitle: 'Custom Anthropic Token / Session',
    protocol: 'anthropic',
    defaultBaseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-3-5-sonnet-latest',
  },
  OPENCODE_ZEN: {
    id: 'OPENCODE_ZEN',
    title: 'OpenCode Zen',
    subtitle: 'Models through OpenCode Zen gateway',
    protocol: 'openai_responses',
    defaultBaseUrl: 'https://opencode.ai/zen/v1',
    defaultModel: 'deepseek-v4-flash',
    fixedBaseUrl: true,
  },
  NVIDIA_NIM: {
    id: 'NVIDIA_NIM',
    title: 'NVIDIA NIM',
    subtitle: 'OpenAI-compatible models hosted by NVIDIA',
    protocol: 'openai_chat',
    defaultBaseUrl: 'https://integrate.api.nvidia.com/v1',
    defaultModel: 'qwen/qwen2.5-coder-32b-instruct',
    fixedBaseUrl: true,
  },
  CUSTOM: {
    id: 'CUSTOM',
    title: 'Custom API',
    subtitle: 'Anthropic or OpenAI-compatible endpoint',
    protocol: 'anthropic_gateway',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    experimental: true,
  },
};

export type AgentKind = 'claude-code' | 'deepseek-harness' | 'antigravity';

export interface ProviderProfile {
  kind: ProviderKindId;
  baseUrl: string;
  model: string;
  apiKey: string;
  dshApi?: string;
  openRouterProviderOrder?: string;
}

export type ProjectKind = 'PROJECT' | 'QUICK_PROJECT';
export type ProjectType = 'GENERAL' | 'ANDROID';
export type AndroidTemplate = 'COMPOSE' | 'XML';

export interface ProjectFile {
  path: string; // e.g. "src/main.py" or "index.html"
  name: string;
  content: string;
  isBinary?: boolean;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  language: string;
  slug: string;
  rootPath: string;
  updatedAtMillis: number;
  kind: ProjectKind;
  type: ProjectType;
  androidTemplate?: AndroidTemplate;
  files: Record<string, ProjectFile>;
}

export interface ActivityItem {
  title: string;
  detail: string;
  isComplete: boolean;
  isCommand?: boolean;
}

export type DiffLineType = 'CONTEXT' | 'ADDITION' | 'DELETION' | 'INFO';

export interface DiffLine {
  type: DiffLineType;
  text: string;
  oldLine?: number;
  newLine?: number;
}

export interface ChangeItem {
  path: string;
  additions: number;
  deletions: number;
  diffLines: DiffLine[];
  binary?: boolean;
  accepted?: boolean | null;
}

export type RiskLevel = 'SAFE' | 'REVIEW' | 'HIGH';

export interface ToolRequest {
  approvalId: string;
  sessionId: string;
  toolName: string;
  explanation: string;
  affectedPaths: string[];
  commandPreview?: string;
  risk: RiskLevel;
}

export interface ChatAttachment {
  id: string;
  displayName: string;
  relativePath: string;
  mimeType: string;
  sizeBytes: number;
  content?: string;
}

export interface ChatMessage {
  id: string;
  fromUser: boolean;
  text: string;
  createdAt: number;
  attachments?: ChatAttachment[];
  workItems?: ActivityItem[];
  workedMillis?: number;
  thinking?: string;
}

export interface ProjectChat {
  id: string;
  title: string;
  createdAtMillis: number;
  updatedAtMillis: number;
  messages: ChatMessage[];
}

export interface TerminalOutputLine {
  id: string;
  command: string;
  output: string;
  exitCode: number;
  timestamp: number;
}

export interface InstalledPythonPackage {
  name: string;
  version: string;
  summary?: string;
}

export interface WorkspaceEntry {
  path: string;
  name: string;
  isDirectory: boolean;
  depth: number;
  sizeBytes?: number;
  childCount?: number;
  isExpanded?: boolean;
}
