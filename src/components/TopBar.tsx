import React from 'react';
import { ArrowLeft, Moon, Sun, Play, History, Loader2, Sparkles } from 'lucide-react';
import { BrandMark } from './BrandMark';
import { AppThemeMode } from '../theme/colors';
import { Project } from '../types/models';
import { LanguageCode, translate } from '../i18n/i18n';

interface TopBarProps {
  activeProject: Project | null;
  onBackToProjects: () => void;
  themeMode: AppThemeMode;
  onToggleTheme: () => void;
  isRunning?: boolean;
  terminalRunning?: boolean;
  onRunProjectPreview?: () => void;
  onOpenHistory?: () => void;
  currentLanguage?: LanguageCode;
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
  currentLanguage = 'en',
}) => {
  const t = (k: string, fallback: string) => {
    const res = translate(k, currentLanguage);
    return res === k ? fallback : res;
  };

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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {activeProject.name}
                </span>
                {activeProject.kind === 'QUICK_PROJECT' && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      backgroundColor: 'rgba(242, 140, 82, 0.15)',
                      color: 'var(--primary)',
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    QUICK
                  </span>
                )}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {activeProject.language} • {activeProject.type}
              </span>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BrandMark size={28} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.3 }}>
                Mobile Harness
              </span>
              <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                Web Autonomous IDE
              </span>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {activeProject && onRunProjectPreview && (
          <button
            onClick={onRunProjectPreview}
            className="chip"
            style={{
              backgroundColor: 'rgba(242, 140, 82, 0.15)',
              color: 'var(--primary)',
              fontWeight: 700,
              fontSize: 12,
              padding: '6px 12px',
            }}
          >
            <Play size={14} fill="var(--primary)" />
            <span>{t('action_preview', 'Run Preview')}</span>
          </button>
        )}

        <button
          onClick={onToggleTheme}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text)',
            cursor: 'pointer',
            padding: 8,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {themeMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
};
