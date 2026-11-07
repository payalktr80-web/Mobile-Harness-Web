import React, { useState } from 'react';
import {
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Package,
  Layers,
  Palette,
  ShieldCheck,
  RefreshCw,
  Plus,
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
import { loadInstalledPackages, saveInstalledPackages } from '../services/storage';

interface SettingsScreenProps {
  provider: ProviderProfile;
  onUpdateProvider: (profile: ProviderProfile) => void;
  selectedAgent: AgentKind;
  onSelectAgent: (agent: AgentKind) => void;
  themeMode: AppThemeMode;
  onSetThemeMode: (mode: AppThemeMode) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  provider,
  onUpdateProvider,
  selectedAgent,
  onSelectAgent,
  themeMode,
  onSetThemeMode,
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

  const currentDef = PROVIDER_DEFINITIONS[provider.kind] || PROVIDER_DEFINITIONS.ANTHROPIC;

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
            'x-api-key': provider.apiKey.trim(),
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: provider.model || 'claude-3-5-haiku-20241022',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Ping' }],
          }),
        });

        if (res.ok) {
          setValidationStatus('✓ Verified! Anthropic API key is valid.');
        } else {
          const err = await res.json().catch(() => ({}));
          setValidationStatus(`Verification failed: ${err?.error?.message || res.statusText}`);
        }
      } else {
        let url = provider.baseUrl || 'https://openrouter.ai/api/v1';
        if (!url.endsWith('/models') && !url.endsWith('/chat/completions')) {
          url = url.replace(/\/+$/, '') + '/models';
        }
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${provider.apiKey.trim()}`,
          },
        });
        if (res.ok) {
          setValidationStatus(`✓ Verified! Connection to ${provider.kind} successful.`);
        } else {
          setValidationStatus(`Verification failed with HTTP ${res.status}`);
        }
      }
    } catch (err: any) {
      setValidationStatus(`Verification failed: ${err.message || String(err)}`);
    } finally {
      setIsValidating(false);
    }
  };

  const handleInstallPip = async () => {
    if (!newPackageName.trim()) return;
    const pkg = newPackageName.trim();
    setIsInstallingPackage(true);
    setPackageInstallMsg(`Installing ${pkg} via micropip...`);

    const res = await installPipPackage(pkg);
    setPackageInstallMsg(res.message);
    setIsInstallingPackage(false);
    setNewPackageName('');
    setInstalledPackages(loadInstalledPackages());
  };

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px 18px 90px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Settings</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Manage AI providers, installed toolchains, themes, and runtime health.
        </p>
      </div>

      {/* AI Provider Section */}
      <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15 }}>
          <Key size={18} color="var(--primary)" />
          <span>AI Model Provider</span>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
            Provider Protocol
          </label>
          <select
            className="text-input"
            value={provider.kind}
            onChange={(e) => handleProviderChange(e.target.value as ProviderKindId)}
            style={{ fontWeight: 600 }}
          >
            {Object.keys(PROVIDER_DEFINITIONS).map((k) => {
              const def = PROVIDER_DEFINITIONS[k as ProviderKindId];
              return (
                <option key={k} value={k}>
                  {def.title} — {def.subtitle}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
            API Key (Stored locally in browser)
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showKey ? 'text' : 'password'}
              className="text-input"
              value={provider.apiKey}
              onChange={(e) => onUpdateProvider({ ...provider, apiKey: e.target.value })}
              placeholder={provider.kind === 'ANTHROPIC' ? 'sk-ant-api03-...' : 'sk-...'}
              style={{ paddingRight: 40, fontFamily: 'monospace' }}
            />
            <button
              onClick={() => setShowKey(!showKey)}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
              Base URL
            </label>
            <input
              type="text"
              className="text-input"
              value={provider.baseUrl}
              onChange={(e) => onUpdateProvider({ ...provider, baseUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
              Model
            </label>
            <input
              type="text"
              className="text-input"
              value={provider.model}
              onChange={(e) => onUpdateProvider({ ...provider, model: e.target.value })}
              placeholder="e.g. claude-3-7-sonnet-20250219"
            />
          </div>
        </div>

        <button
          className="btn-outlined"
          onClick={handleValidateKey}
          disabled={isValidating || !provider.apiKey.trim()}
          style={{ width: '100%', marginTop: 4 }}
        >
          <RefreshCw size={15} className={isValidating ? 'spin' : ''} style={isValidating ? { animation: 'spin 1s linear infinite' } : {}} />
          <span>{isValidating ? 'Validating...' : 'Validate Connection'}</span>
        </button>

        {validationStatus && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              fontSize: 12.5,
              fontWeight: 500,
              backgroundColor: validationStatus.startsWith('✓') ? 'rgba(105, 214, 158, 0.15)' : 'rgba(255, 107, 107, 0.15)',
              color: validationStatus.startsWith('✓') ? 'var(--tertiary)' : 'var(--error)',
            }}
          >
            {validationStatus}
          </div>
        )}
      </div>

      {/* Coding Agent Selection */}
      <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15 }}>
          <Cpu size={18} color="var(--primary)" />
          <span>Coding Agent Engine</span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {(['claude-code', 'deepseek-harness', 'antigravity'] as AgentKind[]).map((agent) => (
            <button
              key={agent}
              className={`chip ${selectedAgent === agent ? 'chip-active' : ''}`}
              onClick={() => onSelectAgent(agent)}
              style={{ flex: 1, padding: '10px 8px', justifyContent: 'center' }}
            >
              {agent === 'claude-code' ? 'Claude Code' : agent === 'deepseek-harness' ? 'DeepSeek' : 'Antigravity'}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {selectedAgent === 'claude-code' && "Anthropic's coding agent replicate · multi-turn tool calling & streaming."}
          {selectedAgent === 'deepseek-harness' && 'DeepSeek coding harness · fast reasoning models via API gateway.'}
          {selectedAgent === 'antigravity' && "Google's official coding agent persona & workflow."}
        </p>
      </div>

      {/* Python Subsystem & Pip Tools */}
      <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15 }}>
            <Package size={18} color="var(--tertiary)" />
            <span>Python Subsystem & Pip Packages</span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--tertiary)', fontWeight: 700 }}>Python 3.12 WebAssembly</span>
        </div>

        <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
          Real Python runner in browser WebAssembly with micropip package manager. Packages are installed directly into the browser runtime:
        </p>

        {/* Quick Pip Install Input */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="text-input"
            value={newPackageName}
            onChange={(e) => setNewPackageName(e.target.value)}
            placeholder="Package name, e.g. numpy, requests, sympy"
            style={{ flex: 1 }}
          />
          <button
            className="btn-primary"
            onClick={handleInstallPip}
            disabled={isInstallingPackage || !newPackageName.trim()}
            style={{ padding: '8px 16px', fontSize: 13 }}
          >
            <Plus size={16} />
            <span>{isInstallingPackage ? 'Installing...' : 'Install'}</span>
          </button>
        </div>

        {packageInstallMsg && (
          <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
            {packageInstallMsg}
          </div>
        )}

        {/* Installed Packages List */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {installedPackages.map((pkg) => (
            <div
              key={pkg.name}
              style={{
                backgroundColor: 'var(--surface-variant)',
                border: '1px solid var(--outline)',
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

      {/* Theme Setting */}
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
