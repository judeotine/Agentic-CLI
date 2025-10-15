import { Command } from 'commander';
import { CommandContext, SearchResult } from '../types/command';
import { FileOperations } from '../utils/file-ops';

export class RepoSearchCommand {
  register(program: Command, context: CommandContext): void {
    program
      .command('search')
      .description('Search for code patterns in repository')
      .argument('<query>', 'Search query or pattern')
      .option('-t, --type <type>', 'Search type: text, regex, semantic', 'text')
      .option('-f, --files <pattern>', 'File pattern to search', '**/*')
      .option('-i, --ignore-case', 'Case insensitive search')
      .option('-c, --context <lines>', 'Context lines to show', '3')
      .option('--json', 'Output results as JSON')
      .action(async (query: string, options) => {
        await this.execute(query, options, context);
      });

    program
      .command('search:semantic')
      .description('AI-powered semantic code search')
      .argument('<query>', 'Natural language query')
      .option('-m, --model <model>', 'AI model to use')
      .option('--limit <num>', 'Maximum results', '10')
      .action(async (query: string, options) => {
        await this.executeSemanticSearch(query, options, context);
      });
  }

  private async execute(query: string, options: any, context: CommandContext): Promise<void> {
    const { logger, config } = context;

    try {
      logger.startSpinner('Searching repository...');

      const files = await FileOperations.findFiles(
        config.workspace.root,
        options.files,
        config.workspace.ignorePaths
      );

      const searchPattern = this.buildSearchPattern(query, options);
      const rawResults = await FileOperations.searchInFiles(files, searchPattern);
      const results: SearchResult[] = rawResults.map((r: any) => ({
        ...r,
        column: r.column || 1
      }));

      logger.stopSpinner(true, `Found ${results.length} matches`);

      if (options.json) {
        logger.json(results);
      } else {
        this.displayResults(results, context);
      }
    } catch (error) {
      logger.stopSpinner(false, 'Search failed');
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async executeSemanticSearch(
    query: string,
    options: any,
    context: CommandContext
  ): Promise<void> {
    const { logger, aiProvider, config } = context;

    try {
      logger.startSpinner('Performing semantic search...');

      const files = await FileOperations.findFiles(
        config.workspace.root,
        '**/*.{ts,js,tsx,jsx,py,go,java}',
        config.workspace.ignorePaths
      );

      const fileContents = await Promise.all(
        files.slice(0, 50).map(async (file) => ({
          path: file,
          content: await FileOperations.readFile(file),
        }))
      );

      logger.updateSpinner('Analyzing code with AI...');

      const systemMessage = `You are a code search assistant. Analyze the provided codebase and find files/functions/classes that match the user's semantic query. Return results as JSON array.`;

      const userMessage = `Codebase:\n${fileContents
        .map((f) => `File: ${f.path}\n\`\`\`\n${f.content.slice(0, 1000)}\n\`\`\``)
        .join('\n\n')}\n\nQuery: ${query}\n\nReturn top ${options.limit} most relevant results in JSON format: [{"file": "path", "line": 1, "match": "code", "context": "explanation", "relevance": 0.95}]`;

      const response = await aiProvider.chat([
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ]);

      const rawResults = JSON.parse(response.content);
      const results: SearchResult[] = rawResults.map((r: any) => ({
        ...r,
        column: r.column || 1
      }));

      logger.stopSpinner(true, `Found ${results.length} semantic matches`);

      this.displayResults(results, context);
    } catch (error) {
      logger.stopSpinner(false, 'Semantic search failed');
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private buildSearchPattern(query: string, options: any): RegExp {
    const flags = options.ignoreCase ? 'gi' : 'g';

    if (options.type === 'regex') {
      return new RegExp(query, flags);
    }

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escaped, flags);
  }

  private displayResults(results: SearchResult[], context: CommandContext): void {
    const { logger } = context;

    if (results.length === 0) {
      logger.warn('No matches found');
      return;
    }

    logger.info(`\nSearch Results (${results.length} matches):\n`);

    results.forEach((result, index) => {
      logger.info(`${index + 1}. ${result.file}:${result.line}`);
      logger.info(`   ${result.match}`);
      if (result.context) {
        logger.debug(`   Context:\n   ${result.context.replace(/\n/g, '\n   ')}`);
      }
      logger.newLine();
    });
  }
}

