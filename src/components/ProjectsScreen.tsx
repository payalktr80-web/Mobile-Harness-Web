import React, { useState, useRef } from 'react';
import {
  MessageSquare,
  Plus,
  ChevronDown,
  ChevronUp,
  Download,
  Code,
  Folder,
  Trash2,
  Terminal,
  ExternalLink,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { Project } from '../types/models';

interface ProjectsScreenProps {
  projects: Project[];
  onOpenProject: (project: Project) => void;
  onCreateQuickProject: () => void;
  onOpenNewProjectModal: () => void;
  onOpenCloneGitModal: () => void;
  onImportZip: (file: File) => void;
  onDeleteProject: (projectId: string) => void;
  onRenameProject: (projectId: string, newName: string) => void;
  onOpenQuickTerminal: () => void;
}

export const ProjectsScreen: React.FC<ProjectsScreenProps> = ({
  projects,
  onOpenProject,
  onCreateQuickProject,
  onOpenNewProjectModal,
  onOpenCloneGitModal,
  onImportZip,
  onDeleteProject,
  onRenameProject,
  onOpenQuickTerminal,
}) => {
  const [importExpanded, setImportExpanded] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportZip(file);
    }
  };

  const formatTime = (millis: number) => {
    const diff = Date.now() - millis;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px 18px 90px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Hero Header */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.4px' }}>
          Projects
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>
          Create, organize, and resume isolated workspace sessions.
        </p>
      </div>

      {/* Action Buttons Row */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          className="btn-primary"
          onClick={onCreateQuickProject}
          style={{ flex: 1, height: 48 }}
        >
          <MessageSquare size={17} />
          <span>Quick Project</span>
        </button>

        <button
          className="btn-outlined"
          onClick={onOpenNewProjectModal}
          style={{ flex: 1, height: 48 }}
        >
          <Plus size={18} />
          <span>New Project</span>
        </button>
      </div>

      {/* Bring Existing Section */}
      <div className="surface-card-subtle" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          onClick={() => setImportExpanded(!importExpanded)}
          style={{
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Bring existing project</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {importExpanded ? 'Select an import source' : 'ZIP file, Git URL, or connect GitHub'}
            </div>
          </div>
          {importExpanded ? (
            <ChevronUp size={18} color="var(--text-muted)" />
          ) : (
            <ChevronDown size={18} color="var(--text-muted)" />
          )}
        </div>

        {importExpanded && (
          <div
            style={{
              padding: '0 14px 14px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn-outlined"
                onClick={() => fileInputRef.current?.click()}
                style={{ flex: 1, padding: '10px 12px', fontSize: 12.5 }}
              >
                <Download size={15} color="var(--primary)" />
                <span>Upload ZIP/Files</span>
              </button>

              <button
                className="btn-outlined"
                onClick={onOpenCloneGitModal}
                style={{ flex: 1, padding: '10px 12px', fontSize: 12.5 }}
              >
                <Code size={15} color="var(--primary)" />
                <span>Git URL</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Projects List Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.2px' }}>
          Your projects ({projects.length})
        </h2>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <div
          className="surface-card"
          style={{
            padding: '36px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: 'rgba(242, 140, 82, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 4,
            }}
          >
            <Folder size={26} color="var(--primary)" />
          </div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>No projects yet</div>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', maxWidth: 280, lineHeight: 1.5 }}>
            Launch a Quick Project to start chatting with Claude Code, or create a new workspace.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {projects.map((project) => (
            <div
              key={project.id}
              className="surface-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                cursor: 'pointer',
              }}
              onClick={() => {
                if (editingProjectId !== project.id) {
                  onOpenProject(project);
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden', flex: 1 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    backgroundColor: 'rgba(242, 140, 82, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Folder size={22} color="var(--primary)" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                  {editingProjectId === project.id ? (
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        className="text-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                        style={{ padding: '4px 8px', fontSize: 13 }}
                      />
                      <button
                        onClick={() => {
                          if (editName.trim()) {
                            onRenameProject(project.id, editName.trim());
                          }
                          setEditingProjectId(null);
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--tertiary)', cursor: 'pointer' }}
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => setEditingProjectId(null)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 14.5,
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                        }}
                      >
                        {project.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                        <span>{formatTime(project.updatedAtMillis)}</span>
                        <span>•</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{project.language || 'Python'}</span>
                        <span>•</span>
                        <span>{Object.keys(project.files || {}).length} files</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    setEditingProjectId(project.id);
                    setEditName(project.name);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 6,
                    borderRadius: 6,
                  }}
                  title="Rename"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete project "${project.name}"?`)) {
                      onDeleteProject(project.id);
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 6,
                    borderRadius: 6,
                  }}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      <button className="fab" onClick={onOpenQuickTerminal} title="Open Quick Terminal">
        <Terminal size={18} />
        <span>Terminal</span>
      </button>
    </div>
  );
};
