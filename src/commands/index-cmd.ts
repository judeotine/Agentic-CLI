import { Command } from 'commander';
import { CommandContext } from '../types/command';
import { CodebaseIndexer } from '../core/codebase-indexer';

export class IndexCommand {
  register(program: Command, context: CommandContext): void {
    const index = program.command('index').description('Codebase indexing and navigation');

    index
      .command('build')
      .description('Build or rebuild codebase index')
      .option('-p, --pattern <patterns...>', 'File patterns to index')
      .action(async (options) => {
        await this.build(options, context);
      });

    index
      .command('find')
      .description('Find symbol in codebase')
      .argument('<symbol>', 'Symbol name to find')
      .action(async (symbol: string) => {
        await this.find(symbol, context);
      });

    index
      .command('refs')
      .description('Find all references to a symbol')
      .argument('<symbol>', 'Symbol name')
      .action(async (symbol: string) => {
        await this.refs(symbol, context);
      });

    index
      .command('deps')
      .description('Show dependencies for a file')
      .argument('<file>', 'File path')
      .option('--reverse', 'Show dependents instead')
      .action(async (file: string, options) => {
        await this.deps(file, options, context);
      });

    index
      .command('todos')
      .description('List all TODOs in codebase')
      .action(async () => {
        await this.todos(context);
      });

    index
      .command('search')
      .description('Search for symbols matching pattern')
      .argument('<pattern>', 'Search pattern')
      .action(async (pattern: string) => {
        await this.searchSymbols(pattern, context);
      });
  }

  private async build(options: any, context: CommandContext): Promise<void> {
    const { logger, config } = context;

    try {
      logger.startSpinner('Building codebase index...');

      const indexer = new CodebaseIndexer(config.workspace.root);
      const patterns = options.pattern || ['**/*.{ts,js,tsx,jsx,py,go,java}'];

      const codeIndex = await indexer.buildIndex(patterns);

      logger.stopSpinner(true, 'Index built successfully');

      logger.info(`\n📇 Codebase Index\n`);
      logger.info(`  Symbols: ${codeIndex.symbols.size}`);
      logger.info(`  Files: ${codeIndex.files.size}`);
      logger.info(`  TODOs: ${codeIndex.todos.length}`);
      logger.info(`  Errors: ${codeIndex.errors.length}`);
    } catch (error) {
      logger.stopSpinner(false, 'Index build failed');
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async find(symbol: string, context: CommandContext): Promise<void> {
    const { logger, config } = context;

    try {
      const indexer = new CodebaseIndexer(config.workspace.root);
      await indexer.buildIndex();

      const found = indexer.findSymbol(symbol);

      if (!found) {
        logger.warn(`Symbol '${symbol}' not found`);
        return;
      }

      logger.info(`\n📍 Symbol: ${found.name}\n`);
      logger.info(`  Type: ${found.type}`);
      logger.info(`  File: ${found.file}:${found.line}`);
      if (found.signature) {
        logger.info(`  Signature: ${found.signature}`);
      }
      if (found.documentation) {
        logger.info(`  Docs: ${found.documentation}`);
      }
      logger.info(`  References: ${found.references.length}`);
    } catch (error) {
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async refs(symbol: string, context: CommandContext): Promise<void> {
    const { logger, config } = context;

    try {
      const indexer = new CodebaseIndexer(config.workspace.root);
      await indexer.buildIndex();

      const references = indexer.findReferences(symbol);

      if (references.length === 0) {
        logger.info(`No references found for '${symbol}'`);
        return;
      }

      logger.info(`\n🔗 References to '${symbol}' (${references.length}):\n`);

      for (const ref of references) {
        logger.info(`  ${ref.file}:${ref.line}`);
      }
    } catch (error) {
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async deps(file: string, options: any, context: CommandContext): Promise<void> {
    const { logger, config } = context;

    try {
      const indexer = new CodebaseIndexer(config.workspace.root);
      await indexer.buildIndex();

      const deps = options.reverse
        ? indexer.getDependents(file)
        : indexer.getDependencies(file);

      const label = options.reverse ? 'Dependents' : 'Dependencies';

      if (deps.length === 0) {
        logger.info(`No ${label.toLowerCase()} found for '${file}'`);
        return;
      }

      logger.info(`\n📦 ${label} for '${file}' (${deps.length}):\n`);

      for (const dep of deps) {
        logger.info(`  ${dep}`);
      }
    } catch (error) {
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async todos(context: CommandContext): Promise<void> {
    const { logger, config } = context;

    try {
      logger.startSpinner('Finding TODOs...');

      const indexer = new CodebaseIndexer(config.workspace.root);
      await indexer.buildIndex();

      const todos = indexer.getTodos();

      logger.stopSpinner(true, `Found ${todos.length} TODOs`);

      if (todos.length === 0) {
        logger.success('✓ No TODOs found');
        return;
      }

      logger.info(`\n📝 TODOs (${todos.length}):\n`);

      for (const todo of todos.slice(0, 50)) {
        logger.info(`  ${todo.file}:${todo.line}`);
        logger.info(`    ${todo.text}`);
        logger.newLine();
      }

      if (todos.length > 50) {
        logger.info(`... and ${todos.length - 50} more TODOs`);
      }
    } catch (error) {
      logger.stopSpinner(false, 'TODO search failed');
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async searchSymbols(pattern: string, context: CommandContext): Promise<void> {
    const { logger, config } = context;

    try {
      const indexer = new CodebaseIndexer(config.workspace.root);
      await indexer.buildIndex();

      const results = indexer.searchSymbols(pattern);

      if (results.length === 0) {
        logger.info(`No symbols found matching '${pattern}'`);
        return;
      }

      logger.info(`\n🔍 Symbols matching '${pattern}' (${results.length}):\n`);

      const symbolData = results.slice(0, 50).map((s) => ({
        Name: s.name,
        Type: s.type,
        File: s.file,
        Line: s.line,
        Refs: s.references.length,
      }));

      logger.table(symbolData);

      if (results.length > 50) {
        logger.info(`\n... and ${results.length - 50} more symbols`);
      }
    } catch (error) {
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }
}

