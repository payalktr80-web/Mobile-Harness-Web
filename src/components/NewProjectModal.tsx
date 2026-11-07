import React, { useState } from 'react';
import { AndroidTemplate } from '../types/models';
import { projectSlug } from '../services/storage';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, template: AndroidTemplate | null) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [template, setTemplate] = useState<AndroidTemplate | null>(null);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), template);
    setName('');
    setTemplate(null);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Create Project</h2>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
            Project Name
          </label>
          <input
            className="text-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Python Calculator, Web Store"
            autoFocus
          />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
            Project Stack / Template
          </label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`chip ${template === null ? 'chip-active' : ''}`}
              onClick={() => setTemplate(null)}
            >
              General (Python & Web)
            </button>
            <button
              type="button"
              className={`chip ${template === 'COMPOSE' ? 'chip-active' : ''}`}
              onClick={() => setTemplate('COMPOSE')}
            >
              Compose UI
            </button>
            <button
              type="button"
              className={`chip ${template === 'XML' ? 'chip-active' : ''}`}
              onClick={() => setTemplate('XML')}
            >
              Kotlin + XML
            </button>
          </div>
        </div>

        {name.trim() && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            Target path: <span style={{ color: 'var(--primary)' }}>/workspace/{projectSlug(name)}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
          <button className="btn-outlined" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleCreate} disabled={!name.trim()}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
};
