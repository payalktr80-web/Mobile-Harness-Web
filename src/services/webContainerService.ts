import { WebContainer } from '@webcontainer/api';
import { ProjectFile } from '../types/models';

let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer | null> | null = null;
let serverUrlCallback: ((port: number, url: string) => void) | null = null;

export function onWebContainerServerReady(callback: (port: number, url: string) => void) {
  serverUrlCallback = callback;
}

export function isCrossOriginIsolated(): boolean {
  return typeof window !== 'undefined' && Boolean(window.crossOriginIsolated);
}

export async function getWebContainer(): Promise<WebContainer | null> {
  if (webcontainerInstance) return webcontainerInstance;
  if (bootPromise) return bootPromise;

  bootPromise = (async () => {
    try {
      if (!isCrossOriginIsolated()) {
        console.warn('Cross-origin isolation is not active yet. WebContainer requires COOP/COEP.');
      }
      
      const container = await WebContainer.boot();
      webcontainerInstance = container;
      console.log('WebContainer successfully booted!');

      // Listen for preview servers
      container.on('server-ready', (port, url) => {
        console.log(`WebContainer server ready on port ${port}: ${url}`);
        serverUrlCallback?.(port, url);
      });

      return container;
    } catch (err) {
      console.warn('WebContainer boot unavailable, using integrated virtual shell engine:', err);
      return null;
    } finally {
      bootPromise = null;
    }
  })();

  return bootPromise;
}

export async function syncFilesToWebContainer(container: WebContainer, files: Record<string, ProjectFile>) {
  if (!container) return;
  try {
    const tree: Record<string, any> = {};

    for (const [path, file] of Object.entries(files)) {
      const parts = path.split('/');
      let current = tree;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = { directory: {} };
        }
        current = current[part].directory;
      }
      const filename = parts[parts.length - 1];
      current[filename] = {
        file: {
          contents: file.content || '',
        },
      };
    }

    await container.mount(tree);
  } catch (err) {
    console.error('Error mounting files to WebContainer:', err);
  }
}
