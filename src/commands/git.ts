import { Command } from 'commander';
import { CommandContext } from '../types/command';

export class GitCommand {
  register(program: Command, context: CommandContext): void {
    program
      .command('git:commit')
      .description('Commit changes with AI-generated message')
      .option('-f, --files <files...>', 'Specific files to commit')
      .option('-m, --message <message>', 'Custom commit message')
      .option('--auto', 'Use AI to generate commit message')
      .action(async (options) => {
        await this.commit(options, context);
      });

    program
      .command('git:status')
      .description('Show git repository status')
      .action(async () => {
        await this.status(context);
      });

    program
      .command('git:diff')
      .description('Show diff with AI analysis')
      .option('--staged', 'Show staged changes')
      .option('--analyze', 'AI analysis of changes')
      .action(async (options) => {
        await this.diff(options, context);
      });

    program
      .command('git:auto-fix')
      .description('Auto-fix linting issues and commit')
      .option('--push', 'Push after fixing')
      .action(async (options) => {
        await this.autoFix(options, context);
      });
  }

  private async commit(options: any, context: CommandContext): Promise<void> {
    const { logger, gitService, aiProvider, pluginManager } = context;

    try {
      const hasChanges = await gitService.hasUncommittedChanges();
      if (!hasChanges) {
        logger.warn('No changes to commit');
        return;
      }

      let message = options.message;

      if (options.auto && !message) {
        logger.startSpinner('Generating commit message...');

        const diff = await gitService.getDiff(false);

        const systemMessage = `You are a commit message generator. Analyze the git diff and generate a concise, descriptive commit message following conventional commits format.`;

        const userMessage = `Git diff:\n\`\`\`\n${diff}\n\`\`\`\n\nGenerate a commit message.`;

        const response = await aiProvider.chat([
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage },
        ]);

        message = response.content.trim();
        logger.stopSpinner(true, 'Generated commit message');
        logger.info(`Message: ${message}`);
      }

      if (!message) {
        throw new Error('Commit message is required');
      }

      await pluginManager.executeHook('pre-commit', { message, files: options.files });

      logger.startSpinner('Committing changes...');

      const commitHash = await gitService.commit(message, options.files);

      logger.stopSpinner(true, 'Changes committed');
      logger.success(`✓ Committed: ${commitHash.substring(0, 7)}`);

      await pluginManager.executeHook('post-commit', { hash: commitHash, message });
    } catch (error) {
      logger.stopSpinner(false, 'Commit failed');
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async status(context: CommandContext): Promise<void> {
    const { logger, gitService } = context;

    try {
      const status = await gitService.getStatus();

      logger.info('\nGit Repository Status\n');
      logger.info(`Branch: ${status.current}`);
      logger.info(`Ahead: ${status.ahead}, Behind: ${status.behind}\n`);

      if (status.files.length === 0) {
        logger.success('Working directory clean');
        return;
      }

      logger.info('Changes:');
      status.files.forEach((file) => {
        const symbol = this.getFileStatusSymbol(file.working_dir);
        logger.info(`  ${symbol} ${file.path}`);
      });
    } catch (error) {
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async diff(options: any, context: CommandContext): Promise<void> {
    const { logger, gitService, aiProvider } = context;

    try {
      logger.startSpinner('Getting diff...');

      const diff = await gitService.getDiff(options.staged);

      logger.stopSpinner(true, 'Diff retrieved');

      if (!diff) {
        logger.info('No changes to show');
        return;
      }

      if (options.analyze) {
        logger.startSpinner('Analyzing changes with AI...');

        const systemMessage = `You are a code review assistant. Analyze the git diff and provide insights on the changes.`;

        const userMessage = `Git diff:\n\`\`\`\n${diff}\n\`\`\`\n\nProvide analysis of these changes.`;

        const response = await aiProvider.chat([
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage },
        ]);

        logger.stopSpinner(true, 'Analysis complete');
        logger.info('\nAI Analysis:');
        logger.info(response.content);
      } else {
        console.log(diff);
      }
    } catch (error) {
      logger.stopSpinner(false, 'Diff failed');
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async autoFix(options: any, context: CommandContext): Promise<void> {
    const { logger, gitService } = context;

    try {
      logger.info('Running linter...');

      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      try {
        await execAsync('npm run lint:fix');
        logger.success('✓ Linting issues fixed');
      } catch (lintError) {
        logger.warn('Some linting issues could not be auto-fixed');
      }

      const hasChanges = await gitService.hasUncommittedChanges();
      if (!hasChanges) {
        logger.info('No changes after auto-fix');
        return;
      }

      const message = 'chore: auto-fix linting issues';
      await gitService.commit(message);

      logger.success('✓ Changes committed');

      if (options.push) {
        logger.startSpinner('Pushing changes...');
        await gitService.push();
        logger.stopSpinner(true, 'Changes pushed');
      }
    } catch (error) {
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private getFileStatusSymbol(status: string): string {
    const symbols: Record<string, string> = {
      M: '✎',
      A: '+',
      D: '✗',
      R: '→',
      '?': '?',
    };
    return symbols[status] || status;
  }
}

