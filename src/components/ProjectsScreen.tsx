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
  Sparkles,
  GitBranch,
} from 'lucide-react';
import { Project } from '../types/models';
import { LanguageCode, translate } from '../i18n/i18n';

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
  currentLanguage?: LanguageCode;
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
  currentLanguage = 'en',
}) => {
  const [importExpanded, setImportExpanded] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = (k: string, fallback: string) => {
    const res = translate(k, currentLanguage);
    return res === k ? fallback : res;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportZip(file);
    }
  };

  const startRename = (p: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProjectId(p.id);
    setEditName(p.name);
  };

  const confirmRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editName.trim()) {
      onRenameProject(id, editName.trim());
    }
    setEditingProjectId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProjectId(null);
  };

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        maxWidth: 720,
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Quick Project Hero Card */}
      <div
        className="surface-card"
        style={{
          border: '1.5px solid var(--primary)',
          backgroundColor: 'rgba(242, 140, 82, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>
                {t('quick_project', 'Quick Project')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {t('quick_project_desc', 'Instant autonomous Python & Claude Code session')}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-primary" onClick={onCreateQuickProject} style={{ flex: 1 }}>
            <span>{t('launch_quick_project', 'Launch Quick Project')}</span>
          </button>
          <button className="btn-outlined" onClick={onOpenQuickTerminal} style={{ flex: 1 }}>
            <Terminal size={15} />
            <span>{t('terminal', 'Quick Terminal')}</span>
          </button>
        </div>
      </div>

      {/* Projects List Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
          {t('projects', 'Projects')} ({projects.length})
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="chip chip-active"
            onClick={onOpenNewProjectModal}
            style={{ padding: '6px 12px', fontSize: 12 }}
          >
            <Plus size={14} />
            <span>{t('new_project', 'New Project')}</span>
          </button>
          <button
            className="chip"
            onClick={onOpenCloneGitModal}
            style={{ padding: '6px 12px', fontSize: 12 }}
          >
            <GitBranch size={14} />
            <span>{t('clone_git', 'Clone Git')}</span>
          </button>
        </div>
      </div>

      {/* Projects Items */}
      {projects.length === 0 ? (
        <div
          className="surface-card"
          style={{
            textAlign: 'center',
            padding: '36px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Folder size={40} color="var(--text-muted)" opacity={0.5} />
          <div style={{ fontSize: 15, fontWeight: 700 }}>
            {t('no_projects_yet', 'No projects created yet')}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 300 }}>
            {t('no_projects_desc', 'Launch a Quick Project or create a new workspace to start coding with AI tools.')}
          </div>
          <button className="btn-primary" onClick={onCreateQuickProject} style={{ marginTop: 6 }}>
            {t('launch_quick_project', 'Launch Quick Project')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {projects.map((project) => (
            <div
              key={project.id}
              className="surface-card"
              onClick={() => onOpenProject(project)}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                transition: 'border-color 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: 'var(--surface-variant)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                    flexShrink: 0,
                  }}
                >
                  {project.type === 'ANDROID' ? <Code size={20} /> : <Folder size={20} />}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  {editingProjectId === project.id ? (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-input"
                        style={{ padding: '4px 8px', fontSize: 13 }}
                      />
                      <button
                        onClick={(e) => confirmRename(project.id, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#69D69E',
                          cursor: 'pointer',
                        }}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={cancelRename}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#FF6B6B',
                          cursor: 'pointer',
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 14.5,
                          fontWeight: 700,
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {project.name}
                      </span>
                      {project.kind === 'QUICK_PROJECT' && (
                        <span
                          style={{
                            fontSize: 9.5,
                            fontWeight: 800,
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
                  )}

                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      marginTop: 2,
                    }}
                  >
                    {project.description || `${project.language} • ${Object.keys(project.files).length} files`}
                  </span>
                </div>
              </div>

              <div
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => startRename(project, e)}
                  title="Rename"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 6,
                    borderRadius: 6,
                  }}
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete project "${project.name}"?`)) {
                      onDeleteProject(project.id);
                    }
                  }}
                  title="Delete"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 6,
                    borderRadius: 6,
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Import / Zip Section Accordion */}
      <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div
          onClick={() => setImportExpanded(!importExpanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 700 }}>
            <Download size={16} color="var(--primary)" />
            <span>{t('import_project', 'Import ZIP Project')}</span>
          </div>
          {importExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>

        {importExpanded && (
          <div style={{ paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              {t('import_project_desc', 'Import an existing project archive into Mobile Harness browser storage.')}
            </p>
            <input
              type="file"
              ref={fileInputRef}
              accept=".zip,.tar.gz"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <button
              className="btn-outlined"
              onClick={() => fileInputRef.current?.click()}
              style={{ alignSelf: 'flex-start' }}
            >
              <span>{t('choose_file', 'Select ZIP Archive')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
