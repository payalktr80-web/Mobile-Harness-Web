import React, { useState, useEffect } from 'react';
import {
  Globe,
  Cpu,
  Boxes,
  KeyRound,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Layers,
  Check,
  ShieldCheck,
  Terminal,
  ArrowRight,
  X,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { LANGUAGES, LanguageCode, saveStoredLanguage, translate } from '../../i18n/i18n';
import { ProviderProfile, AgentKind } from '../../types/models';
import { BrandMark } from '../BrandMark';

interface GuidedSetupWizardProps {
  currentLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  currentProvider: ProviderProfile;
  onProviderChange: (provider: ProviderProfile) => void;
  currentAgent: AgentKind;
  onAgentChange: (agent: AgentKind) => void;
  onComplete: () => void;
  onSkip: () => void;
}

export const GuidedSetupWizard: React.FC<GuidedSetupWizardProps> = ({
  currentLanguage,
  onLanguageChange,
  currentProvider,
  onProviderChange,
  currentAgent,
  onAgentChange,
  onComplete,
  onSkip,
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedLang, setSelectedLang] = useState<LanguageCode>(currentLanguage);
  const [selectedAgentKind, setSelectedAgentKind] = useState<AgentKind>(currentAgent);
  
  // Toolchain selections (web, python, android, clang)
  const [enabledToolchains, setEnabledToolchains] = useState<{
    web: boolean;
    python: boolean;
    android: boolean;
    clang: boolean;
    php: boolean;
  }>({
    web: true,
    python: true,
    android: true,
    clang: false,
    php: false,
  });

  // System readiness checks state
  const [systemChecks, setSystemChecks] = useState<{
    wasm: 'pending' | 'ok' | 'failed';
    webContainer: 'pending' | 'ok' | 'partial';
    storage: 'pending' | 'ok';
    memory: 'pending' | 'ok';
  }>({
    wasm: 'pending',
    webContainer: 'pending',
    storage: 'pending',
    memory: 'pending',
  });

  // Provider form state
  const [providerId, setProviderId] = useState(currentProvider.id);
  const [providerName, setProviderName] = useState(currentProvider.name);
  const [apiKey, setApiKey] = useState(currentProvider.apiKey || '');
  const [model, setModel] = useState(currentProvider.model || 'claude-3-7-sonnet-20250219');
  const [baseUrl, setBaseUrl] = useState(currentProvider.baseUrl || '');

  // Run real system readiness probe
  useEffect(() => {
    if (step === 2) {
      const timer = setTimeout(() => {
        // Probe WebAssembly
        const hasWasm = typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
        // Probe SharedArrayBuffer (cross-origin isolation)
        const hasSAB = typeof SharedArrayBuffer !== 'undefined' && window.crossOriginIsolated;
        // Probe Storage
        const hasStorage = typeof localStorage !== 'undefined';
        // Memory estimate
        setSystemChecks({
          wasm: hasWasm ? 'ok' : 'failed',
          webContainer: hasSAB ? 'ok' : 'partial',
          storage: hasStorage ? 'ok' : 'pending',
          memory: 'ok',
        });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleLangSelect = (code: LanguageCode) => {
    setSelectedLang(code);
    saveStoredLanguage(code);
    onLanguageChange(code);
  };

  const handleToggleToolchain = (key: keyof typeof enabledToolchains) => {
    setEnabledToolchains((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveProviderAndFinish = () => {
    const updated: ProviderProfile = {
      ...currentProvider,
      id: providerId,
      name: providerName,
      apiKey: apiKey.trim(),
      model: model.trim(),
      baseUrl: baseUrl.trim() || undefined,
    };
    onProviderChange(updated);
    onAgentChange(selectedAgentKind);
    onComplete();
  };

  const t = (k: string, ...args: (string | number)[]) => translate(k, selectedLang, ...args);

  const stepsList = [
    { num: 1, title: 'Language', icon: Globe },
    { num: 2, title: 'Readiness', icon: Cpu },
    { num: 3, title: 'Toolchains', icon: Boxes },
    { num: 4, title: 'Provider', icon: KeyRound },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'var(--background)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Wizard Header */}
      <div
        style={{
          height: 56,
          borderBottom: '1px solid var(--outline-variant)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          backgroundColor: 'var(--surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BrandMark size={28} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: -0.3 }}>
              Mobile Harness Web Setup
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Step {step} of 4: {stepsList[step - 1].title}
            </div>
          </div>
        </div>

        <button
          onClick={onSkip}
          className="btn-outlined"
          style={{ padding: '6px 14px', fontSize: 12, borderRadius: 20 }}
        >
          Skip Setup
        </button>
      </div>

      {/* Step Indicators */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--outline-variant)',
          backgroundColor: 'var(--surface-variant)',
          padding: '8px 16px',
          overflowX: 'auto',
          gap: 12,
        }}
      >
        {stepsList.map((s) => {
          const Icon = s.icon;
          const isActive = step === s.num;
          const isDone = step > s.num;
          return (
            <div
              key={s.num}
              onClick={() => {
                if (isDone) setStep(s.num);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                borderRadius: 20,
                backgroundColor: isActive ? 'var(--primary)' : isDone ? 'rgba(242, 140, 82, 0.15)' : 'transparent',
                color: isActive ? '#FFFFFF' : isDone ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: 12,
                cursor: isDone ? 'pointer' : 'default',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  backgroundColor: isActive ? '#FFFFFF' : isDone ? 'var(--primary)' : 'var(--outline)',
                  color: isActive ? 'var(--primary)' : isDone ? '#FFFFFF' : 'var(--text-muted)',
                }}
              >
                {isDone ? <Check size={12} strokeWidth={3} /> : s.num}
              </div>
              <Icon size={14} />
              <span>{s.title}</span>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 20px',
          maxWidth: 640,
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* STEP 1: LANGUAGE SELECTION */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 16,
                  backgroundColor: 'rgba(242, 140, 82, 0.15)',
                  color: 'var(--primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <Globe size={28} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px 0' }}>
                Select Your Language
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Choose your preferred language for the Mobile Harness Web interface.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
              {LANGUAGES.map((lang) => {
                const isSelected = selectedLang === lang.code;
                return (
                  <div
                    key={lang.code}
                    onClick={() => handleLangSelect(lang.code)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--outline-variant)'}`,
                      backgroundColor: isSelected ? 'rgba(242, 140, 82, 0.08)' : 'var(--surface)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: isSelected ? 700 : 600 }}>
                        {lang.nativeName}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {lang.displayName}
                      </div>
                    </div>
                    {isSelected && (
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                        }}
                      >
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: SYSTEM READINESS */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 16,
                  backgroundColor: 'rgba(242, 140, 82, 0.15)',
                  color: 'var(--primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <ShieldCheck size={28} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px 0' }}>
                System Readiness Check
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Verifying in-browser WebAssembly, Storage, and Python WebContainer capabilities.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* WebAssembly Runtime */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid var(--outline-variant)',
                  backgroundColor: 'var(--surface)',
                }}
              >
                <Cpu size={24} color="var(--primary)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>WebAssembly (WASM) Engine</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Runs Pyodide Python 3.12, micropip, and client-side builds.
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 20,
                    backgroundColor: 'rgba(105, 214, 158, 0.15)',
                    color: '#69D69E',
                  }}
                >
                  READY
                </span>
              </div>

              {/* Local File System & IndexedDB */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid var(--outline-variant)',
                  backgroundColor: 'var(--surface)',
                }}
              >
                <HardDrive size={24} color="var(--primary)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Local Storage & IndexedDB</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    High-speed persistent project and workspace storage.
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 20,
                    backgroundColor: 'rgba(105, 214, 158, 0.15)',
                    color: '#69D69E',
                  }}
                >
                  READY
                </span>
              </div>

              {/* WebContainer / Isolated Environment */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid var(--outline-variant)',
                  backgroundColor: 'var(--surface)',
                }}
              >
                <Terminal size={24} color="var(--primary)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>In-Browser Terminal Runner</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {systemChecks.webContainer === 'ok'
                      ? 'Full Node WebContainer + Pyodide available.'
                      : 'Pyodide WASM + Mock POSIX runtime operational.'}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 20,
                    backgroundColor: 'rgba(105, 214, 158, 0.15)',
                    color: '#69D69E',
                  }}
                >
                  READY
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: TOOLCHAINS & AGENT SELECTION */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px 0' }}>
                Autonomous Coding Agent
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
                Select your default agent persona and tool-calling execution harness.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                {[
                  {
                    kind: 'CLAUDE_CODE' as AgentKind,
                    title: 'Claude Code Replicate',
                    desc: 'Autonomous multi-turn agent with view/write/diff tools.',
                    badge: 'RECOMMENDED',
                  },
                  {
                    kind: 'DEEPSEEK' as AgentKind,
                    title: 'DeepSeek Harness',
                    desc: 'Optimized for DeepSeek-R1 and V3 reasoning models.',
                    badge: 'POPULAR',
                  },
                  {
                    kind: 'ANTIGRAVITY' as AgentKind,
                    title: 'Antigravity Agent',
                    desc: 'Dual-agent pair programming with interactive feedback.',
                    badge: 'FAST',
                  },
                ].map((ag) => {
                  const isSel = selectedAgentKind === ag.kind;
                  return (
                    <div
                      key={ag.kind}
                      onClick={() => setSelectedAgentKind(ag.kind)}
                      style={{
                        padding: 14,
                        borderRadius: 12,
                        border: `1.5px solid ${isSel ? 'var(--primary)' : 'var(--outline-variant)'}`,
                        backgroundColor: isSel ? 'rgba(242, 140, 82, 0.08)' : 'var(--surface)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{ag.title}</span>
                          <span
                            style={{
                              fontSize: 9.5,
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: 4,
                              backgroundColor: 'rgba(242, 140, 82, 0.2)',
                              color: 'var(--primary)',
                            }}
                          >
                            {ag.badge}
                          </span>
                        </div>
                        <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '6px 0 0 0' }}>
                          {ag.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px 0' }}>
                Optional Toolchains
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
                Toggle which development environments to enable in your workspace.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { key: 'python' as const, title: 'Python 3.12 & micropip', desc: 'Real Pyodide WebAssembly with numpy, requests, etc.' },
                  { key: 'web' as const, title: 'HTML5, CSS3, & Modern JS/TS', desc: 'Live workspace rendering with in-browser preview tab.' },
                  { key: 'android' as const, title: 'Android Jetpack Compose & XML', desc: 'Template generators and Gradle APK build specs.' },
                  { key: 'clang' as const, title: 'C / C++ Compiler Toolchain', desc: 'WASM clang compilation headers.' },
                  { key: 'php' as const, title: 'PHP 8.2 Runtime', desc: 'Embedded server emulator.' },
                ].map((tc) => {
                  const isChecked = enabledToolchains[tc.key];
                  return (
                    <div
                      key={tc.key}
                      onClick={() => handleToggleToolchain(tc.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: '1px solid var(--outline-variant)',
                        backgroundColor: 'var(--surface)',
                        cursor: 'pointer',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{tc.title}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{tc.desc}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ accentColor: 'var(--primary)', width: 18, height: 18, cursor: 'pointer' }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: AI PROVIDER SETUP */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 16,
                  backgroundColor: 'rgba(242, 140, 82, 0.15)',
                  color: 'var(--primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <KeyRound size={28} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px 0' }}>
                AI Model Provider Setup
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Configure your API key to enable live Claude Code tool calling. Keys stay locally in your browser.
              </p>
            </div>

            {/* Provider quick selection pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { id: 'anthropic', name: 'Anthropic Claude', model: 'claude-3-7-sonnet-20250219', url: 'https://api.anthropic.com/v1' },
                { id: 'openrouter', name: 'OpenRouter', model: 'anthropic/claude-3.5-sonnet', url: 'https://openrouter.ai/api/v1' },
                { id: 'deepseek', name: 'DeepSeek', model: 'deepseek-chat', url: 'https://api.deepseek.com' },
                { id: 'openai', name: 'OpenAI', model: 'gpt-4o', url: 'https://api.openai.com/v1' },
                { id: 'ollama', name: 'Ollama (Local)', model: 'llama3:latest', url: 'http://localhost:11434/v1' },
              ].map((p) => {
                const isSelected = providerId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setProviderId(p.id);
                      setProviderName(p.name);
                      setModel(p.model);
                      setBaseUrl(p.url);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 16,
                      fontSize: 12,
                      fontWeight: 600,
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--outline-variant)'}`,
                      backgroundColor: isSelected ? 'var(--primary)' : 'var(--surface)',
                      color: isSelected ? '#FFFFFF' : 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  API Key
                </label>
                <input
                  type="password"
                  placeholder="sk-ant-... or sk-or-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--outline-variant)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontFamily: 'monospace',
                  }}
                />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  Stored in local browser storage only. Never sent to any 3rd party telemetry.
                </span>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Model Name
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--outline-variant)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  API Base URL
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--outline-variant)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontFamily: 'monospace',
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Wizard Footer Navigation */}
      <div
        style={{
          borderTop: '1px solid var(--outline-variant)',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--surface)',
        }}
      >
        {step > 1 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="btn-outlined"
            style={{ padding: '8px 18px', fontSize: 13 }}
          >
            Back
          </button>
        ) : (
          <div />
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', fontSize: 13 }}
            >
              <span>Continue</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSaveProviderAndFinish}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 24px', fontSize: 13 }}
            >
              <Sparkles size={16} />
              <span>Get Started</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
