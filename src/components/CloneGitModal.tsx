import React, { useState } from 'react';
import { Code, Loader2 } from 'lucide-react';

interface CloneGitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClone: (url: string) => Promise<void>;
}

export const CloneGitModal: React.FC<CloneGitModalProps> = ({ isOpen, onClose, onClone }) => {
  const [gitUrl, setGitUrl] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClone = async () => {
    if (!gitUrl.trim()) return;
    setIsCloning(true);
    setError(null);
    try {
      await onClone(gitUrl.trim());
      setGitUrl('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to clone repository.');
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Code size={20} color="var(--primary)" />
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Clone Git Repository</h2>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Enter a public repository HTTPS clone URL:
        </p>

        <input
          className="text-input"
          value={gitUrl}
          onChange={(e) => setGitUrl(e.target.value)}
          placeholder="https://github.com/owner/repository.git"
          autoFocus
          disabled={isCloning}
        />

        {error && (
          <div style={{ color: 'var(--error)', fontSize: 12 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
          <button className="btn-outlined" onClick={onClose} disabled={isCloning}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleClone} disabled={!gitUrl.trim() || isCloning}>
            {isCloning ? <Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> : null}
            <span>{isCloning ? 'Cloning...' : 'Clone'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
