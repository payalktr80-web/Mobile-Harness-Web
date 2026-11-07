import React, { useState } from 'react';
import {
  FileCode,
  FileText,
  FileSpreadsheet,
  FolderPlus,
  FilePlus,
  Upload,
  Trash2,
  Save,
  X,
  Play,
  RotateCcw,
} from 'lucide-react';
import { ProjectFile } from '../../types/models';

interface FilesTabProps {
  files: Record<string, ProjectFile>;
  onSaveFile: (path: string, content: string) => void;
  onDeleteFile: (path: string) => void;
  onCreateFile: (path: string, content?: string) => void;
  onRunPythonFile?: (path: string) => void;
}

export const FilesTab: React.FC<FilesTabProps> = ({
  files,
  onSaveFile,
  onDeleteFile,
  onCreateFile,
  onRunPythonFile,
}) => {
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [fileDraft, setFileDraft] = useState<string>('');
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const selectedFile = selectedFilePath ? files[selectedFilePath] : null;

  const handleOpenFile = (path: string) => {
    setSelectedFilePath(path);
    setFileDraft(files[path]?.content || '');
  };

  const handleSave = () => {
    if (selectedFilePath) {
      onSaveFile(selectedFilePath, fileDraft);
    }
  };

  const handleCreateNew = () => {
    if (!newFileName.trim()) return;
    const cleanPath = newFileName.trim().replace(/^\/+/, '');
    onCreateFile(cleanPath, '');
    setSelectedFilePath(cleanPath);
    setFileDraft('');
    setNewFileName('');
    setShowNewFileModal(false);
  };

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.py')) return <FileCode size={18} color="#69D69E" />;
    if (filename.endsWith('.ts') || filename.endsWith('.js')) return <FileCode size={18} color="#8EA8FF" />;
    if (filename.endsWith('.html')) return <FileCode size={18} color="#F28C52" />;
    if (filename.endsWith('.css')) return <FileCode size={18} color="#FF8EA8" />;
    if (filename.endsWith('.json')) return <FileSpreadsheet size={18} color="#FFD166" />;
    return <FileText size={18} color="var(--text-muted)" />;
  };

  const fileList = Object.keys(files).sort();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top File Actions Bar */}
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
        <span style={{ fontSize: 13, fontWeight: 700 }}>
          Files ({fileList.length})
        </span>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="chip"
            onClick={() => setShowNewFileModal(true)}
            style={{ padding: '4px 10px', fontSize: 11.5 }}
          >
            <FilePlus size={14} color="var(--primary)" />
            <span>New File</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Area: File List or Editor */}
      {selectedFile ? (
        // Code Editor View
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {/* Editor Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 14px',
              backgroundColor: 'var(--surface-variant)',
              borderBottom: '1px solid var(--outline)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {getFileIcon(selectedFile.name)}
              <span style={{ fontWeight: 600, fontSize: 13 }}>{selectedFile.path}</span>
              {selectedFile.content !== fileDraft && (
                <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>(unsaved)</span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {selectedFile.name.endsWith('.py') && onRunPythonFile && (
                <button
                  className="chip chip-active"
                  onClick={() => onRunPythonFile(selectedFile.path)}
                  style={{ padding: '4px 8px', fontSize: 11 }}
                  title="Run with Python in Terminal"
                >
                  <Play size={13} fill="currentColor" />
                  <span>Run</span>
                </button>
              )}

              <button
                className="chip"
                onClick={handleSave}
                style={{
                  padding: '4px 8px',
                  fontSize: 11,
                  backgroundColor: selectedFile.content !== fileDraft ? 'var(--primary)' : undefined,
                  color: selectedFile.content !== fileDraft ? 'var(--on-primary)' : undefined,
                }}
                title="Save changes"
              >
                <Save size={13} />
                <span>Save</span>
              </button>

              <button
                onClick={() => setSelectedFilePath(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Close file"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Code Textarea */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
            <textarea
              value={fileDraft}
              onChange={(e) => setFileDraft(e.target.value)}
              spellCheck={false}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                fontFamily: 'JetBrains Mono, Fira Code, monospace',
                fontSize: 13,
                lineHeight: 1.5,
                padding: 14,
                border: 'none',
                outline: 'none',
                resize: 'none',
                whiteSpace: 'pre',
                overflowWrap: 'normal',
                overflowX: 'auto',
              }}
            />
          </div>
        </div>
      ) : (
        // File Tree List View
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
          {fileList.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30, fontSize: 13 }}>
              No files in this project yet. Tap "New File" above.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {fileList.map((path) => {
                const file = files[path];
                return (
                  <div
                    key={path}
                    className="surface-card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      borderRadius: 12,
                    }}
                    onClick={() => handleOpenFile(path)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                      {getFileIcon(file.name)}
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span style={{ fontWeight: 600, fontSize: 13.5 }}>{file.path}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {file.content.length} characters
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {file.name.endsWith('.py') && onRunPythonFile && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRunPythonFile(file.path);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--tertiary)',
                            cursor: 'pointer',
                            padding: 6,
                          }}
                          title="Run with Python"
                        >
                          <Play size={16} fill="currentColor" />
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete ${file.path}?`)) {
                            onDeleteFile(file.path);
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: 6,
                        }}
                        title="Delete file"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* New File Modal */}
      {showNewFileModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Create New File</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Enter the relative file path (e.g. <code>script.py</code> or <code>src/index.ts</code>):
            </p>
            <input
              className="text-input"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="e.g. main.py"
              autoFocus
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
              <button className="btn-outlined" onClick={() => setShowNewFileModal(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleCreateNew}
                disabled={!newFileName.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
