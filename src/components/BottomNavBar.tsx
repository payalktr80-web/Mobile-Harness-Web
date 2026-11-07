import React from 'react';
import { Folder, Bot, Settings, Sparkles, Terminal, GitCompare, Eye } from 'lucide-react';
import { LanguageCode, translate } from '../i18n/i18n';

export type RootTab = 'projects' | 'agent' | 'settings';
export type WorkspaceTab = 'chat' | 'files' | 'terminal' | 'changes' | 'preview';

interface BottomNavBarProps {
  inWorkspace: boolean;
  activeRootTab: RootTab;
  onSelectRootTab: (tab: RootTab) => void;
  activeWorkspaceTab: WorkspaceTab;
  onSelectWorkspaceTab: (tab: WorkspaceTab) => void;
  changesCount?: number;
  currentLanguage?: LanguageCode;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  inWorkspace,
  activeRootTab,
  onSelectRootTab,
  activeWorkspaceTab,
  onSelectWorkspaceTab,
  changesCount = 0,
  currentLanguage = 'en',
}) => {
  const t = (k: string, fallback: string) => {
    const res = translate(k, currentLanguage);
    return res === k ? fallback : res;
  };

  if (inWorkspace) {
    const tabs: Array<{ id: WorkspaceTab; label: string; icon: React.FC<{ size?: number }> }> = [
      { id: 'chat', label: t('tab_chat', 'Chat'), icon: Sparkles },
      { id: 'files', label: t('tab_files', 'Files'), icon: Folder },
      { id: 'terminal', label: t('tab_terminal', 'Terminal'), icon: Terminal },
      { id: 'changes', label: t('tab_changes', 'Changes'), icon: GitCompare },
      { id: 'preview', label: t('tab_preview', 'Preview'), icon: Eye },
    ];

    return (
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          height: 64,
          backgroundColor: 'var(--surface)',
          borderTop: '1px solid var(--outline-variant)',
          zIndex: 40,
        }}
      >
        {tabs.map((tab) => {
          const selected = activeWorkspaceTab === tab.id;
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectWorkspaceTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                cursor: 'pointer',
                flex: 1,
                padding: '8px 0',
                color: selected ? 'var(--primary)' : 'var(--text-muted)',
                position: 'relative',
              }}
            >
              <div style={{ position: 'relative' }}>
                <IconComponent size={20} />
                {tab.id === 'changes' && changesCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -8,
                      backgroundColor: 'var(--primary)',
                      color: '#FFFFFF',
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 10,
                      padding: '1px 5px',
                      lineHeight: 1,
                    }}
                  >
                    {changesCount}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 11, fontWeight: selected ? 700 : 500 }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    );
  }

  // Root Navigation
  const rootTabs: Array<{ id: RootTab; label: string; icon: React.FC<{ size?: number }> }> = [
    { id: 'projects', label: t('tab_projects', 'Projects'), icon: Folder },
    { id: 'agent', label: t('tab_agent', 'Claude Code'), icon: Sparkles },
    { id: 'settings', label: t('tab_settings', 'Settings'), icon: Settings },
  ];

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        height: 64,
        backgroundColor: 'var(--surface)',
        borderTop: '1px solid var(--outline-variant)',
        zIndex: 40,
      }}
    >
      {rootTabs.map((tab) => {
        const selected = activeRootTab === tab.id;
        const IconComponent = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectRootTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              cursor: 'pointer',
              flex: 1,
              padding: '8px 0',
              color: selected ? 'var(--primary)' : 'var(--text-muted)',
            }}
          >
            <IconComponent size={20} />
            <span style={{ fontSize: 11, fontWeight: selected ? 700 : 500 }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
