import React from 'react';
import { ArrowLeft, Moon, Sun, Play, History, Loader2, Sparkles } from 'lucide-react';
import { BrandMark } from './BrandMark';
import { AppThemeMode } from '../theme/colors';
import { Project } from '../types/models';

interface TopBarProps {
  activeProject: Project | null;
  onBackToProjects: () => void;
  themeMode: AppThemeMode;
  onToggleTheme: () => void;
  isRunning?: boolean;
  terminalRunning?: boolean;
  onRunProjectPreview?: () => void;
  onOpenHistory?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeProject,
  onBackToProjects,
  themeMode,
  onToggleTheme,
  isRunning = false,
  terminalRunning = false,
  onRunProjectPreview,
  onOpenHistory,
}) => {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--outline-variant)',
        backgroundColor: 'var(--bg)',
        zIndex: 40,
        minHeight: 56,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
        {activeProject ? (
          <>
            <button
              onClick={onBackToProjects}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 6,
                borderRadius: 8,
              }}
              title="Back to Projects"
            >
              <ArrowLeft size={20} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                {activeProject.name}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                /workspace/{activeProject.slug}
              </span>
            </div>
          </>
        ) : (
          <>
            <BrandMark size={28} compact />
            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.3px' }}>
              Mobile Harness
            </span>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {isRunning && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              backgroundColor: 'rgba(242, 140, 82, 0.15)',
              padding: '4px 8px',
              borderRadius: 12,
              border: '1px solid rgba(242, 140, 82, 0.3)',
            }}
          >
            <Loader2 size={13} className="spin" color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)' }}>Agent active</span>
          </div>
        )}

        {terminalRunning && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              backgroundColor: 'rgba(105, 214, 158, 0.15)',
              padding: '4px 8px',
              borderRadius: 12,
              border: '1px solid rgba(105, 214, 158, 0.3)',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: 'var(--tertiary)',
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--tertiary)' }}>Terminal</span>
          </div>
        )}

        {activeProject && onRunProjectPreview && (
          <button
            onClick={onRunProjectPreview}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Run and Preview"
          >
            <Play size={19} />
          </button>
        )}

        <button
          onClick={onToggleTheme}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 6,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Toggle Theme"
        >
          {themeMode === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        </button>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  );
};
