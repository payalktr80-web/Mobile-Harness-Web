import React, { useState } from 'react';
import { GitCompare, Check, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { ChangeItem } from '../../types/models';

interface ChangesTabProps {
  changes: ChangeItem[];
  onKeepChanges: () => void;
  onUndoChanges: () => void;
}

export const ChangesTab: React.FC<ChangesTabProps> = ({
  changes,
  onKeepChanges,
  onUndoChanges,
}) => {
  const [collapsedPaths, setCollapsedPaths] = useState<Record<string, boolean>>({});

  const toggleCollapse = (path: string) => {
    setCollapsedPaths((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid var(--outline-variant)',
          backgroundColor: 'var(--surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GitCompare size={18} color="var(--primary)" />
          <span style={{ fontSize: 13, fontWeight: 700 }}>
            Changes ({changes.length} {changes.length === 1 ? 'file' : 'files'})
          </span>
        </div>

        {changes.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="chip chip-active"
              onClick={onKeepChanges}
              style={{ padding: '4px 10px', fontSize: 11.5 }}
              title="Accept all changes"
            >
              <Check size={13} />
              <span>Keep All</span>
            </button>
            <button
              className="chip"
              onClick={onUndoChanges}
              style={{ padding: '4px 10px', fontSize: 11.5, color: 'var(--error)' }}
              title="Revert all changes"
            >
              <RotateCcw size={13} />
              <span>Undo All</span>
            </button>
          </div>
        )}
      </div>

      {/* Diff Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {changes.length === 0 ? (
          <div
            style={{
              margin: 'auto',
              textAlign: 'center',
              padding: 30,
              color: 'var(--text-muted)',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: 'rgba(105, 214, 158, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto',
              }}
            >
              <Check size={24} color="var(--tertiary)" />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>
              Working tree clean
            </div>
            <p style={{ fontSize: 12.5 }}>No unstaged file modifications detected.</p>
          </div>
        ) : (
          changes.map((item) => {
            const isCollapsed = collapsedPaths[item.path];
            return (
              <div
                key={item.path}
                className="surface-card"
                style={{ padding: 0, overflow: 'hidden' }}
              >
                {/* File Header */}
                <div
                  onClick={() => toggleCollapse(item.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: 'var(--surface-variant)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13 }}>
                    {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                    <span>{item.path}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700 }}>
                    {item.additions > 0 && (
                      <span style={{ color: 'var(--tertiary)' }}>+{item.additions}</span>
                    )}
                    {item.deletions > 0 && (
                      <span style={{ color: 'var(--error)' }}>-{item.deletions}</span>
                    )}
                  </div>
                </div>

                {/* Diff Lines */}
                {!isCollapsed && (
                  <div
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 12,
                      lineHeight: 1.5,
                      overflowX: 'auto',
                      backgroundColor: '#090D14',
                    }}
                  >
                    {item.diffLines.map((line, lIdx) => {
                      let bg = 'transparent';
                      let color = '#C9D1D9';
                      let prefix = ' ';
                      if (line.type === 'ADDITION') {
                        bg = 'rgba(105, 214, 158, 0.15)';
                        color = '#69D69E';
                        prefix = '+';
                      } else if (line.type === 'DELETION') {
                        bg = 'rgba(255, 107, 107, 0.15)';
                        color = '#FF6B6B';
                        prefix = '-';
                      }

                      return (
                        <div
                          key={lIdx}
                          style={{
                            display: 'flex',
                            backgroundColor: bg,
                            color,
                            padding: '1px 8px',
                            whiteSpace: 'pre',
                          }}
                        >
                          <span
                            style={{
                              width: 36,
                              textAlign: 'right',
                              paddingRight: 10,
                              color: '#6E7681',
                              userSelect: 'none',
                            }}
                          >
                            {line.newLine || line.oldLine || ''}
                          </span>
                          <span style={{ width: 14, userSelect: 'none', fontWeight: 700 }}>
                            {prefix}
                          </span>
                          <span>{line.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
