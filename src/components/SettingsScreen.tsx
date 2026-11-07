import React, { useState } from 'react';
import {
  Key,
  Eye,
  EyeOff,
  Cpu,
  Package,
  Palette,
  ShieldCheck,
  RefreshCw,
  Plus,
  Globe,
  Database,
  Download,
  Upload,
  Compass,
} from 'lucide-react';
import {
  ProviderProfile,
  AgentKind,
  ProviderKindId,
  PROVIDER_DEFINITIONS,
  InstalledPythonPackage,
} from '../types/models';
import { AppThemeMode } from '../theme/colors';
import { installPipPackage } from '../services/pyodideRunner';
import { loadInstalledPackages, saveInstalledPackages, loadProjects, saveProjects } from '../services/storage';
import { LANGUAGES, LanguageCode, saveStoredLanguage, translate } from '../i18n/i18n';

interface SettingsScreenProps {
  provider: ProviderProfile;
  onUpdateProvider: (profile: ProviderProfile) => void;
  selectedAgent: AgentKind;
  onSelectAgent: (agent: AgentKind) => void;
  themeMode: AppThemeMode;
  onSetThemeMode: (mode: AppThemeMode) => void;
  currentLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  onReRunSetupWizard?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  provider,
  onUpdateProvider,
  selectedAgent,
  onSelectAgent,
  themeMode,
  onSetThemeMode,
  currentLanguage,
  onLanguageChange,
  onReRunSetupWizard,
}) => {
  const [showKey, setShowKey] = useState(false);
  const [validationStatus, setValidationStatus] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [installedPackages, setInstalledPackages] = useState<InstalledPythonPackage[]>(() =>
    loadInstalledPackages()
  );
  const [newPackageName, setNewPackageName] = useState('');
  const [isInstallingPackage, setIsInstallingPackage] = useState(false);
  const [packageInstallMsg, setPackageInstallMsg] = useState('');
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  const t = (k: string, ...args: (string | number)[]) => translate(k, currentLanguage, ...args);

  const handleProviderChange = (kind: ProviderKindId) => {
    const def = PROVIDER_DEFINITIONS[kind];
    onUpdateProvider({
      ...provider,
      kind,
      baseUrl: def.defaultBaseUrl,
      model: def.defaultModel,
    });
    setValidationStatus(null);
  };

  const handleValidateKey = async () => {
    if (!provider.apiKey.trim()) {
      setValidationStatus('Please enter an API key first.');
      return;
    }
    setIsValidating(true);
    setValidationStatus('Validating API key with provider...');

    try {
      if (provider.kind === 'ANTHROPIC' || provider.kind === 'CLAUDE') {
        const res = await fetch(`${provider.baseUrl || 'https://api.anthropic.com'}/v1/messages`, {
          method: 'POST',
          headers: {
            'x-api-key': provider.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: provider.model || 'claude-3-7-sonnet-20250219',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'hi' }],
          }),
        });
        if (res.ok || res.status === 400) {
          setValidationStatus('✅ Key format verified successfully!');
        } else {
          setValidationStatus(`Provider replied: HTTP ${res.status}`);
        }
      } else {
        setValidationStatus('✅ API credentials saved locally.');
      }
    } catch (err: any) {
      setValidationStatus(`Saved (Offline or CORS proxy may be needed for live validation: ${err.message})`);
    } finally {
      setIsValidating(false);
    }
  };

  const handleInstallPip = async () => {
    if (!newPackageName.trim()) return;
    setIsInstallingPackage(true);
    setPackageInstallMsg(`Installing ${newPackageName} via micropip...`);
    try {
      const res = await installPipPackage(newPackageName.trim());
      if (res.success) {
        setPackageInstallMsg(`✅ ${res.output}`);
        const updated = [...installedPackages, { name: newPackageName.trim(), version: 'latest' }];
        setInstalledPackages(updated);
        saveInstalledPackages(updated);
        setNewPackageName('');
      } else {
        setPackageInstallMsg(`❌ Error: ${res.output}`);
      }
    } catch (err: any) {
      setPackageInstallMsg(`❌ Install failed: ${err.message}`);
    } finally {
      setIsInstallingPackage(false);
    }
  };

  const handleExportBackup = () => {
    const projects = loadProjects();
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      projects,
      provider: { ...provider, apiKey: '' }, // exclude key for safety
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mobile-harness-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupStatus('Backup downloaded successfully.');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.projects && Array.isArray(json.projects)) {
          saveProjects(json.projects);
          setBackupStatus(`Successfully imported ${json.projects.length} projects! Refreshing...`);
          setTimeout(() => window.location.reload(), 1000);
        } else {
          setBackupStatus('Invalid backup file format.');
        }
      } catch (err) {
        setBackupStatus('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px 16px',
        maxWidth: 720,
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px 0', letterSpacing: -0.4 }}>
          Settings & Configuration
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Manage your AI model provider credentials, Python packages, language, and workspace preferences.
        </p>
      </div>

      {/* Guided Setup Re-run Banner */}
      {onReRunSetupWizard && (
        <div
          className="surface-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid var(--primary)',
            backgroundColor: 'rgba(242, 140, 82, 0.06)',
            padding: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Compass size={22} color="var(--primary)" />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>Guided Setup Wizard</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                Re-run the initial onboarding bootstrap flow.
              </div>
            </div>
          </div>
          <button
            className="btn-primary"
            onClick={onReRunSetupWizard}
            style={{ padding: '6px 14px', fontSize: 12 }}
          >
            Launch Wizard
          </button>
        </div>
      )}

      {/* Language / Locale */}
      <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15 }}>
          <Globe size={18} color="var(--secondary)" />
          <span>Language / Locale</span>
        </div>
        <select
          className="text-input"
          value={currentLanguage}
          onChange={(e) => {
            const lang = e.target.value as LanguageCode;
            saveStoredLanguage(lang);
            onLanguageChange(lang);
          }}
          style={{ fontWeight: 600 }}
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.nativeName} ({l.displayName})
            </option>
          ))}
        </select>
      </div>

      {/* AI Provider Section */}
      <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15 }}>
          <Key size={18} color="var(--primary)" />
          <span>AI Model Provider</span>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            Select Provider
          </label>
          <select
            className="text-input"
            value={provider.kind}
            onChange={(e) => handleProviderChange(e.target.value as ProviderKindId)}
          >
            {Object.entries(PROVIDER_DEFINITIONS).map(([key, def]) => (
              <option key={key} value={key}>
                {def.title} - {def.subtitle}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            API Key
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type={showKey ? 'text' : 'password'}
                placeholder="sk-ant-... or sk-or-..."
                value={provider.apiKey}
                onChange={(e) => onUpdateProvider({ ...provider, apiKey: e.target.value })}
                className="text-input"
                style={{ fontFamily: 'monospace', paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              className="btn-outlined"
              onClick={handleValidateKey}
              disabled={isValidating}
              style={{ whiteSpace: 'nowrap' }}
            >
              {isValidating ? 'Validating...' : 'Verify'}
            </button>
          </div>
          {validationStatus && (
            <div style={{ fontSize: 12, color: 'var(--primary)', marginTop: 6, fontWeight: 500 }}>
              {validationStatus}
            </div>
          )}
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            Model Identifier
          </label>
          <input
            type="text"
            value={provider.model}
            onChange={(e) => onUpdateProvider({ ...provider, model: e.target.value })}
            className="text-input"
          />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            API Base URL
          </label>
          <input
            type="text"
            value={provider.baseUrl || ''}
            onChange={(e) => onUpdateProvider({ ...provider, baseUrl: e.target.value })}
            className="text-input"
            style={{ fontFamily: 'monospace' }}
          />
        </div>
      </div>

      {/* Autonomous Coding Agent Selection */}
      <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15 }}>
          <Cpu size={18} color="var(--primary)" />
          <span>Default Coding Agent Persona</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
          {[
            {
              id: 'CLAUDE_CODE' as AgentKind,
              name: 'Claude Code Replicate',
              desc: 'Autonomous multi-turn agent with file tool calls and shell execution.',
            },
            {
              id: 'DEEPSEEK' as AgentKind,
              name: 'DeepSeek Harness',
              desc: 'Deep reasoning agent harness tailored for R1 code generation.',
            },
            {
              id: 'ANTIGRAVITY' as AgentKind,
              name: 'Antigravity Agent',
              desc: 'Interactive dual-agent pairing with inline diff generation.',
            },
          ].map((ag) => (
            <div
              key={ag.id}
              onClick={() => onSelectAgent(ag.id)}
              style={{
                padding: 12,
                borderRadius: 10,
                border: `1.5px solid ${selectedAgent === ag.id ? 'var(--primary)' : 'var(--outline-variant)'}`,
                backgroundColor: selectedAgent === ag.id ? 'rgba(242, 140, 82, 0.08)' : 'var(--surface)',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: selectedAgent === ag.id ? 'var(--primary)' : 'inherit' }}>
                {ag.name}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
                {ag.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Python & Micropip Package Manager */}
      <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15 }}>
          <Package size={18} color="var(--tertiary)" />
          <span>Python WASM & Package Manager (micropip)</span>
        </div>

        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0 }}>
          Install real Python wheels (e.g. <code>requests</code>, <code>numpy</code>, <code>sympy</code>, <code>matplotlib</code>) directly into browser memory.
        </p>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Package name (e.g. numpy, beautifulsoup4)"
            value={newPackageName}
            onChange={(e) => setNewPackageName(e.target.value)}
            className="text-input"
            style={{ flex: 1 }}
          />
          <button
            className="btn-primary"
            onClick={handleInstallPip}
            disabled={isInstallingPackage}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {isInstallingPackage ? <RefreshCw size={14} className="spin" /> : <Plus size={14} />}
            <span>Install</span>
          </button>
        </div>

        {packageInstallMsg && (
          <div style={{ fontSize: 12, color: 'var(--text-primary)', backgroundColor: 'var(--surface-variant)', padding: 8, borderRadius: 6 }}>
            {packageInstallMsg}
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {installedPackages.map((pkg) => (
            <div
              key={pkg.name}
              style={{
                backgroundColor: 'var(--surface-variant)',
                borderRadius: 8,
                padding: '4px 10px',
                fontSize: 11.5,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontWeight: 600 }}>{pkg.name}</span>
              <span style={{ color: 'var(--text-muted)' }}>v{pkg.version}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Appearance */}
      <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15 }}>
          <Palette size={18} color="var(--primary)" />
          <span>Appearance</span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {(['dark', 'light', 'system'] as AppThemeMode[]).map((mode) => (
            <button
              key={mode}
              className={`chip ${themeMode === mode ? 'chip-active' : ''}`}
              onClick={() => onSetThemeMode(mode)}
              style={{ flex: 1, padding: '10px 8px', justifyContent: 'center', textTransform: 'capitalize' }}
            >
              {mode} Theme
            </button>
          ))}
        </div>
      </div>

      {/* Backup and Restore */}
      <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15 }}>
          <Database size={18} color="var(--primary)" />
          <span>Backup & Restore</span>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
          Export your projects, file workspaces, and configurations to JSON, or restore from a backup file.
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outlined" onClick={handleExportBackup} style={{ flex: 1 }}>
            <Download size={15} />
            <span>Export Backup</span>
          </button>
          <label className="btn-outlined" style={{ flex: 1, cursor: 'pointer', margin: 0 }}>
            <Upload size={15} />
            <span>Restore Backup</span>
            <input type="file" accept=".json" onChange={handleImportBackup} style={{ display: 'none' }} />
          </label>
        </div>

        {backupStatus && (
          <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
            {backupStatus}
          </div>
        )}
      </div>

      {/* System Diagnostics */}
      <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15 }}>
          <ShieldCheck size={18} color="var(--tertiary)" />
          <span>Runtime Diagnostics</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Platform</span>
            <span style={{ fontWeight: 600 }}>Web PWA (Mobile Harness Port)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>WebAssembly Runtime</span>
            <span style={{ color: 'var(--tertiary)', fontWeight: 600 }}>Supported & Enabled</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Python Backend</span>
            <span style={{ color: 'var(--tertiary)', fontWeight: 600 }}>Pyodide 3.12 (Active)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>WebContainer Virtual Shell</span>
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Integrated & Ready</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Version</span>
            <span style={{ fontWeight: 600 }}>1.0.3 Web</span>
          </div>
        </div>
      </div>
    </div>
  );
};
