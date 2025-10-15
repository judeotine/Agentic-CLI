import { AIProvider } from './ai-provider';
import { FileOperations } from '../utils/file-ops';
import * as path from 'path';

export interface TestSuite {
  file: string;
  framework: 'jest' | 'mocha' | 'vitest' | 'pytest' | 'go-test';
  tests: Test[];
}

export interface Test {
  name: string;
  code: string;
  type: 'unit' | 'integration' | 'e2e';
  coverage: {
    lines: number;
    branches: number;
  };
}

export interface TestRunResult {
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  failures: Array<{
    test: string;
    error: string;
    suggestion: string;
  }>;
}

export class TestGenerator {
  private aiProvider: AIProvider;

  constructor(aiProvider: AIProvider) {
    this.aiProvider = aiProvider;
  }

  async generateTests(sourceFile: string, options?: {
    framework?: string;
    testType?: 'unit' | 'integration' | 'e2e';
    coverageTarget?: number;
  }): Promise<TestSuite> {
    const content = await FileOperations.readFile(sourceFile);
    const framework = options?.framework || this.detectFramework(sourceFile);
    const testType = options?.testType || 'unit';

    const response = await this.aiProvider.chat([
      {
        role: 'system',
        content: `You are a test generation expert. Generate comprehensive ${testType} tests using ${framework}. Include edge cases, error handling, and mocking.`,
      },
      {
        role: 'user',
        content: `Generate tests for this code:\n\n${content}\n\nReturn JSON: { "tests": [{ "name": "...", "code": "..." }] }`,
      },
    ]);

    const parsed = JSON.parse(response.content);

    return {
      file: this.getTestFilePath(sourceFile, framework),
      framework: framework as any,
      tests: parsed.tests.map((t: any) => ({
        ...t,
        type: testType,
        coverage: { lines: 0, branches: 0 },
      })),
    };
  }

  async augmentTests(testFile: string, coverageReport: any): Promise<Test[]> {
    const content = await FileOperations.readFile(testFile);
    const uncoveredLines = this.findUncoveredLines(coverageReport);

    if (uncoveredLines.length === 0) {
      return [];
    }

    const response = await this.aiProvider.chat([
      {
        role: 'system',
        content: `Generate additional tests to cover untested code paths.`,
      },
      {
        role: 'user',
        content: `Existing tests:\n${content}\n\nUncovered lines: ${JSON.stringify(uncoveredLines)}\n\nGenerate additional tests.`,
      },
    ]);

    const parsed = JSON.parse(response.content);
    return parsed.tests;
  }

  async runTests(testFile: string): Promise<TestRunResult> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const framework = this.detectFramework(testFile);
    const command = this.getTestCommand(framework, testFile);

    const startTime = Date.now();

    try {
      const { stdout } = await execAsync(command);
      const duration = Date.now() - startTime;

      return this.parseTestOutput(stdout, duration);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      return this.parseTestOutput(error.stdout || '', duration);
    }
  }

  async repairFailingTest(testName: string, error: string, sourceFile: string): Promise<string> {
    const content = await FileOperations.readFile(sourceFile);

    const response = await this.aiProvider.chat([
      {
        role: 'system',
        content: `You are a test debugging expert. Fix the failing test.`,
      },
      {
        role: 'user',
        content: `Test: ${testName}\nError: ${error}\n\nCode:\n${content}\n\nProvide fixed test code.`,
      },
    ]);

    return response.content;
  }

  async generateIntegrationTests(files: string[]): Promise<TestSuite[]> {
    const contents = await Promise.all(
      files.map(async (f) => ({
        file: f,
        content: await FileOperations.readFile(f),
      }))
    );

    const response = await this.aiProvider.chat([
      {
        role: 'system',
        content: `Generate integration tests that test interaction between multiple modules.`,
      },
      {
        role: 'user',
        content: `Files:\n${contents.map((c) => `${c.file}:\n${c.content}`).join('\n\n')}\n\nGenerate integration tests.`,
      },
    ]);

    const parsed = JSON.parse(response.content);
    return parsed.testSuites;
  }

  async analyzeTestCoverage(coverageFile: string): Promise<{
    overall: number;
    byFile: Record<string, number>;
    suggestions: string[];
  }> {
    const content = await FileOperations.readFile(coverageFile);
    const coverage = JSON.parse(content);

    const response = await this.aiProvider.chat([
      {
        role: 'system',
        content: `Analyze test coverage and suggest improvements.`,
      },
      {
        role: 'user',
        content: `Coverage report:\n${JSON.stringify(coverage, null, 2)}\n\nProvide analysis and suggestions.`,
      },
    ]);

    const analysis = JSON.parse(response.content);
    return {
      overall: coverage.total?.statements?.pct || 0,
      byFile: this.extractFileCoverage(coverage),
      suggestions: analysis.suggestions,
    };
  }

  private detectFramework(file: string): string {
    const ext = path.extname(file);
    if (ext === '.py') return 'pytest';
    if (ext === '.go') return 'go-test';
    return 'jest'; // Default for JS/TS
  }

  private getTestFilePath(sourceFile: string, framework: string): string {
    const dir = path.dirname(sourceFile);
    const name = path.basename(sourceFile, path.extname(sourceFile));

    if (framework === 'pytest') {
      return path.join(dir, `test_${name}.py`);
    }
    if (framework === 'go-test') {
      return path.join(dir, `${name}_test.go`);
    }

    return path.join(dir.replace('/src/', '/tests/'), `${name}.test.ts`);
  }

  private getTestCommand(framework: string, testFile: string): string {
    const commands: Record<string, string> = {
      jest: `npx jest ${testFile}`,
      mocha: `npx mocha ${testFile}`,
      vitest: `npx vitest run ${testFile}`,
      pytest: `pytest ${testFile} -v`,
      'go-test': `go test ${testFile}`,
    };
    return commands[framework] || commands.jest;
  }

  private parseTestOutput(output: string, duration: number): TestRunResult {
    // Simple parser - could be enhanced per framework
    const passedMatch = output.match(/(\d+) passed/);
    const failedMatch = output.match(/(\d+) failed/);
    const skippedMatch = output.match(/(\d+) skipped/);

    return {
      passed: passedMatch ? parseInt(passedMatch[1]) : 0,
      failed: failedMatch ? parseInt(failedMatch[1]) : 0,
      skipped: skippedMatch ? parseInt(skippedMatch[1]) : 0,
      duration,
      failures: [],
    };
  }

  private findUncoveredLines(coverageReport: any): number[] {
    const lines: number[] = [];
    // Extract uncovered line numbers from coverage report
    // Implementation depends on coverage report format
    return lines;
  }

  private extractFileCoverage(coverage: any): Record<string, number> {
    const byFile: Record<string, number> = {};
    for (const [file, data] of Object.entries(coverage)) {
      if (typeof data === 'object' && data !== null) {
        const fileData: any = data;
        byFile[file] = fileData.statements?.pct || 0;
      }
    }
    return byFile;
  }
}

