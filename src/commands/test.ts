import { Command } from 'commander';
import { CommandContext } from '../types/command';
import { TestGenerator } from '../core/test-generator';

export class TestCommand {
  register(program: Command, context: CommandContext): void {
    const test = program.command('test').description('Automated test generation and management');

    test
      .command('generate')
      .description('Generate tests for source files')
      .argument('<files...>', 'Source files to generate tests for')
      .option('-f, --framework <name>', 'Test framework: jest, mocha, pytest', 'jest')
      .option('-t, --type <type>', 'Test type: unit, integration, e2e', 'unit')
      .option('--coverage <percent>', 'Target coverage percentage', '80')
      .action(async (files: string[], options) => {
        await this.generate(files, options, context);
      });

    test
      .command('run')
      .description('Run tests and analyze results')
      .argument('[files...]', 'Test files to run')
      .option('--fix', 'Auto-fix failing tests')
      .action(async (files: string[], options) => {
        await this.run(files, options, context);
      });

    test
      .command('coverage')
      .description('Analyze test coverage and suggest improvements')
      .option('--file <path>', 'Coverage file path', 'coverage/coverage-final.json')
      .action(async (options) => {
        await this.coverage(options, context);
      });

    test
      .command('augment')
      .description('Add tests to improve coverage')
      .argument('<test-file>', 'Test file to augment')
      .option('--coverage-file <path>', 'Coverage report path')
      .action(async (testFile: string, options) => {
        await this.augment(testFile, options, context);
      });
  }

  private async generate(files: string[], options: any, context: CommandContext): Promise<void> {
    const { logger, aiProvider } = context;

    try {
      logger.startSpinner('Generating tests...');

      const generator = new TestGenerator(aiProvider);
      const testSuites = await Promise.all(
        files.map((file) =>
          generator.generateTests(file, {
            framework: options.framework,
            testType: options.type,
            coverageTarget: parseInt(options.coverage),
          })
        )
      );

      logger.stopSpinner(true, 'Tests generated');

      for (const suite of testSuites) {
        logger.info(`\n📝 ${suite.file}`);
        logger.info(`   Framework: ${suite.framework}`);
        logger.info(`   Tests: ${suite.tests.length}`);

        // Write test file
        const content = this.formatTests(suite);
        const { FileOperations } = await import('../utils/file-ops');
        await FileOperations.writeFile(suite.file, content);

        logger.success(`   ✓ Written to ${suite.file}`);
      }
    } catch (error) {
      logger.stopSpinner(false, 'Generation failed');
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async run(files: string[], options: any, context: CommandContext): Promise<void> {
    const { logger, aiProvider } = context;

    try {
      logger.startSpinner('Running tests...');

      const generator = new TestGenerator(aiProvider);
      const results = await Promise.all(files.map((file) => generator.runTests(file)));

      logger.stopSpinner(true, 'Tests complete');

      let totalPassed = 0;
      let totalFailed = 0;
      let totalDuration = 0;

      for (const result of results) {
        totalPassed += result.passed;
        totalFailed += result.failed;
        totalDuration += result.duration;
      }

      logger.info(`\n📊 Test Results\n`);
      logger.success(`  Passed: ${totalPassed}`);
      if (totalFailed > 0) {
        logger.error(`  Failed: ${totalFailed}`);
      }
      logger.info(`  Duration: ${totalDuration}ms\n`);

      // Show failures
      for (const result of results) {
        if (result.failures.length > 0) {
          logger.error(`Failures:\n`);
          for (const failure of result.failures) {
            logger.error(`  ✗ ${failure.test}`);
            logger.error(`    ${failure.error}`);
            if (options.fix && failure.suggestion) {
              logger.info(`    💡 ${failure.suggestion}`);
            }
          }
        }
      }

      if (options.fix && totalFailed > 0) {
        logger.info('\n🔧 Attempting to fix failing tests...');
        // Auto-fix logic would go here
      }
    } catch (error) {
      logger.stopSpinner(false, 'Test run failed');
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async coverage(options: any, context: CommandContext): Promise<void> {
    const { logger, aiProvider } = context;

    try {
      logger.startSpinner('Analyzing coverage...');

      const generator = new TestGenerator(aiProvider);
      const analysis = await generator.analyzeTestCoverage(options.file);

      logger.stopSpinner(true, 'Analysis complete');

      logger.info(`\n📊 Coverage Analysis\n`);
      logger.info(`Overall Coverage: ${analysis.overall.toFixed(2)}%\n`);

      logger.info(`By File:`);
      const sortedFiles = Object.entries(analysis.byFile).sort((a, b) => a[1] - b[1]);

      for (const [file, coverage] of sortedFiles.slice(0, 10)) {
        const icon = coverage >= 80 ? '✓' : coverage >= 50 ? '⚠' : '✗';
        logger.info(`  ${icon} ${file}: ${coverage.toFixed(2)}%`);
      }

      logger.info(`\n💡 Suggestions:\n`);
      for (const suggestion of analysis.suggestions) {
        logger.info(`  • ${suggestion}`);
      }
    } catch (error) {
      logger.stopSpinner(false, 'Coverage analysis failed');
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async augment(testFile: string, options: any, context: CommandContext): Promise<void> {
    const { logger, aiProvider } = context;

    try {
      logger.startSpinner('Augmenting tests...');

      const { FileOperations } = await import('../utils/file-ops');
      const coverageReport = options.coverageFile
        ? JSON.parse(await FileOperations.readFile(options.coverageFile))
        : null;

      const generator = new TestGenerator(aiProvider);
      const newTests = await generator.augmentTests(testFile, coverageReport);

      logger.stopSpinner(true, `Generated ${newTests.length} additional tests`);

      if (newTests.length > 0) {
        const content = await FileOperations.readFile(testFile);
        const augmented = this.appendTests(content, newTests);
        await FileOperations.writeFile(testFile, augmented);

        logger.success(`✓ Added ${newTests.length} tests to ${testFile}`);
      } else {
        logger.info('No additional tests needed');
      }
    } catch (error) {
      logger.stopSpinner(false, 'Augmentation failed');
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private formatTests(suite: any): string {
    let content = `// Auto-generated tests\n\n`;

    for (const test of suite.tests) {
      content += `${test.code}\n\n`;
    }

    return content;
  }

  private appendTests(existing: string, newTests: any[]): string {
    return existing + '\n\n// Augmented tests\n\n' + newTests.map((t) => t.code).join('\n\n');
  }
}

