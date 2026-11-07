import { Project, ProviderProfile, AgentKind, PROVIDER_DEFINITIONS, InstalledPythonPackage } from '../types/models';
import { AppThemeMode } from '../theme/colors';

const STORAGE_PROJECTS_KEY = 'mh_projects_v1';
const STORAGE_PROVIDER_KEY = 'mh_provider_v1';
const STORAGE_AGENT_KEY = 'mh_agent_v1';
const STORAGE_THEME_KEY = 'mh_theme_v1';
const STORAGE_PYTHON_PKGS_KEY = 'mh_python_packages_v1';

export function projectSlug(name: string): string {
  const ascii = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return ascii || 'project';
}

export function generateQuickProjectName(): { name: string; slug: string } {
  const adjectives = ['bright', 'calm', 'clever', 'curious', 'gentle', 'nimble', 'quiet', 'swift', 'wise', 'bold'];
  const pioneers = ['turing', 'lovelace', 'hopper', 'tesla', 'curie', 'ramanujan', 'bose', 'kalam', 'faraday', 'darwin'];
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const pio = pioneers[Math.floor(Math.random() * pioneers.length)];
  const slug = `${adj}-${pio}`;
  const displayName = `${adj.charAt(0).toUpperCase() + adj.slice(1)} ${pio.charAt(0).toUpperCase() + pio.slice(1)}`;
  return { name: displayName, slug };
}

export function getDefaultProvider(): ProviderProfile {
  return {
    kind: 'ANTHROPIC',
    baseUrl: PROVIDER_DEFINITIONS.ANTHROPIC.defaultBaseUrl,
    model: PROVIDER_DEFINITIONS.ANTHROPIC.defaultModel,
    apiKey: '',
  };
}

export function loadProvider(): ProviderProfile {
  try {
    const raw = localStorage.getItem(STORAGE_PROVIDER_KEY);
    if (raw) {
      return { ...getDefaultProvider(), ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load provider', e);
  }
  return getDefaultProvider();
}

export function saveProvider(profile: ProviderProfile) {
  try {
    localStorage.setItem(STORAGE_PROVIDER_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save provider', e);
  }
}

export function loadTheme(): AppThemeMode {
  return (localStorage.getItem(STORAGE_THEME_KEY) as AppThemeMode) || 'dark';
}

export function saveTheme(mode: AppThemeMode) {
  localStorage.setItem(STORAGE_THEME_KEY, mode);
}

export function loadAgent(): AgentKind {
  return (localStorage.getItem(STORAGE_AGENT_KEY) as AgentKind) || 'claude-code';
}

export function saveAgent(agent: AgentKind) {
  localStorage.setItem(STORAGE_AGENT_KEY, agent);
}

export function loadInstalledPackages(): InstalledPythonPackage[] {
  try {
    const raw = localStorage.getItem(STORAGE_PYTHON_PKGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load python pkgs', e);
  }
  return [
    { name: 'pip', version: '24.1', summary: 'The PyPA recommended tool for installing Python packages.' },
    { name: 'micropip', version: '0.6.0', summary: 'Lightweight package installer for Pyodide.' },
    { name: 'setuptools', version: '70.0.0', summary: 'Easily download, build, install, upgrade, and uninstall Python packages.' },
  ];
}

export function saveInstalledPackages(packages: InstalledPythonPackage[]) {
  try {
    localStorage.setItem(STORAGE_PYTHON_PKGS_KEY, JSON.stringify(packages));
  } catch (e) {
    console.error('Failed to save python pkgs', e);
  }
}

const DEFAULT_DEMO_PROJECT: Project = {
  id: 'demo-python-web',
  name: 'Python Web Sandbox',
  description: 'Full Python & Web development environment with Git, Pip, and Claude Code',
  language: 'Python',
  slug: 'python-web-sandbox',
  rootPath: '/workspace/python-web-sandbox',
  updatedAtMillis: Date.now(),
  kind: 'PROJECT',
  type: 'GENERAL',
  files: {
    'main.py': {
      path: 'main.py',
      name: 'main.py',
      updatedAt: Date.now(),
      content: `# Mobile Harness Python Backend Demo
import sys
import math

def calculate_stats():
    numbers = [2, 4, 6, 8, 10, 12, 14, 16]
    mean = sum(numbers) / len(numbers)
    variance = sum((x - mean) ** 2 for x in numbers) / len(numbers)
    std_dev = math.sqrt(variance)
    
    print("=" * 40)
    print("  Mobile Harness Python Subsystem")
    print("=" * 40)
    print(f"Python Version : {sys.version.split()[0]}")
    print(f"Sample data    : {numbers}")
    print(f"Mean           : {mean:.2f}")
    print(f"Std Deviation  : {std_dev:.2f}")
    print("=" * 40)
    print("Real Python execution & Pip packages ready!")

if __name__ == "__main__":
    calculate_stats()
`,
    },
    'index.html': {
      path: 'index.html',
      name: 'index.html',
      updatedAt: Date.now(),
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mobile Harness Live Web Preview</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0B0E14;
      color: #E6EDF3;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      box-sizing: border-box;
      text-align: center;
    }
    .card {
      background: #131821;
      border: 1px solid #2A3240;
      border-radius: 18px;
      padding: 32px 24px;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .badge {
      display: inline-block;
      background: rgba(242, 140, 82, 0.15);
      color: #F28C52;
      border: 1px solid rgba(242, 140, 82, 0.3);
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    h1 {
      margin: 0 0 10px 0;
      font-size: 24px;
      color: #F28C52;
    }
    p {
      color: #9AA0A6;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .btn {
      background: #F28C52;
      color: #241107;
      border: none;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 700;
      border-radius: 12px;
      cursor: pointer;
      transition: transform 0.1s ease;
    }
    .btn:active {
      transform: scale(0.97);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Mobile Harness Web Preview</div>
    <h1>It Works!</h1>
    <p>Your web application is running live inside Mobile Harness Web. Modify HTML, CSS, TS/JS, or Python files and see instant updates.</p>
    <button class="btn" onclick="alert('Mobile Harness Preview Interactive!')">Tap Me</button>
  </div>
</body>
</html>
`,
    },
    'app.ts': {
      path: 'app.ts',
      name: 'app.ts',
      updatedAt: Date.now(),
      content: `// TypeScript application logic
export function greet(name: string): string {
  return \`Welcome to Mobile Harness, \${name}!\`;
}

console.log(greet('Developer'));
`,
    },
    'style.css': {
      path: 'style.css',
      name: 'style.css',
      updatedAt: Date.now(),
      content: `/* Mobile Harness styling */
:root {
  --primary: #F28C52;
  --bg: #0B0E14;
  --surface: #131821;
}
`,
    },
  },
};

export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_PROJECTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load projects', e);
  }
  return [DEFAULT_DEMO_PROJECT];
}

export function saveProjects(projects: Project[]) {
  try {
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save projects', e);
  }
}
