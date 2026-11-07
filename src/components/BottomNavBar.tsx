import React from 'react';
import { Folder, Bot, Settings, Sparkles, Terminal, GitCompare, Eye } from 'lucide-react';

export type RootTab = 'projects' | 'agent' | 'settings';
export type WorkspaceTab = 'chat' | 'files' | 'terminal' | 'changes' | 'preview';

interface BottomNavBarProps {
  inWorkspace: boolean;
  activeRootTab: RootTab;
  onSelectRootTab: (tab: RootTab) => void;
  activeWorkspaceTab: WorkspaceTab;
  onSelectWorkspaceTab: (tab: WorkspaceTab) => void;
  changesCount?: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  inWorkspace,
  activeRootTab,
  onSelectRootTab,
  activeWorkspaceTab,
  onSelectWorkspaceTab,
  changesCount = 0,
}) => {
  if (inWorkspace) {
    const tabs: Array<{ id: WorkspaceTab; label: string; icon: React.FC<{ size?: number }> }> = [
      { id: 'chat', label: 'Chat', icon: Sparkles },
      { id: 'files', label: 'Files', icon: Folder },
      { id: 'terminal', label: 'Terminal', icon: Terminal },
      { id: 'changes', label: 'Changes', icon: GitCompare },
      { id: 'preview', label: 'Preview', icon: Eye },
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
                padding: '6px 0',
                position: 'relative',
              }}
            >
              <div
                style={{
                  padding: '4px 16px',
                  borderRadius: 16,
                  backgroundColor: selected ? 'rgba(242, 140, 82, 0.16)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s ease',
                }}
              >
                <IconComponent size={20} color={selected ? 'var(--primary)' : 'var(--text-muted)'} />
                {tab.id === 'changes' && changesCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: '30%',
                      backgroundColor: 'var(--primary)',
                      color: 'var(--on-primary)',
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 10,
                      padding: '1px 5px',
                    }}
                  >
                    {changesCount}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: selected ? 600 : 500,
                  color: selected ? 'var(--primary)' : 'var(--text-muted)',
                  letterSpacing: '0.2px',
                }}
              >
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
    { id: 'projects', label: 'Projects', icon: Folder },
    { id: 'agent', label: 'Agent', icon: Bot },
    { id: 'settings', label: 'Settings', icon: Settings },
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
              padding: '6px 0',
            }}
          >
            <div
              style={{
                padding: '4px 20px',
                borderRadius: 16,
                backgroundColor: selected ? 'rgba(242, 140, 82, 0.16)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s ease',
              }}
            >
              <IconComponent size={22} color={selected ? 'var(--primary)' : 'var(--text-muted)'} />
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: selected ? 600 : 500,
                color: selected ? 'var(--primary)' : 'var(--text-muted)',
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
