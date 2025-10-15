import { Command } from 'commander';
import { CommandContext } from '../types/command';
import { WebSearchService } from '../core/web-search';

export class WebCommand {
  register(program: Command, context: CommandContext): void {
    const web = program.command('web').description('Web search and grounded answers');

    web
      .command('search')
      .description('Search the web for information')
      .argument('<query>', 'Search query')
      .option('-e, --engine <name>', 'Search engine: brave, google, duckduckgo', 'brave')
      .option('-n, --limit <number>', 'Number of results', '10')
      .action(async (query: string, options) => {
        await this.search(query, options, context);
      });

    web
      .command('ask')
      .description('Get AI answer grounded in web search')
      .argument('<question>', 'Question to ask')
      .action(async (question: string) => {
        await this.ask(question, context);
      });

    web
      .command('docs')
      .description('Search documentation for a technology')
      .argument('<technology>', 'Technology name (e.g., React, TypeScript)')
      .argument('<query>', 'What to search for')
      .action(async (technology: string, query: string) => {
        await this.docs(technology, query, context);
      });

    web
      .command('examples')
      .description('Find code examples')
      .argument('<technology>', 'Technology/language')
      .argument('<task>', 'Task description')
      .action(async (technology: string, task: string) => {
        await this.examples(technology, task, context);
      });
  }

  private async search(query: string, options: any, context: CommandContext): Promise<void> {
    const { logger, aiProvider, config } = context;

    try {
      logger.startSpinner('Searching the web...');

      const webSearch = new WebSearchService(aiProvider, config);
      const results = await webSearch.search(query, options.engine);

      logger.stopSpinner(true, `Found ${results.length} results`);

      logger.info(`\n🔍 Web Search Results\n`);

      for (const result of results.slice(0, parseInt(options.limit))) {
        logger.info(`${result.title}`);
        logger.info(`  ${result.url}`);
        logger.info(`  ${result.snippet}`);
        logger.newLine();
      }
    } catch (error) {
      logger.stopSpinner(false, 'Search failed');
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async ask(question: string, context: CommandContext): Promise<void> {
    const { logger, aiProvider, config } = context;

    try {
      logger.startSpinner('Searching and analyzing...');

      const webSearch = new WebSearchService(aiProvider, config);
      const answer = await webSearch.groundedAnswer(question);

      logger.stopSpinner(true, 'Answer ready');

      logger.info(`\n💡 Answer (Confidence: ${(answer.confidence * 100).toFixed(1)}%)\n`);
      logger.info(answer.answer);

      logger.info(`\n📚 Sources:\n`);
      for (const source of answer.sources) {
        logger.info(`  • ${source.title}`);
        logger.info(`    ${source.url}`);
      }
    } catch (error) {
      logger.stopSpinner(false, 'Query failed');
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async docs(technology: string, query: string, context: CommandContext): Promise<void> {
    const { logger, aiProvider, config } = context;

    try {
      logger.startSpinner('Searching documentation...');

      const webSearch = new WebSearchService(aiProvider, config);
      const results = await webSearch.searchDocumentation(technology, query);

      logger.stopSpinner(true, `Found ${results.length} documentation pages`);

      logger.info(`\n📖 ${technology} Documentation\n`);

      for (const result of results.slice(0, 5)) {
        logger.info(`${result.title}`);
        logger.info(`  ${result.url}`);
        logger.info(`  ${result.snippet}`);
        logger.newLine();
      }
    } catch (error) {
      logger.stopSpinner(false, 'Documentation search failed');
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async examples(technology: string, task: string, context: CommandContext): Promise<void> {
    const { logger, aiProvider, config } = context;

    try {
      logger.startSpinner('Finding code examples...');

      const webSearch = new WebSearchService(aiProvider, config);
      const examples = await webSearch.findCodeExamples(technology, task);

      logger.stopSpinner(true, `Found ${examples.length} examples`);

      logger.info(`\n💻 Code Examples for: ${technology} - ${task}\n`);

      for (const [index, example] of examples.entries()) {
        logger.info(`Example ${index + 1}:\n`);
        console.log(example);
        logger.newLine();
      }
    } catch (error) {
      logger.stopSpinner(false, 'Example search failed');
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }
}

