import React from 'react';
import { X } from 'lucide-react';
import { TerminalTab } from './workspace/TerminalTab';
import { ProjectFile, ProviderProfile } from '../types/models';
import { AppThemeMode } from '../theme/colors';

interface QuickTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: Record<string, ProjectFile>;
  cwd: string;
  provider: ProviderProfile;
  themeMode: AppThemeMode;
  onFilesChanged: (files: Record<string, ProjectFile>) => void;
}

export const QuickTerminalModal: React.FC<QuickTerminalModalProps> = ({
  isOpen,
  onClose,
  files,
  cwd,
  provider,
  themeMode,
  onFilesChanged,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        zIndex: 90,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 800,
          margin: '0 auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg)',
          boxShadow: '0 0 50px rgba(0, 0, 0, 0.8)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            backgroundColor: 'var(--surface)',
            borderBottom: '1px solid var(--outline-variant)',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 14 }}>Quick Standalone Terminal</span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'hidden' }}>
          <TerminalTab
            files={files}
            cwd={cwd}
            provider={provider}
            onFilesChanged={onFilesChanged}
            themeMode={themeMode}
          />
        </div>
      </div>
    </div>
  );
};
