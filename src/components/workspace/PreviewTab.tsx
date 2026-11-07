import React, { useState, useMemo } from 'react';
import { RotateCcw, ExternalLink, Smartphone, Monitor, Globe } from 'lucide-react';
import { ProjectFile } from '../../types/models';

interface PreviewTabProps {
  files: Record<string, ProjectFile>;
  webContainerUrl?: string | null;
}

export const PreviewTab: React.FC<PreviewTabProps> = ({ files, webContainerUrl }) => {
  const [key, setKey] = useState(0);
  const [isMobileView, setIsMobileView] = useState(false);

  // Generate self-contained HTML bundle from files
  const bundledHtml = useMemo(() => {
    const htmlFile = files['index.html'] || files['public/index.html'];
    let html = htmlFile ? htmlFile.content : `<!DOCTYPE html><html><body><h1>No index.html found</h1></body></html>`;

    // Inject styles from CSS files
    const cssFiles = Object.keys(files).filter((f) => f.endsWith('.css'));
    if (cssFiles.length > 0) {
      const combinedCss = cssFiles.map((f) => `<style>\n/* ${f} */\n${files[f].content}\n</style>`).join('\n');
      if (html.includes('</head>')) {
        html = html.replace('</head>', `${combinedCss}\n</head>`);
      } else {
        html = combinedCss + html;
      }
    }

    // Inject JS/TS files
    const jsFiles = Object.keys(files).filter((f) => (f.endsWith('.js') || f.endsWith('.ts')) && !f.includes('main.py'));
    if (jsFiles.length > 0) {
      const combinedJs = jsFiles.map((f) => `<script>\n// ${f}\n${files[f].content}\n</script>`).join('\n');
      if (html.includes('</body>')) {
        html = html.replace('</body>', `${combinedJs}\n</body>`);
      } else {
        html = html + combinedJs;
      }
    }

    return html;
  }, [files]);

  const handleOpenExternal = () => {
    if (webContainerUrl) {
      window.open(webContainerUrl, '_blank');
    } else {
      const blob = new Blob([bundledHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Address Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderBottom: '1px solid var(--outline-variant)',
          backgroundColor: 'var(--surface)',
        }}
      >
        <button
          onClick={() => setKey((k) => k + 1)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
          }}
          title="Reload preview"
        >
          <RotateCcw size={16} />
        </button>

        <div
          style={{
            flex: 1,
            backgroundColor: 'var(--bg)',
            border: '1px solid var(--outline)',
            borderRadius: 16,
            padding: '4px 12px',
            fontSize: 12,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            overflow: 'hidden',
          }}
        >
          <Globe size={13} color="var(--primary)" />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {webContainerUrl || 'http://localhost:5173 (sandboxed)'}
          </span>
        </div>

        <button
          onClick={() => setIsMobileView(!isMobileView)}
          style={{
            background: 'none',
            border: 'none',
            color: isMobileView ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
          }}
          title={isMobileView ? 'Switch to Full Width' : 'Switch to Mobile View'}
        >
          {isMobileView ? <Smartphone size={16} /> : <Monitor size={16} />}
        </button>

        <button
          onClick={handleOpenExternal}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
          }}
          title="Open in new window"
        >
          <ExternalLink size={16} />
        </button>
      </div>

      {/* Frame Container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#05070B',
          overflow: 'hidden',
          padding: isMobileView ? '16px' : 0,
        }}
      >
        <iframe
          key={key}
          src={webContainerUrl || undefined}
          srcDoc={!webContainerUrl ? bundledHtml : undefined}
          title="Web Preview"
          sandbox="allow-scripts allow-modals allow-same-origin allow-forms"
          style={{
            width: isMobileView ? 375 : '100%',
            height: isMobileView ? 667 : '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            border: isMobileView ? '1px solid var(--outline)' : 'none',
            borderRadius: isMobileView ? 24 : 0,
            backgroundColor: '#FFFFFF',
            boxShadow: isMobileView ? '0 10px 30px rgba(0,0,0,0.5)' : 'none',
          }}
        />
      </div>
    </div>
  );
};
