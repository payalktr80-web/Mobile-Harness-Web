import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { BottomNavBar, RootTab, WorkspaceTab } from './components/BottomNavBar';
import { ProjectsScreen } from './components/ProjectsScreen';
import { WorkspaceScreen } from './components/WorkspaceScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { NewProjectModal } from './components/NewProjectModal';
import { CloneGitModal } from './components/CloneGitModal';
import { QuickTerminalModal } from './components/QuickTerminalModal';
import {
  Project,
  ProjectFile,
  ProviderProfile,
  AgentKind,
  AndroidTemplate,
} from './types/models';
import {
  loadProjects,
  saveProjects,
  loadProvider,
  saveProvider,
  loadTheme,
  saveTheme,
  loadAgent,
  saveAgent,
  generateQuickProjectName,
  projectSlug,
} from './services/storage';
import { AppThemeMode } from './theme/colors';

export const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [rootTab, setRootTab] = useState<RootTab>('projects');
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('chat');
  const [provider, setProvider] = useState<ProviderProfile>(() => loadProvider());
  const [selectedAgent, setSelectedAgent] = useState<AgentKind>(() => loadAgent());
  const [themeMode, setThemeMode] = useState<AppThemeMode>(() => loadTheme());

  // Modals
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isCloneGitModalOpen, setIsCloneGitModalOpen] = useState(false);
  const [isQuickTerminalOpen, setIsQuickTerminalOpen] = useState(false);

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    saveTheme(themeMode);
  }, [themeMode]);

  // Persist projects
  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  // Persist provider
  useEffect(() => {
    saveProvider(provider);
  }, [provider]);

  // Persist agent
  useEffect(() => {
    saveAgent(selectedAgent);
  }, [selectedAgent]);

  const activeProject = projects.find((p) => p.id === activeProjectId) || null;

  const handleToggleTheme = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleOpenProject = (project: Project) => {
    setActiveProjectId(project.id);
    setWorkspaceTab('chat');
  };

  const handleBackToProjects = () => {
    setActiveProjectId(null);
    setRootTab('projects');
  };

  const handleCreateQuickProject = () => {
    const { name, slug } = generateQuickProjectName();
    const newProject: Project = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      slug,
      description: 'Quick autonomous development workspace session',
      language: 'Python',
      rootPath: `/workspace/${slug}`,
      updatedAtMillis: Date.now(),
      kind: 'QUICK_PROJECT',
      type: 'GENERAL',
      files: {
        'main.py': {
          path: 'main.py',
          name: 'main.py',
          updatedAt: Date.now(),
          content: `# Quick session: ${name}
def main():
    print("Welcome to ${name}!")
    print("Python 3.12 subsystem ready.")

if __name__ == "__main__":
    main()
`,
        },
      },
    };

    setProjects((prev) => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
    setWorkspaceTab('chat');
  };

  const handleCreateNewProject = (name: string, template: AndroidTemplate | null) => {
    const slug = projectSlug(name);
    const files: Record<string, ProjectFile> = {};

    if (template === 'COMPOSE') {
      files['MainActivity.kt'] = {
        path: 'MainActivity.kt',
        name: 'MainActivity.kt',
        updatedAt: Date.now(),
        content: `package com.example.${slug.replace(/-/g, '')}

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            Greeting("${name}")
        }
    }
}

@Composable
fun Greeting(name: String) {
    Text(text = "Hello $name from Mobile Harness Compose!")
}
`,
      };
    } else if (template === 'XML') {
      files['MainActivity.kt'] = {
        path: 'MainActivity.kt',
        name: 'MainActivity.kt',
        updatedAt: Date.now(),
        content: `package com.example.${slug.replace(/-/g, '')}

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
    }
}
`,
      };
      files['activity_main.xml'] = {
        path: 'activity_main.xml',
        name: 'activity_main.xml',
        updatedAt: Date.now(),
        content: `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:gravity="center">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Welcome to ${name}"
        android:textSize="20sp" />
</LinearLayout>
`,
      };
    } else {
      // General Web + Python
      files['main.py'] = {
        path: 'main.py',
        name: 'main.py',
        updatedAt: Date.now(),
        content: `# ${name} Python Application
import sys

def main():
    print("Running ${name} on Python " + sys.version)

if __name__ == "__main__":
    main()
`,
      };
      files['index.html'] = {
        path: 'index.html',
        name: 'index.html',
        updatedAt: Date.now(),
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${name}</title>
  <style>
    body {
      font-family: sans-serif;
      background: #0B0E14;
      color: #E6EDF3;
      padding: 30px;
      text-align: center;
    }
    h1 { color: #F28C52; }
  </style>
</head>
<body>
  <h1>${name}</h1>
  <p>Live preview ready.</p>
</body>
</html>
`,
      };
    }

    const newProject: Project = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      slug,
      description: template ? `Android ${template} Project` : 'General Python & Web project',
      language: template ? 'Kotlin' : 'Python',
      rootPath: `/workspace/${slug}`,
      updatedAtMillis: Date.now(),
      kind: 'PROJECT',
      type: template ? 'ANDROID' : 'GENERAL',
      androidTemplate: template || undefined,
      files,
    };

    setProjects((prev) => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
    setWorkspaceTab('chat');
  };

  const handleCloneGit = async (url: string) => {
    const repoName = url.split('/').pop()?.replace('.git', '') || 'git-repo';
    const slug = projectSlug(repoName);

    // Mock initial clone files
    const newProject: Project = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: repoName,
      slug,
      description: `Cloned from ${url}`,
      language: 'Python',
      rootPath: `/workspace/${slug}`,
      updatedAtMillis: Date.now(),
      kind: 'PROJECT',
      type: 'GENERAL',
      files: {
        'README.md': {
          path: 'README.md',
          name: 'README.md',
          updatedAt: Date.now(),
          content: `# ${repoName}\n\nCloned from \`${url}\`.\n\nPython, Git, and Claude Code enabled.\n`,
        },
        'main.py': {
          path: 'main.py',
          name: 'main.py',
          updatedAt: Date.now(),
          content: `# ${repoName}\nprint("Repository cloned and ready.")\n`,
        },
      },
    };

    setProjects((prev) => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
    setWorkspaceTab('chat');
  };

  const handleImportZip = (file: File) => {
    const projectName = file.name.replace(/\.[^/.]+$/, '') || 'Imported Project';
    const slug = projectSlug(projectName);

    const newProject: Project = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: projectName,
      slug,
      description: `Imported from ${file.name}`,
      language: 'Web',
      rootPath: `/workspace/${slug}`,
      updatedAtMillis: Date.now(),
      kind: 'PROJECT',
      type: 'GENERAL',
      files: {
        'index.html': {
          path: 'index.html',
          name: 'index.html',
          updatedAt: Date.now(),
          content: `<!DOCTYPE html><html><body><h1>Imported: ${projectName}</h1></body></html>`,
        },
      },
    };

    setProjects((prev) => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (activeProjectId === projectId) {
      setActiveProjectId(null);
    }
  };

  const handleRenameProject = (projectId: string, newName: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, name: newName, updatedAtMillis: Date.now() } : p))
    );
  };

  const handleUpdateProjectFiles = (updatedFiles: Record<string, ProjectFile>) => {
    if (!activeProjectId) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? { ...p, files: updatedFiles, updatedAtMillis: Date.now() }
          : p
      )
    );
  };

  return (
    <div className="app-container">
      {/* Top App Bar */}
      <TopBar
        activeProject={activeProject}
        onBackToProjects={handleBackToProjects}
        themeMode={themeMode}
        onToggleTheme={handleToggleTheme}
        onRunProjectPreview={() => setWorkspaceTab('preview')}
      />

      {/* Main Body */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {activeProject ? (
          <WorkspaceScreen
            project={activeProject}
            activeTab={workspaceTab}
            provider={provider}
            themeMode={themeMode}
            onToggleTheme={handleToggleTheme}
            onUpdateProjectFiles={handleUpdateProjectFiles}
          />
        ) : (
          <>
            {rootTab === 'projects' && (
              <ProjectsScreen
                projects={projects}
                onOpenProject={handleOpenProject}
                onCreateQuickProject={handleCreateQuickProject}
                onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
                onOpenCloneGitModal={() => setIsCloneGitModalOpen(true)}
                onImportZip={handleImportZip}
                onDeleteProject={handleDeleteProject}
                onRenameProject={handleRenameProject}
                onOpenQuickTerminal={() => setIsQuickTerminalOpen(true)}
              />
            )}

            {rootTab === 'agent' && (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 24,
                  textAlign: 'center',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(242, 140, 82, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: 32 }}>🤖</span>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800 }}>Claude Code AI Workspace</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 320, lineHeight: 1.5 }}>
                  Open an existing project or start an instant Quick Project to chat and execute code with Claude Code replicate.
                </p>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button className="btn-primary" onClick={handleCreateQuickProject}>
                    Launch Quick Project
                  </button>
                  {projects.length > 0 && (
                    <button className="btn-outlined" onClick={() => handleOpenProject(projects[0])}>
                      Open {projects[0].name}
                    </button>
                  )}
                </div>
              </div>
            )}

            {rootTab === 'settings' && (
              <SettingsScreen
                provider={provider}
                onUpdateProvider={setProvider}
                selectedAgent={selectedAgent}
                onSelectAgent={setSelectedAgent}
                themeMode={themeMode}
                onSetThemeMode={setThemeMode}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <BottomNavBar
        inWorkspace={Boolean(activeProject)}
        activeRootTab={rootTab}
        onSelectRootTab={setRootTab}
        activeWorkspaceTab={workspaceTab}
        onSelectWorkspaceTab={setWorkspaceTab}
      />

      {/* Modals */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreate={handleCreateNewProject}
      />

      <CloneGitModal
        isOpen={isCloneGitModalOpen}
        onClose={() => setIsCloneGitModalOpen(false)}
        onClone={handleCloneGit}
      />

      <QuickTerminalModal
        isOpen={isQuickTerminalOpen}
        onClose={() => setIsQuickTerminalOpen(false)}
        files={activeProject ? activeProject.files : projects[0]?.files || {}}
        cwd={activeProject ? `/workspace/${activeProject.slug}` : '/workspace'}
        provider={provider}
        themeMode={themeMode}
        onFilesChanged={(newFiles) => {
          if (activeProject) {
            handleUpdateProjectFiles(newFiles);
          } else if (projects[0]) {
            setProjects((prev) =>
              prev.map((p, idx) => (idx === 0 ? { ...p, files: newFiles } : p))
            );
          }
        }}
      />
    </div>
  );
};
