import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Paperclip,
  Brain,
  CheckCircle2,
  Terminal,
  FileCode,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ChatMessage, ActivityItem, ToolRequest } from '../../types/models';

interface ChatTabProps {
  messages: ChatMessage[];
  isRunning: boolean;
  onSendMessage: (text: string) => void;
  onStop: () => void;
  liveThinking?: string;
  liveActivities?: ActivityItem[];
  pendingApproval?: ToolRequest | null;
  onApproval?: (approved: boolean) => void;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  messages,
  isRunning,
  onSendMessage,
  onStop,
  liveThinking,
  liveActivities = [],
  pendingApproval,
  onApproval,
}) => {
  const [inputText, setInputText] = useState('');
  const [expandedThinkingIds, setExpandedThinkingIds] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, liveThinking, liveActivities]);

  const handleSend = () => {
    if (!inputText.trim() || isRunning) return;
    onSendMessage(inputText.trim());
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleThinking = (id: string) => {
    setExpandedThinkingIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Messages Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              margin: 'auto',
              textAlign: 'center',
              padding: 24,
              color: 'var(--text-muted)',
              maxWidth: 320,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: 'rgba(242, 140, 82, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto',
              }}
            >
              <Brain size={24} color="var(--primary)" />
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 6 }}>
              Claude Code Assistant
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.5 }}>
              Ask to generate scripts, install python libraries, modify files, run builds, or debug code.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignSelf: msg.fromUser ? 'flex-end' : 'flex-start',
              maxWidth: msg.fromUser ? '85%' : '95%',
              gap: 6,
            }}
          >
            {/* Thinking Accordion (if present) */}
            {msg.thinking && (
              <div
                style={{
                  backgroundColor: 'rgba(142, 168, 255, 0.08)',
                  border: '1px solid rgba(142, 168, 255, 0.25)',
                  borderRadius: 12,
                  padding: '8px 12px',
                  marginBottom: 4,
                  fontSize: 12,
                }}
              >
                <div
                  onClick={() => toggleThinking(msg.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    color: 'var(--secondary)',
                    fontWeight: 600,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Brain size={14} />
                    <span>Claude Thought Process</span>
                  </div>
                  {expandedThinkingIds[msg.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>

                {expandedThinkingIds[msg.id] && (
                  <div
                    style={{
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: '1px solid rgba(142, 168, 255, 0.2)',
                      color: 'var(--text-muted)',
                      fontFamily: 'JetBrains Mono, monospace',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.4,
                      fontSize: 11.5,
                      maxHeight: 200,
                      overflowY: 'auto',
                    }}
                  >
                    {msg.thinking}
                  </div>
                )}
              </div>
            )}

            {/* Message Bubble */}
            <div
              style={{
                backgroundColor: msg.fromUser ? 'var(--primary)' : 'var(--surface)',
                color: msg.fromUser ? 'var(--on-primary)' : 'var(--text)',
                padding: '12px 16px',
                borderRadius: msg.fromUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                border: msg.fromUser ? 'none' : '1px solid var(--outline)',
                fontSize: 14,
                lineHeight: 1.5,
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                boxShadow: msg.fromUser
                  ? '0 2px 8px rgba(242, 140, 82, 0.25)'
                  : '0 2px 8px rgba(0, 0, 0, 0.2)',
              }}
            >
              {msg.text}
            </div>

            {/* Attached Work Items / Tools */}
            {msg.workItems && msg.workItems.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                {msg.workItems.map((act, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      backgroundColor: 'rgba(27, 34, 45, 0.5)',
                      border: '1px solid var(--outline)',
                      borderRadius: 8,
                      padding: '6px 10px',
                      fontSize: 12,
                    }}
                  >
                    {act.isCommand ? (
                      <Terminal size={14} color="var(--primary)" />
                    ) : (
                      <FileCode size={14} color="var(--tertiary)" />
                    )}
                    <span style={{ fontWeight: 600 }}>{act.title}:</span>
                    <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {act.detail}
                    </span>
                    <CheckCircle2 size={13} color="var(--tertiary)" style={{ marginLeft: 'auto' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Live Running Indicators */}
        {isRunning && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: '95%' }}>
            {liveThinking && (
              <div
                style={{
                  backgroundColor: 'rgba(142, 168, 255, 0.1)',
                  border: '1px solid rgba(142, 168, 255, 0.3)',
                  borderRadius: 12,
                  padding: '8px 12px',
                  fontSize: 12,
                  color: 'var(--secondary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Thinking...</span>
                </div>
                <div style={{ marginTop: 4, fontSize: 11.5, color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
                  {liveThinking.slice(-200)}
                </div>
              </div>
            )}

            {liveActivities.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {liveActivities.map((act, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      backgroundColor: 'rgba(27, 34, 45, 0.7)',
                      border: '1px solid var(--outline)',
                      borderRadius: 8,
                      padding: '6px 10px',
                      fontSize: 12,
                    }}
                  >
                    <Loader2 size={13} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontWeight: 600 }}>{act.title}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{act.detail}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pending Tool Approval Card */}
        {pendingApproval && (
          <div
            style={{
              backgroundColor: 'rgba(242, 140, 82, 0.12)',
              border: '1px solid var(--primary)',
              borderRadius: 16,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              maxWidth: 420,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontWeight: 700 }}>
              <AlertTriangle size={18} />
              <span>Permission Request</span>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.4 }}>
              Claude Code wants to run <strong>{pendingApproval.toolName}</strong>:
            </div>
            {pendingApproval.commandPreview && (
              <div
                style={{
                  backgroundColor: '#0B0E14',
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 12,
                  color: 'var(--tertiary)',
                }}
              >
                {pendingApproval.commandPreview}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                className="btn-primary"
                style={{ flex: 1, padding: '8px 12px', fontSize: 13 }}
                onClick={() => onApproval?.(true)}
              >
                Allow
              </button>
              <button
                className="btn-outlined"
                style={{ flex: 1, padding: '8px 12px', fontSize: 13 }}
                onClick={() => onApproval?.(false)}
              >
                Deny
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div
        style={{
          padding: '10px 14px 14px 14px',
          borderTop: '1px solid var(--outline-variant)',
          backgroundColor: 'var(--surface)',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 10,
        }}
      >
        <button
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 8,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 2,
          }}
          title="Attach File"
          onClick={() => alert('Attachments can be placed directly in the Files tab.')}
        >
          <Paperclip size={20} />
        </button>

        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask Claude Code anything..."
          style={{
            flex: 1,
            backgroundColor: 'var(--bg)',
            border: '1px solid var(--outline)',
            borderRadius: 14,
            padding: '10px 14px',
            color: 'var(--text)',
            fontSize: 14,
            lineHeight: 1.4,
            resize: 'none',
            outline: 'none',
            minHeight: 42,
            maxHeight: 120,
            fontFamily: 'inherit',
          }}
          rows={1}
        />

        {isRunning ? (
          <button
            onClick={onStop}
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              backgroundColor: 'var(--error)',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 10px rgba(255, 107, 107, 0.4)',
            }}
            title="Stop generation"
          >
            <Square size={16} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              color: 'var(--on-primary)',
              border: 'none',
              cursor: inputText.trim() ? 'pointer' : 'not-allowed',
              opacity: inputText.trim() ? 1 : 0.4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 10px rgba(242, 140, 82, 0.35)',
              transition: 'opacity 0.15s ease',
            }}
            title="Send"
          >
            <Send size={18} />
          </button>
        )}
      </div>
    </div>
  );
};
