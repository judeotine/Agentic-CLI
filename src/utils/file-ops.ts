import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

export class FileOperations {
  static async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  }

  static async writeFile(filePath: string, content: string): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  }

  static async deleteFile(filePath: string): Promise<void> {
    await fs.unlink(filePath);
  }

  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  static async ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  static async listFiles(dirPath: string, pattern: string = '**/*'): Promise<string[]> {
    return glob(pattern, { cwd: dirPath, nodir: true });
  }

  static async findFiles(
    rootDir: string,
    pattern: string,
    ignorePaths: string[] = []
  ): Promise<string[]> {
    return glob(pattern, {
      cwd: rootDir,
      ignore: ignorePaths,
      nodir: true,
      absolute: true,
    });
  }

  static async searchInFiles(
    files: string[],
    searchPattern: RegExp
  ): Promise<Array<{ file: string; line: number; match: string; context: string }>> {
    const results: Array<{ file: string; line: number; match: string; context: string }> = [];

    for (const file of files) {
      try {
        const content = await this.readFile(file);
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          if (searchPattern.test(line)) {
            const contextStart = Math.max(0, index - 2);
            const contextEnd = Math.min(lines.length, index + 3);
            const context = lines.slice(contextStart, contextEnd).join('\n');

            results.push({
              file,
              line: index + 1,
              match: line.trim(),
              context,
            });
          }
        });
      } catch (error) {
        console.error(`Error reading file ${file}:`, error);
      }
    }

    return results;
  }

  static async copyFile(source: string, destination: string): Promise<void> {
    await fs.copyFile(source, destination);
  }

  static async moveFile(source: string, destination: string): Promise<void> {
    await fs.rename(source, destination);
  }

  static getExtension(filePath: string): string {
    return path.extname(filePath);
  }

  static getBasename(filePath: string): string {
    return path.basename(filePath);
  }

  static getDirname(filePath: string): string {
    return path.dirname(filePath);
  }

  static joinPath(...paths: string[]): string {
    return path.join(...paths);
  }

  static resolvePath(...paths: string[]): string {
    return path.resolve(...paths);
  }
}

