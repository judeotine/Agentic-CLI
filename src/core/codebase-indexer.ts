import { FileOperations } from '../utils/file-ops';
import * as path from 'path';

export interface CodeSymbol {
  name: string;
  type: 'function' | 'class' | 'interface' | 'variable' | 'constant';
  file: string;
  line: number;
  signature?: string;
  documentation?: string;
  references: Array<{ file: string; line: number }>;
}

export interface CodeIndex {
  symbols: Map<string, CodeSymbol>;
  files: Map<string, FileIndex>;
  dependencies: Map<string, string[]>;
  todos: Array<{ file: string; line: number; text: string }>;
  errors: Array<{ file: string; line: number; message: string }>;
}

export interface FileIndex {
  path: string;
  hash: string;
  imports: string[];
  exports: string[];
  symbols: string[];
  lastIndexed: Date;
}

export class CodebaseIndexer {
  private index: CodeIndex;
  private rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
    this.index = {
      symbols: new Map(),
      files: new Map(),
      dependencies: new Map(),
      todos: [],
      errors: [],
    };
  }

  async buildIndex(patterns: string[] = ['**/*.{ts,js,tsx,jsx,py,go,java}']): Promise<CodeIndex> {
    console.log('Building codebase index...');

    const files = await FileOperations.findFiles(this.rootDir, patterns[0], [
      'node_modules',
      'dist',
      '.git',
    ]);

    for (const file of files) {
      await this.indexFile(file);
    }

    await this.buildDependencyGraph();
    console.log(`Indexed ${this.index.symbols.size} symbols across ${files.length} files`);

    return this.index;
  }

  private async indexFile(file: string): Promise<void> {
    try {
      const content = await FileOperations.readFile(file);
      const hash = this.hash(content);

      // Check if file already indexed with same hash
      const existing = this.index.files.get(file);
      if (existing && existing.hash === hash) {
        return;
      }

      const fileIndex: FileIndex = {
        path: file,
        hash,
        imports: [],
        exports: [],
        symbols: [],
        lastIndexed: new Date(),
      };

      // Extract symbols
      const symbols = this.extractSymbols(content, file);
      symbols.forEach((symbol) => {
        this.index.symbols.set(symbol.name, symbol);
        fileIndex.symbols.push(symbol.name);
      });

      // Extract imports/exports
      fileIndex.imports = this.extractImports(content);
      fileIndex.exports = this.extractExports(content);

      // Extract TODOs
      this.extractTodos(content, file);

      this.index.files.set(file, fileIndex);
    } catch (error) {
      console.error(`Error indexing ${file}:`, error);
    }
  }

  private extractSymbols(content: string, file: string): CodeSymbol[] {
    const symbols: CodeSymbol[] = [];
    const lines = content.split('\n');

    // Function declarations
    const funcPattern = /(?:function|const|let|var)\s+(\w+)\s*(?:=\s*)?(?:\([^)]*\)|async)/g;
    let match;
    while ((match = funcPattern.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      symbols.push({
        name: match[1],
        type: 'function',
        file,
        line,
        references: [],
      });
    }

    // Class declarations
    const classPattern = /class\s+(\w+)/g;
    while ((match = classPattern.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      symbols.push({
        name: match[1],
        type: 'class',
        file,
        line,
        references: [],
      });
    }

    // Interface declarations (TypeScript)
    const interfacePattern = /interface\s+(\w+)/g;
    while ((match = interfacePattern.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      symbols.push({
        name: match[1],
        type: 'interface',
        file,
        line,
        references: [],
      });
    }

    return symbols;
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const importPattern = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importPattern.exec(content)) !== null) {
      imports.push(match[1]);
    }

    // CommonJS require
    const requirePattern = /require\(['"]([^'"]+)['"]\)/g;
    while ((match = requirePattern.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];
    const exportPattern = /export\s+(?:default\s+)?(?:class|function|const|let|interface)\s+(\w+)/g;
    let match;

    while ((match = exportPattern.exec(content)) !== null) {
      exports.push(match[1]);
    }

    return exports;
  }

  private extractTodos(content: string, file: string): void {
    const lines = content.split('\n');
    const todoPattern = /\/\/\s*(TODO|FIXME|HACK|XXX):?\s*(.+)/i;

    lines.forEach((line, index) => {
      const match = line.match(todoPattern);
      if (match) {
        this.index.todos.push({
          file,
          line: index + 1,
          text: match[2].trim(),
        });
      }
    });
  }

  private async buildDependencyGraph(): Promise<void> {
    for (const [file, fileIndex] of this.index.files.entries()) {
      const deps: string[] = [];

      for (const imp of fileIndex.imports) {
        const resolvedPath = this.resolveImport(imp, file);
        if (resolvedPath && this.index.files.has(resolvedPath)) {
          deps.push(resolvedPath);

          // Update references for imported symbols
          const importedFile = this.index.files.get(resolvedPath);
          if (importedFile) {
            importedFile.exports.forEach((exportedSymbol) => {
              const symbol = this.index.symbols.get(exportedSymbol);
              if (symbol) {
                symbol.references.push({ file, line: 0 });
              }
            });
          }
        }
      }

      this.index.dependencies.set(file, deps);
    }
  }

  private resolveImport(importPath: string, fromFile: string): string | null {
    // Relative import
    if (importPath.startsWith('.')) {
      const dir = path.dirname(fromFile);
      let resolved = path.resolve(dir, importPath);

      // Try with extensions
      for (const ext of ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.js']) {
        const withExt = resolved + ext;
        if (this.index.files.has(withExt)) {
          return withExt;
        }
      }
    }

    return null;
  }

  findSymbol(name: string): CodeSymbol | undefined {
    return this.index.symbols.get(name);
  }

  findReferences(symbolName: string): Array<{ file: string; line: number }> {
    const symbol = this.index.symbols.get(symbolName);
    return symbol?.references || [];
  }

  getDependencies(file: string): string[] {
    return this.index.dependencies.get(file) || [];
  }

  getDependents(file: string): string[] {
    const dependents: string[] = [];
    for (const [f, deps] of this.index.dependencies.entries()) {
      if (deps.includes(file)) {
        dependents.push(f);
      }
    }
    return dependents;
  }

  searchSymbols(query: string): CodeSymbol[] {
    const results: CodeSymbol[] = [];
    const lowerQuery = query.toLowerCase();

    for (const symbol of this.index.symbols.values()) {
      if (symbol.name.toLowerCase().includes(lowerQuery)) {
        results.push(symbol);
      }
    }

    return results;
  }

  getTodos(): Array<{ file: string; line: number; text: string }> {
    return this.index.todos;
  }

  getErrors(): Array<{ file: string; line: number; message: string }> {
    return this.index.errors;
  }

  async getCallGraph(functionName: string): Promise<Map<string, string[]>> {
    const graph = new Map<string, string[]>();
    const symbol = this.findSymbol(functionName);

    if (!symbol) return graph;

    // Build call graph by analyzing function bodies
    // This is a simplified version
    graph.set(functionName, []);

    return graph;
  }

  private hash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  getIndex(): CodeIndex {
    return this.index;
  }
}

