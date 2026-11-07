import React, { useState, useMemo, useEffect } from 'react';
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
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Edit2,
  Search,
  Check,
  File,
  Code
} from 'lucide-react';
import { ProjectFile, WorkspaceEntry } from '../../types/models';
import { runPythonCode } from '../../services/pyodideRunner';

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
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(() => {
    const keys = Object.keys(files);
    return keys.length > 0 ? keys[0] : null;
  });
  const [fileDraft, setFileDraft] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [openTabs, setOpenTabs] = useState<string[]>(() => {
    const keys = Object.keys(files);
    return keys.slice(0, 3);
  });

  // Modal dialog states
  const [showNewModal, setShowNewModal] = useState<'file' | 'folder' | null>(null);
  const [targetDir, setTargetDir] = useState<string>('');
  const [newEntryName, setNewEntryName] = useState('');
  
  // Rename state
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameNewName, setRenameNewName] = useState<string>('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Folder collapsed state (map of dirPath -> isCollapsed)
  const [collapsedDirs, setCollapsedDirs] = useState<Record<string, boolean>>({});

  // Python output drawer for quick execution
  const [pythonOutput, setPythonOutput] = useState<{ running: boolean; text: string } | null>(null);

  // When selected file changes, update draft
  useEffect(() => {
    if (selectedFilePath && files[selectedFilePath]) {
      setFileDraft(files[selectedFilePath].content);
      setHasUnsavedChanges(false);
      if (!openTabs.includes(selectedFilePath)) {
        setOpenTabs((prev) => [...prev, selectedFilePath]);
      }
    }
  }, [selectedFilePath, files]);

  // Handle Ctrl/Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (selectedFilePath && hasUnsavedChanges) {
          onSaveFile(selectedFilePath, fileDraft);
          setHasUnsavedChanges(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFilePath, fileDraft, hasUnsavedChanges, onSaveFile]);

  // Build hierarchical WorkspaceEntry list from flat path dictionary
  const workspaceEntries = useMemo(() => {
    const allPaths = Object.keys(files);
    const dirSet = new Set<string>();

    // Discover all implied directories
    allPaths.forEach((path) => {
      const parts = path.split('/');
      let currentDir = '';
      for (let i = 0; i < parts.length - 1; i++) {
        currentDir = currentDir ? `${currentDir}/${parts[i]}` : parts[i];
        dirSet.add(currentDir);
      }
    });

    const entries: WorkspaceEntry[] = [];

    // Directory items
    Array.from(dirSet).forEach((dirPath) => {
      const parts = dirPath.split('/');
      const depth = parts.length - 1;
      const name = parts[parts.length - 1];
      const childCount = allPaths.filter(
        (p) => p.startsWith(dirPath + '/') && !p.slice(dirPath.length + 1).includes('/')
      ).length;

      entries.push({
        path: dirPath,
        name,
        isDirectory: true,
        depth,
        childCount,
      });
    });

    // File items
    allPaths.forEach((filePath) => {
      const parts = filePath.split('/');
      const depth = parts.length - 1;
      const name = parts[parts.length - 1];
      const sizeBytes = new Blob([files[filePath]?.content || '']).size;

      entries.push({
        path: filePath,
        name,
        isDirectory: false,
        depth,
        sizeBytes,
      });
    });

    // Sort entries hierarchically: folders first, then alphabetical
    entries.sort((a, b) => {
      if (a.path === b.path) return 0;
      return a.path.localeCompare(b.path);
    });

    return entries;
  }, [files]);

  // Visible entries considering collapse state and search query
  const visibleEntries = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return workspaceEntries.filter((e) => e.name.toLowerCase().includes(q));
    }

    return workspaceEntries.filter((entry) => {
      const parts = entry.path.split('/');
      // If any ancestor directory is collapsed, hide this entry
      let currentAncestor = '';
      for (let i = 0; i < parts.length - 1; i++) {
        currentAncestor = currentAncestor ? `${currentAncestor}/${parts[i]}` : parts[i];
        if (collapsedDirs[currentAncestor]) {
          return false;
        }
      }
      return true;
    });
  }, [workspaceEntries, collapsedDirs, searchQuery]);

  const toggleDir = (dirPath: string) => {
    setCollapsedDirs((prev) => ({ ...prev, [dirPath]: !prev[dirPath] }));
  };

  const handleOpenFile = (path: string) => {
    setSelectedFilePath(path);
  };

  const handleCloseTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = openTabs.filter((t) => t !== path);
    setOpenTabs(newTabs);
    if (selectedFilePath === path) {
      setSelectedFilePath(newTabs.length > 0 ? newTabs[newTabs.length - 1] : null);
    }
  };

  const handleSave = () => {
    if (selectedFilePath) {
      onSaveFile(selectedFilePath, fileDraft);
      setHasUnsavedChanges(false);
    }
  };

  const handleCreateNew = () => {
    if (!newEntryName.trim()) return;
    const cleanName = newEntryName.trim().replace(/^\/+/, '');
    const fullPath = targetDir ? `${targetDir}/${cleanName}` : cleanName;

    if (showNewModal === 'file') {
      onCreateFile(fullPath, '');
      setSelectedFilePath(fullPath);
      setFileDraft('');
      setHasUnsavedChanges(false);
    } else {
      // Create placeholder file inside folder so directory is registered
      onCreateFile(`${fullPath}/.gitkeep`, '');
    }

    setNewEntryName('');
    setShowNewModal(null);
  };

  const handleRenameConfirm = (oldPath: string) => {
    if (!renameNewName.trim() || renameNewName.trim() === oldPath) {
      setRenamingPath(null);
      return;
    }
    const parts = oldPath.split('/');
    parts[parts.length - 1] = renameNewName.trim();
    const newPath = parts.join('/');

    const content = files[oldPath]?.content || '';
    onDeleteFile(oldPath);
    onCreateFile(newPath, content);
    if (selectedFilePath === oldPath) {
      setSelectedFilePath(newPath);
    }
    setRenamingPath(null);
    setRenameNewName('');
  };

  const handleRunPython = async (path: string) => {
    if (onRunPythonFile) {
      onRunPythonFile(path);
      return;
    }
    const code = files[path]?.content || fileDraft;
    setPythonOutput({ running: true, text: `Running ${path} in Pyodide WASM...\n` });
    try {
      const res = await runPythonCode(code);
      const out = res.output ? res.output : '(Program executed successfully with no stdout)';
      const err = res.error ? `\nError:\n${res.error}` : '';
      setPythonOutput({ running: false, text: `${out}${err}` });
    } catch (err: any) {
      setPythonOutput({ running: false, text: `Execution failed: ${err.message}` });
    }
  };

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.py')) return <FileCode size={16} color="#69D69E" />;
    if (filename.endsWith('.kt') || filename.endsWith('.java')) return <Code size={16} color="#A78BFA" />;
    if (filename.endsWith('.ts') || filename.endsWith('.js')) return <FileCode size={16} color="#8EA8FF" />;
    if (filename.endsWith('.html')) return <FileCode size={16} color="#F28C52" />;
    if (filename.endsWith('.css')) return <FileCode size={16} color="#FF8EA8" />;
    if (filename.endsWith('.json') || filename.endsWith('.xml') || filename.endsWith('.gradle')) {
      return <FileSpreadsheet size={16} color="#FFD166" />;
    }
    return <FileText size={16} color="var(--text-muted)" />;
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* LEFT: File Tree Explorer */}
      <div
        style={{
          width: 280,
          borderRight: '1px solid var(--outline-variant)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--surface)',
        }}
      >
        {/* Explorer Header */}
        <div
          style={{
            padding: '10px 12px',
            borderBottom: '1px solid var(--outline-variant)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: -0.2 }}>
            Files ({Object.keys(files).length})
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => {
                setTargetDir('');
                setShowNewModal('file');
              }}
              title="New File"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 4,
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <FilePlus size={16} />
            </button>
            <button
              onClick={() => {
                setTargetDir('');
                setShowNewModal('folder');
              }}
              title="New Folder"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 4,
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <FolderPlus size={16} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--outline-variant)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'var(--background)',
              borderRadius: 6,
              padding: '4px 8px',
              border: '1px solid var(--outline-variant)',
            }}
          >
            <Search size={13} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: 12,
                width: '100%',
              }}
            />
            {searchQuery && (
              <X
                size={12}
                color="var(--text-muted)"
                style={{ cursor: 'pointer' }}
                onClick={() => setSearchQuery('')}
              />
            )}
          </div>
        </div>

        {/* Tree Entries */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {visibleEntries.length === 0 ? (
            <div style={{ padding: 16, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              No files found.
            </div>
          ) : (
            visibleEntries.map((entry) => {
              const isSelected = selectedFilePath === entry.path;
              const isCollapsed = collapsedDirs[entry.path];

              if (entry.isDirectory) {
                return (
                  <div
                    key={`dir_${entry.path}`}
                    onClick={() => toggleDir(entry.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 8px 5px ' + (8 + entry.depth * 14) + 'px',
                      cursor: 'pointer',
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      backgroundColor: 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                      {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                      {isCollapsed ? (
                        <Folder size={15} color="var(--primary)" />
                      ) : (
                        <FolderOpen size={15} color="var(--primary)" />
                      )}
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {entry.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {entry.childCount !== undefined && entry.childCount > 0 && (
                        <span
                          style={{
                            fontSize: 10,
                            color: 'var(--text-muted)',
                            backgroundColor: 'var(--surface-variant)',
                            padding: '1px 5px',
                            borderRadius: 10,
                          }}
                        >
                          {entry.childCount}
                        </span>
                      )}
                      <button
                        title="Add file inside"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTargetDir(entry.path);
                          setShowNewModal('file');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 2,
                          color: 'var(--text-muted)',
                        }}
                      >
                        <FilePlus size={13} />
                      </button>
                    </div>
                  </div>
                );
              }

              // File Item
              return (
                <div
                  key={`file_${entry.path}`}
                  onClick={() => handleOpenFile(entry.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '5px 8px 5px ' + (14 + entry.depth * 14) + 'px',
                    cursor: 'pointer',
                    fontSize: 12.5,
                    backgroundColor: isSelected ? 'rgba(242, 140, 82, 0.15)' : 'transparent',
                    color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                    {getFileIcon(entry.name)}
                    {renamingPath === entry.path ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <input
                          autoFocus
                          type="text"
                          value={renameNewName}
                          onChange={(e) => setRenameNewName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameConfirm(entry.path);
                            if (e.key === 'Escape') setRenamingPath(null);
                          }}
                          style={{
                            fontSize: 11,
                            padding: '2px 4px',
                            borderRadius: 3,
                            border: '1px solid var(--primary)',
                            backgroundColor: 'var(--background)',
                            color: 'var(--text-primary)',
                            width: 110,
                          }}
                        />
                        <Check
                          size={13}
                          color="#69D69E"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleRenameConfirm(entry.path)}
                        />
                        <X
                          size={13}
                          color="#FF6B6B"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setRenamingPath(null)}
                        />
                      </div>
                    ) : (
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {entry.name}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {formatBytes(entry.sizeBytes)}
                    </span>
                    <button
                      title="Rename"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingPath(entry.path);
                        setRenameNewName(entry.name);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 2,
                        color: 'var(--text-muted)',
                      }}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete ${entry.name}?`)) {
                          onDeleteFile(entry.path);
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 2,
                        color: 'var(--text-muted)',
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Editor & Viewer */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background)', overflow: 'hidden' }}>
        {/* Editor Tab Bar */}
        <div
          style={{
            height: 38,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--surface)',
            borderBottom: '1px solid var(--outline-variant)',
            overflowX: 'auto',
          }}
        >
          {openTabs.map((tabPath) => {
            const isTabActive = selectedFilePath === tabPath;
            const tabName = tabPath.split('/').pop() || tabPath;
            return (
              <div
                key={tabPath}
                onClick={() => setSelectedFilePath(tabPath)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0 12px',
                  height: '100%',
                  fontSize: 12,
                  fontWeight: isTabActive ? 600 : 400,
                  cursor: 'pointer',
                  borderRight: '1px solid var(--outline-variant)',
                  backgroundColor: isTabActive ? 'var(--background)' : 'transparent',
                  color: isTabActive ? 'var(--primary)' : 'var(--text-muted)',
                  borderTop: isTabActive ? '2px solid var(--primary)' : '2px solid transparent',
                }}
              >
                {getFileIcon(tabName)}
                <span>{tabName}</span>
                {isTabActive && hasUnsavedChanges && (
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary)',
                    }}
                  />
                )}
                <X
                  size={12}
                  style={{ opacity: 0.6, cursor: 'pointer' }}
                  onClick={(e) => handleCloseTab(tabPath, e)}
                />
              </div>
            );
          })}

          <div style={{ flex: 1 }} />

          {/* Action Toolbar */}
          {selectedFilePath && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px' }}>
              {selectedFilePath.endsWith('.py') && (
                <button
                  onClick={() => handleRunPython(selectedFilePath)}
                  className="chip"
                  style={{
                    backgroundColor: 'rgba(105, 214, 158, 0.15)',
                    color: '#69D69E',
                    padding: '3px 8px',
                    fontSize: 11,
                  }}
                >
                  <Play size={12} fill="#69D69E" />
                  <span>Run Python</span>
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!hasUnsavedChanges}
                className="chip"
                style={{
                  backgroundColor: hasUnsavedChanges ? 'var(--primary)' : 'var(--surface-variant)',
                  color: hasUnsavedChanges ? '#FFFFFF' : 'var(--text-muted)',
                  padding: '3px 10px',
                  fontSize: 11,
                  cursor: hasUnsavedChanges ? 'pointer' : 'default',
                }}
              >
                <Save size={12} />
                <span>Save</span>
              </button>
            </div>
          )}
        </div>

        {/* Editor Body */}
        {selectedFilePath ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <textarea
              value={fileDraft}
              onChange={(e) => {
                setFileDraft(e.target.value);
                setHasUnsavedChanges(true);
              }}
              spellCheck={false}
              style={{
                flex: 1,
                width: '100%',
                padding: '14px 18px',
                backgroundColor: 'var(--background)',
                color: 'var(--text-primary)',
                fontFamily: 'monospace',
                fontSize: 13,
                lineHeight: 1.55,
                border: 'none',
                outline: 'none',
                resize: 'none',
              }}
            />

            {/* Python execution output drawer */}
            {pythonOutput && (
              <div
                style={{
                  height: 140,
                  borderTop: '1px solid var(--outline-variant)',
                  backgroundColor: 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 10px',
                    borderBottom: '1px solid var(--outline-variant)',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  <span style={{ color: '#69D69E' }}>Pyodide Python 3.12 Output</span>
                  <X
                    size={12}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setPythonOutput(null)}
                  />
                </div>
                <pre
                  style={{
                    flex: 1,
                    margin: 0,
                    padding: 8,
                    overflowY: 'auto',
                    fontFamily: 'monospace',
                    fontSize: 12,
                    color: 'var(--text-primary)',
                  }}
                >
                  {pythonOutput.text}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              gap: 8,
            }}
          >
            <File size={36} opacity={0.3} />
            <span style={{ fontSize: 13 }}>Select a file from the explorer to view or edit.</span>
          </div>
        )}
      </div>

      {/* New File / Folder Modal */}
      {showNewModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px 0' }}>
              Create New {showNewModal === 'file' ? 'File' : 'Folder'}
            </h3>
            {targetDir && (
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 8 }}>
                Inside: <code>{targetDir}/</code>
              </div>
            )}
            <input
              autoFocus
              type="text"
              placeholder={showNewModal === 'file' ? 'e.g., utils.py, index.html' : 'e.g., src, components'}
              value={newEntryName}
              onChange={(e) => setNewEntryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateNew();
                if (e.key === 'Escape') setShowNewModal(null);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid var(--outline-variant)',
                backgroundColor: 'var(--background)',
                color: 'var(--text-primary)',
                fontSize: 13,
                marginBottom: 16,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                className="btn-outlined"
                onClick={() => setShowNewModal(null)}
                style={{ padding: '6px 14px', fontSize: 12 }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleCreateNew}
                style={{ padding: '6px 16px', fontSize: 12 }}
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
