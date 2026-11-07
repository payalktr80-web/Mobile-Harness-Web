import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  Trash2,
  Square,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sun,
  Moon,
} from 'lucide-react';
import { TerminalOutputLine, ProjectFile, ProviderProfile } from '../../types/models';
import { executeTerminalCommand } from '../../services/terminalEngine';
import { AppThemeMode } from '../../theme/colors';

interface TerminalTabProps {
  files: Record<string, ProjectFile>;
  cwd: string;
  provider: ProviderProfile;
  onFilesChanged: (files: Record<string, ProjectFile>) => void;
  themeMode?: AppThemeMode;
  onToggleTheme?: () => void;
  initialCommand?: string | null;
  onInitialCommandConsumed?: () => void;
}

export const TerminalTab: React.FC<TerminalTabProps> = ({
  files,
  cwd,
  provider,
  onFilesChanged,
  themeMode = 'dark',
  onToggleTheme,
  initialCommand,
  onInitialCommandConsumed,
}) => {
  const [lines, setLines] = useState<TerminalOutputLine[]>([
    {
      id: 'init_welcome',
      command: 'echo "Welcome to Mobile Harness Web Userspace"',
      output: 'Welcome to Mobile Harness Web Userspace\nPython 3.12 WebAssembly, micropip, Git, and Claude Code ready.',
      exitCode: 0,
      timestamp: Date.now(),
    },
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [currentCommand, setCurrentCommand] = useState<string | null>(null);
  const [liveStream, setLiveStream] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [ctrlActive, setCtrlActive] = useState(false);
  const [altActive, setAltActive] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const promptPath = cwd.replace('/workspace', '~') || '~';

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [lines, liveStream, isRunning]);

  const runCommand = async (cmdToRun: string) => {
    if (!cmdToRun.trim() || isRunning) return;
    const cmd = cmdToRun.trim();
    setHistory((prev) => [...prev, cmd]);
    setHistoryIdx(-1);
    setIsRunning(true);
    setCurrentCommand(cmd);
    setLiveStream('');

    try {
      const res = await executeTerminalCommand({
        command: cmd,
        files,
        cwd,
        provider,
        onFilesChanged,
        onStreamOutput: (chunk) => {
          setLiveStream((prev) => prev + chunk);
        },
      });

      setLines((prev) => [...prev, res]);
    } catch (err: any) {
      setLines((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          command: cmd,
          output: `Error: ${err.message || String(err)}`,
          exitCode: 1,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsRunning(false);
      setCurrentCommand(null);
      setLiveStream('');
      setCurrentInput('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  useEffect(() => {
    if (initialCommand && initialCommand.trim()) {
      runCommand(initialCommand.trim());
      onInitialCommandConsumed?.();
    }
  }, [initialCommand]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      runCommand(currentInput);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(nextIdx);
        setCurrentInput(history[nextIdx] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx !== -1) {
        const nextIdx = historyIdx + 1;
        if (nextIdx < history.length) {
          setHistoryIdx(nextIdx);
          setCurrentInput(history[nextIdx] || '');
        } else {
          setHistoryIdx(-1);
          setCurrentInput('');
        }
      }
    } else if (e.key === 'c' && (e.ctrlKey || ctrlActive)) {
      e.preventDefault();
      if (isRunning) {
        setIsRunning(false);
        setCurrentCommand(null);
      } else {
        setCurrentInput('');
      }
      setCtrlActive(false);
    }
  };

  const quickCommands = [
    'uname -a',
    'ls -la',
    'pwd',
    'python3 --version',
    'python3 main.py',
    'pip list',
    'pip install requests',
    'df -h',
    'free -m',
    'claude --version',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Terminal Top Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          borderBottom: '1px solid var(--outline-variant)',
          backgroundColor: 'var(--surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: 'rgba(242, 140, 82, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TerminalIcon size={18} color="var(--primary)" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Terminal</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
              Isolated userspace • Python 3.12 & WebContainer
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isRunning && (
            <button
              onClick={() => setIsRunning(false)}
              style={{
                backgroundColor: 'var(--error-container)',
                color: 'var(--error)',
                border: 'none',
                borderRadius: 14,
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
              }}
            >
              <Square size={11} fill="currentColor" />
              <span>Stop</span>
            </button>
          )}

          <button
            onClick={() => setLines([])}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 6,
            }}
            title="Clear Console"
          >
            <Trash2 size={16} />
          </button>

          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 6,
              }}
            >
              {themeMode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Quick Command Chips */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '6px 12px',
          overflowX: 'auto',
          backgroundColor: 'rgba(19, 24, 33, 0.5)',
          borderBottom: '1px solid var(--outline)',
          flexShrink: 0,
        }}
      >
        {quickCommands.map((cmd) => (
          <button
            key={cmd}
            className="chip"
            onClick={() => runCommand(cmd)}
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              padding: '3px 8px',
              borderRadius: 8,
            }}
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Terminal Console Output Area */}
      <div
        ref={scrollContainerRef}
        onClick={() => inputRef.current?.focus()}
        style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: '#090D14',
          padding: '12px 14px',
          fontFamily: 'JetBrains Mono, Fira Code, monospace',
          fontSize: 12.5,
          lineHeight: 1.5,
          color: '#C9D1D9',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          cursor: 'text',
        }}
      >
        {lines.map((item) => (
          <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span style={{ color: '#69D69E', fontWeight: 700 }}>
                root@pocket:{promptPath}#
              </span>
              <span style={{ color: '#F0F6FC', fontWeight: 600 }}>{item.command}</span>
            </div>
            {item.output && (
              <div
                style={{
                  color: item.exitCode !== 0 ? '#FF6B6B' : '#C9D1D9',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  paddingLeft: 6,
                }}
              >
                {item.output}
              </div>
            )}
          </div>
        ))}

        {isRunning && currentCommand && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span style={{ color: '#69D69E', fontWeight: 700 }}>
                root@pocket:{promptPath}#
              </span>
              <span style={{ color: '#F0F6FC', fontWeight: 600 }}>{currentCommand}</span>
            </div>
            {liveStream && (
              <div style={{ color: '#C9D1D9', whiteSpace: 'pre-wrap', paddingLeft: 6 }}>
                {liveStream}
              </div>
            )}
          </div>
        )}

        {/* Active Prompt Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#69D69E', fontWeight: 700, whiteSpace: 'nowrap' }}>
            root@pocket:{promptPath}#
          </span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isRunning}
            autoFocus
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#F0F6FC',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              fontWeight: 600,
              caretColor: '#69D69E',
            }}
          />
        </div>
      </div>

      {/* Helper Keys Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          backgroundColor: 'var(--surface)',
          borderTop: '1px solid var(--outline-variant)',
          flexShrink: 0,
        }}
      >
        <button
          className="btn-outlined"
          onClick={() => {
            if (history.length > 0) {
              const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
              setHistoryIdx(nextIdx);
              setCurrentInput(history[nextIdx] || '');
            }
          }}
          style={{ padding: '6px 10px', height: 32 }}
          title="History Previous"
        >
          <ArrowUp size={15} />
        </button>

        <button
          className="btn-outlined"
          onClick={() => {
            if (historyIdx !== -1) {
              const nextIdx = historyIdx + 1;
              if (nextIdx < history.length) {
                setHistoryIdx(nextIdx);
                setCurrentInput(history[nextIdx] || '');
              } else {
                setHistoryIdx(-1);
                setCurrentInput('');
              }
            }
          }}
          style={{ padding: '6px 10px', height: 32 }}
          title="History Next"
        >
          <ArrowDown size={15} />
        </button>

        <button
          className={`chip ${ctrlActive ? 'chip-active' : ''}`}
          onClick={() => setCtrlActive(!ctrlActive)}
          style={{ padding: '4px 12px', height: 32, fontWeight: 700, fontFamily: 'monospace' }}
        >
          CTRL {ctrlActive ? '✓' : ''}
        </button>

        <button
          className={`chip ${altActive ? 'chip-active' : ''}`}
          onClick={() => setAltActive(!altActive)}
          style={{ padding: '4px 12px', height: 32, fontWeight: 700, fontFamily: 'monospace' }}
        >
          ALT {altActive ? '✓' : ''}
        </button>

        <button
          className="chip"
          onClick={() => {
            if (isRunning) {
              setIsRunning(false);
              setCurrentCommand(null);
            } else {
              setCurrentInput('');
            }
          }}
          style={{ padding: '4px 12px', height: 32, fontFamily: 'monospace' }}
        >
          ESC
        </button>

        <button
          className="chip"
          onClick={() => {
            // Auto complete from files
            const tokens = currentInput.split(' ');
            const lastToken = tokens[tokens.length - 1];
            if (lastToken) {
              const matched = Object.keys(files).find((f) => f.startsWith(lastToken));
              if (matched) {
                tokens[tokens.length - 1] = matched;
                setCurrentInput(tokens.join(' '));
              }
            }
          }}
          style={{ padding: '4px 12px', height: 32, fontFamily: 'monospace', marginLeft: 'auto' }}
        >
          TAB
        </button>
      </div>
    </div>
  );
};
