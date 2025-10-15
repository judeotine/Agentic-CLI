import { Command } from 'commander';
import { CommandContext, EditOperation } from '../types/command';
import { FileOperations } from '../utils/file-ops';
import { AgentTask } from '../types/agent';

export class CodeEditCommand {
  register(program: Command, context: CommandContext): void {
    program
      .command('code-edit')
      .description('Edit code files using AI assistance')
      .argument('<files...>', 'Files to edit')
      .option('-p, --prompt <prompt>', 'Edit instruction')
      .option('-i, --interactive', 'Interactive mode')
      .option('-m, --model <model>', 'AI model to use')
      .option('--dry-run', 'Preview changes without applying')
      .action(async (files: string[], options) => {
        await this.execute(files, options, context);
      });

    program
      .command('code-edit:multi')
      .description('Edit multiple files in parallel')
      .argument('<pattern>', 'File pattern to match')
      .option('-p, --prompt <prompt>', 'Edit instruction')
      .option('-m, --model <model>', 'AI model to use')
      .option('--max-concurrent <num>', 'Maximum concurrent edits', '3')
      .action(async (pattern: string, options) => {
        await this.executeMulti(pattern, options, context);
      });
  }

  private async execute(
    files: string[],
    options: any,
    context: CommandContext
  ): Promise<void> {
    const { logger, aiProvider, config } = context;

    try {
      logger.startSpinner('Analyzing files...');

      const fileContents = await Promise.all(
        files.map(async (file) => ({
          path: file,
          content: await FileOperations.readFile(file),
        }))
      );

      logger.updateSpinner('Generating edits...');

      const prompt = options.prompt || (await this.getInteractivePrompt(options.interactive));

      const systemMessage = `You are a code editing assistant. Analyze the provided files and generate precise edits based on the user's request. Return a JSON array of edit operations.`;

      const userMessage = `Files to edit:\n${fileContents
        .map((f) => `File: ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
        .join('\n\n')}\n\nEdit instruction: ${prompt}\n\nProvide edits in this JSON format:\n[{"file": "path", "operation": "update", "content": "new content", "startLine": 1, "endLine": 10, "reasoning": "why"}]`;

      const response = await aiProvider.chat([
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ]);

      const edits: EditOperation[] = JSON.parse(response.content);

      logger.stopSpinner(true, `Generated ${edits.length} edit operations`);

      if (options.dryRun) {
        logger.info('\nProposed edits (dry run):');
        edits.forEach((edit) => {
          logger.info(`\n${edit.operation.toUpperCase()}: ${edit.file}`);
          logger.info(`Reasoning: ${edit.reasoning}`);
        });
        return;
      }

      await this.applyEdits(edits, context);

      logger.success(`✓ Successfully edited ${files.length} file(s)`);
    } catch (error) {
      logger.stopSpinner(false, 'Edit failed');
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async executeMulti(
    pattern: string,
    options: any,
    context: CommandContext
  ): Promise<void> {
    const { logger, agentOrchestrator, config } = context;

    try {
      logger.startSpinner('Finding matching files...');

      const files = await FileOperations.findFiles(
        config.workspace.root,
        pattern,
        config.workspace.ignorePaths
      );

      logger.stopSpinner(true, `Found ${files.length} files`);

      if (files.length === 0) {
        logger.warn('No files found matching pattern');
        return;
      }

      const tasks: AgentTask[] = files.map((file, index) => ({
        id: `edit-${index}`,
        type: 'code-edit',
        description: `Edit ${file}`,
        input: {
          file,
          prompt: options.prompt,
        },
        priority: 1,
      }));

      logger.info(`Executing ${tasks.length} parallel edits...`);

      const results = await agentOrchestrator.executeParallel(tasks);

      const successful = results.filter((r) => r.status === 'success').length;
      const failed = results.filter((r) => r.status === 'failure').length;

      logger.success(`✓ Completed: ${successful} successful, ${failed} failed`);
    } catch (error) {
      logger.error(`Multi-edit error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async applyEdits(edits: EditOperation[], context: CommandContext): Promise<void> {
    const { logger, pluginManager } = context;

    for (const edit of edits) {
      await pluginManager.executeHook('pre-edit', edit);

      switch (edit.operation) {
        case 'create':
          await FileOperations.writeFile(edit.file, edit.content || '');
          logger.info(`Created: ${edit.file}`);
          break;

        case 'update':
          await FileOperations.writeFile(edit.file, edit.content || '');
          logger.info(`Updated: ${edit.file}`);
          break;

        case 'delete':
          await FileOperations.deleteFile(edit.file);
          logger.info(`Deleted: ${edit.file}`);
          break;
      }

      await pluginManager.executeHook('post-edit', edit);
    }
  }

  private async getInteractivePrompt(interactive: boolean): Promise<string> {
    if (!interactive) {
      throw new Error('Prompt is required in non-interactive mode');
    }

    const inquirer = await import('inquirer');
    const { prompt } = await inquirer.default.prompt([
      {
        type: 'input',
        name: 'prompt',
        message: 'Enter your edit instruction:',
        validate: (input: string) => (input.length > 0 ? true : 'Prompt cannot be empty'),
      },
    ]);

    return prompt;
  }
}

