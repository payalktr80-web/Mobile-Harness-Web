import { ProjectFile, InstalledPythonPackage } from '../types/models';
import { loadInstalledPackages, saveInstalledPackages } from './storage';

declare global {
  interface Window {
    loadPyodide?: any;
    pyodideInstance?: any;
  }
}

let pyodideInstance: any = null;
let isInitializing = false;
let initPromise: Promise<any> | null = null;

export async function getPyodide(onStatus?: (msg: string) => void): Promise<any> {
  if (pyodideInstance) return pyodideInstance;
  if (window.pyodideInstance) {
    pyodideInstance = window.pyodideInstance;
    return pyodideInstance;
  }
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      if (!window.loadPyodide) {
        onStatus?.('Loading Pyodide WebAssembly runtime...');
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
          script.onload = () => resolve();
          script.onerror = (e) => reject(new Error('Failed to load Pyodide script: ' + e));
          document.head.appendChild(script);
        });
      }

      onStatus?.('Initializing Python 3.12 WebAssembly environment...');
      const pyodide = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
      });

      onStatus?.('Loading micropip package installer...');
      await pyodide.loadPackage('micropip');

      // Create workspace directory in Pyodide FS
      try {
        pyodide.FS.mkdir('/workspace');
      } catch (e) {
        // directory may exist
      }

      pyodideInstance = pyodide;
      window.pyodideInstance = pyodide;
      onStatus?.('Python runtime ready.');
      return pyodide;
    } catch (err: any) {
      console.error('Pyodide initialization error:', err);
      throw err;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

export async function syncFilesToPyodide(pyodide: any, files: Record<string, ProjectFile>, rootDir = '/workspace') {
  if (!pyodide || !pyodide.FS) return;
  try {
    for (const [relativePath, file] of Object.entries(files)) {
      const fullPath = `${rootDir}/${relativePath}`;
      const parts = fullPath.split('/').slice(0, -1);
      
      // ensure parent directories exist
      let curr = '';
      for (const p of parts) {
        if (!p) continue;
        curr += '/' + p;
        try {
          pyodide.FS.mkdir(curr);
        } catch (e) {
          // ignore already exists
        }
      }

      pyodide.FS.writeFile(fullPath, file.content || '');
    }
  } catch (err) {
    console.error('Failed syncing files to Pyodide FS:', err);
  }
}

export interface PythonExecutionResult {
  stdout: string;
  stderr: string;
  result: any;
  exitCode: number;
}

export async function runPythonCode(
  code: string,
  files?: Record<string, ProjectFile>,
  onOutput?: (chunk: string, isError: boolean) => void
): Promise<PythonExecutionResult> {
  let stdoutAccumulator = '';
  let stderrAccumulator = '';

  try {
    const pyodide = await getPyodide((msg) => onOutput?.(`[info] ${msg}\n`, false));

    if (files) {
      await syncFilesToPyodide(pyodide, files);
    }

    pyodide.setStdout({
      batched: (str: string) => {
        stdoutAccumulator += str + '\n';
        onOutput?.(str + '\n', false);
      },
    });

    pyodide.setStderr({
      batched: (str: string) => {
        stderrAccumulator += str + '\n';
        onOutput?.(str + '\n', true);
      },
    });

    // Execute within Pyodide
    const res = await pyodide.runPythonAsync(code);
    return {
      stdout: stdoutAccumulator,
      stderr: stderrAccumulator,
      result: res,
      exitCode: 0,
    };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    stderrAccumulator += errMsg + '\n';
    onOutput?.(errMsg + '\n', true);
    return {
      stdout: stdoutAccumulator,
      stderr: stderrAccumulator,
      result: null,
      exitCode: 1,
    };
  }
}

export async function installPipPackage(
  packageName: string,
  onOutput?: (chunk: string, isError: boolean) => void
): Promise<{ success: boolean; message: string }> {
  try {
    const pyodide = await getPyodide((msg) => onOutput?.(`[info] ${msg}\n`, false));

    onOutput?.(`Collecting ${packageName}...\n`, false);
    onOutput?.(`Using micropip backend in Pyodide WebAssembly...\n`, false);

    const installScript = `
import micropip
await micropip.install('${packageName.trim()}')
`;
    await pyodide.runPythonAsync(installScript);

    onOutput?.(`Successfully installed ${packageName} in browser environment!\n`, false);

    // Update saved packages
    const currentPackages = loadInstalledPackages();
    if (!currentPackages.some((p) => p.name.toLowerCase() === packageName.toLowerCase())) {
      currentPackages.push({
        name: packageName,
        version: 'latest',
        summary: `Installed via micropip on ${new Date().toLocaleDateString()}`,
      });
      saveInstalledPackages(currentPackages);
    }

    return {
      success: true,
      message: `Package ${packageName} installed successfully.`,
    };
  } catch (err: any) {
    const errText = err?.message || String(err);
    onOutput?.(`Error installing ${packageName}: ${errText}\n`, true);
    return {
      success: false,
      message: errText,
    };
  }
}
