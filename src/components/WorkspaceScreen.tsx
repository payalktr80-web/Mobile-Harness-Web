import React, { useState } from 'react';
import { Project, ProjectFile, ProviderProfile, ActivityItem, ChangeItem, ChatMessage } from '../types/models';
import { WorkspaceTab } from './BottomNavBar';
import { ChatTab } from './workspace/ChatTab';
import { FilesTab } from './workspace/FilesTab';
import { TerminalTab } from './workspace/TerminalTab';
import { ChangesTab } from './workspace/ChangesTab';
import { PreviewTab } from './workspace/PreviewTab';
import { runClaudeCodeReplicate } from '../services/claudeCodeReplicate';
import { VirtualGitEngine } from '../services/gitService';
import { AppThemeMode } from '../theme/colors';

interface WorkspaceScreenProps {
  project: Project;
  activeTab: WorkspaceTab;
  provider: ProviderProfile;
  themeMode: AppThemeMode;
  onToggleTheme: () => void;
  onUpdateProjectFiles: (files: Record<string, ProjectFile>) => void;
  onChangesCountChange?: (count: number) => void;
}

export const WorkspaceScreen: React.FC<WorkspaceScreenProps> = ({
  project,
  activeTab,
  provider,
  themeMode,
  onToggleTheme,
  onUpdateProjectFiles,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_msg',
      fromUser: false,
      text: `Workspace initialized for **${project.name}**.\n\nYou have access to Python 3.12 WebAssembly, micropip, Git, and Claude Code replicate. What would you like to build today?`,
      createdAt: Date.now(),
    },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [liveThinking, setLiveThinking] = useState('');
  const [liveActivities, setLiveActivities] = useState<ActivityItem[]>([]);
  const [pendingCommandInTerminal, setPendingCommandInTerminal] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Snapshot before changes
  const [initialFilesSnapshot, setInitialFilesSnapshot] = useState<Record<string, ProjectFile>>({
    ...project.files,
  });

  const gitEngine = new VirtualGitEngine(initialFilesSnapshot);
  const changes = gitEngine.computeDiff(initialFilesSnapshot, project.files);

  const handleSendMessage = async (text: string) => {
    if (isRunning) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      fromUser: true,
      text,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsRunning(true);
    setLiveThinking('');
    setLiveActivities([]);

    const controller = new AbortController();
    setAbortController(controller);

    const assistantMsgId = `asst_${Date.now()}`;
    let accumulatedDelta = '';
    let accumulatedThinking = '';
    const activitiesAccumulator: ActivityItem[] = [];

    try {
      const response = await runClaudeCodeReplicate(
        text,
        messages,
        project.files,
        provider,
        {
          onDelta: (delta) => {
            accumulatedDelta += delta;
            setMessages((prev) => {
              const existingIdx = prev.findIndex((m) => m.id === assistantMsgId);
              if (existingIdx !== -1) {
                const next = [...prev];
                next[existingIdx] = {
                  ...next[existingIdx],
                  text: accumulatedDelta,
                  thinking: accumulatedThinking || undefined,
                };
                return next;
              } else {
                return [
                  ...prev,
                  {
                    id: assistantMsgId,
                    fromUser: false,
                    text: accumulatedDelta,
                    createdAt: Date.now(),
                    thinking: accumulatedThinking || undefined,
                  },
                ];
              }
            });
          },
          onThinking: (thought) => {
            accumulatedThinking += thought;
            setLiveThinking(accumulatedThinking);
          },
          onActivity: (act) => {
            setLiveActivities((prev) => [...prev.filter((a) => a.title !== act.title), act]);
            activitiesAccumulator.push(act);
          },
          onFilesChanged: (newFiles) => {
            onUpdateProjectFiles(newFiles);
          },
        },
        controller.signal
      );

      // Attach finalized activities to assistant message
      setMessages((prev) => {
        const existingIdx = prev.findIndex((m) => m.id === assistantMsgId);
        if (existingIdx !== -1) {
          const next = [...prev];
          next[existingIdx] = {
            ...next[existingIdx],
            workItems: activitiesAccumulator,
          };
          return next;
        }
        return prev;
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            fromUser: false,
            text: `Agent Error: ${err.message || String(err)}`,
            createdAt: Date.now(),
          },
        ]);
      }
    } finally {
      setIsRunning(false);
      setLiveThinking('');
      setLiveActivities([]);
      setAbortController(null);
    }
  };

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
    }
    setIsRunning(false);
  };

  const handleSaveFile = (path: string, content: string) => {
    const updated = {
      ...project.files,
      [path]: {
        path,
        name: path.split('/').pop() || path,
        content,
        updatedAt: Date.now(),
      },
    };
    onUpdateProjectFiles(updated);
  };

  const handleDeleteFile = (path: string) => {
    const updated = { ...project.files };
    delete updated[path];
    onUpdateProjectFiles(updated);
  };

  const handleCreateFile = (path: string, content = '') => {
    const updated = {
      ...project.files,
      [path]: {
        path,
        name: path.split('/').pop() || path,
        content,
        updatedAt: Date.now(),
      },
    };
    onUpdateProjectFiles(updated);
  };

  const handleRunPythonInTerminal = (path: string) => {
    setPendingCommandInTerminal(`python3 ${path}`);
  };

  const handleKeepChanges = () => {
    setInitialFilesSnapshot({ ...project.files });
  };

  const handleUndoChanges = () => {
    onUpdateProjectFiles({ ...initialFilesSnapshot });
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {activeTab === 'chat' && (
        <ChatTab
          messages={messages}
          isRunning={isRunning}
          onSendMessage={handleSendMessage}
          onStop={handleStop}
          liveThinking={liveThinking}
          liveActivities={liveActivities}
        />
      )}

      {activeTab === 'files' && (
        <FilesTab
          files={project.files}
          onSaveFile={handleSaveFile}
          onDeleteFile={handleDeleteFile}
          onCreateFile={handleCreateFile}
          onRunPythonFile={handleRunPythonInTerminal}
        />
      )}

      {activeTab === 'terminal' && (
        <TerminalTab
          files={project.files}
          cwd={project.rootPath || `/workspace/${project.slug}`}
          provider={provider}
          onFilesChanged={onUpdateProjectFiles}
          themeMode={themeMode}
          onToggleTheme={onToggleTheme}
          initialCommand={pendingCommandInTerminal}
          onInitialCommandConsumed={() => setPendingCommandInTerminal(null)}
        />
      )}

      {activeTab === 'changes' && (
        <ChangesTab
          changes={changes}
          onKeepChanges={handleKeepChanges}
          onUndoChanges={handleUndoChanges}
        />
      )}

      {activeTab === 'preview' && <PreviewTab files={project.files} />}
    </div>
  );
};
