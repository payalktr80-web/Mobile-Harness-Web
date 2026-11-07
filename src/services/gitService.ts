import git from 'isomorphic-git';
import { ProjectFile, ChangeItem, DiffLine } from '../types/models';
import * as diff from 'diff';

// Memory filesystem adapter for isomorphic-git
export class VirtualGitEngine {
  private files: Record<string, ProjectFile>;
  private commits: Array<{ oid: string; message: string; author: string; timestamp: number }> = [];

  constructor(files: Record<string, ProjectFile>) {
    this.files = files;
    this.commits = [
      {
        oid: 'initial-commit',
        message: 'Initial project workspace commit',
        author: 'Developer <root@pocket>',
        timestamp: Date.now() - 3600000,
      },
    ];
  }

  updateFiles(files: Record<string, ProjectFile>) {
    this.files = files;
  }

  status(): string {
    const list = Object.keys(this.files);
    let out = 'On branch main\n';
    out += 'Your branch is up to date with "origin/main".\n\n';
    out += 'Tracked workspace files:\n';
    for (const f of list) {
      out += `\tmodified:   ${f}\n`;
    }
    return out;
  }

  commit(message: string): string {
    const oid = Math.random().toString(16).substring(2, 9);
    this.commits.unshift({
      oid,
      message,
      author: 'Developer <root@pocket>',
      timestamp: Date.now(),
    });
    return `[main ${oid}] ${message}\n ${Object.keys(this.files).length} files changed`;
  }

  log(): string {
    return this.commits
      .map(
        (c) =>
          `commit ${c.oid}\nAuthor: ${c.author}\nDate:   ${new Date(c.timestamp).toUTCString()}\n\n    ${c.message}\n`
      )
      .join('\n');
  }

  computeDiff(oldFiles: Record<string, ProjectFile>, newFiles: Record<string, ProjectFile>): ChangeItem[] {
    const changes: ChangeItem[] = [];
    const allPaths = new Set([...Object.keys(oldFiles), ...Object.keys(newFiles)]);

    for (const path of allPaths) {
      const oldContent = oldFiles[path]?.content || '';
      const newContent = newFiles[path]?.content || '';

      if (oldContent === newContent) continue;

      const diffResult = diff.diffLines(oldContent, newContent);
      let additions = 0;
      let deletions = 0;
      const diffLines: DiffLine[] = [];

      let oldLineNum = 1;
      let newLineNum = 1;

      for (const part of diffResult) {
        const lines = part.value.split('\n');
        if (lines[lines.length - 1] === '') lines.pop();

        for (const line of lines) {
          if (part.added) {
            additions++;
            diffLines.push({
              type: 'ADDITION',
              text: line,
              newLine: newLineNum++,
            });
          } else if (part.removed) {
            deletions++;
            diffLines.push({
              type: 'DELETION',
              text: line,
              oldLine: oldLineNum++,
            });
          } else {
            diffLines.push({
              type: 'CONTEXT',
              text: line,
              oldLine: oldLineNum++,
              newLine: newLineNum++,
            });
          }
        }
      }

      changes.push({
        path,
        additions,
        deletions,
        diffLines,
      });
    }

    return changes;
  }
}
