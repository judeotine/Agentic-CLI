import { Command } from 'commander';
import { CommandContext } from '../types/command';
import { AgentTask } from '../types/agent';

export class AgentManagerCommand {
  register(program: Command, context: CommandContext): void {
    program
      .command('agent:run')
      .description('Run an agent task')
      .argument('<type>', 'Task type: code-edit, search, git, analyze, custom')
      .argument('<description>', 'Task description')
      .option('-i, --input <json>', 'Task input as JSON string')
      .option('-p, --priority <num>', 'Task priority', '1')
      .action(async (type: string, description: string, options) => {
        await this.runTask(type, description, options, context);
      });

    program
      .command('agent:parallel')
      .description('Run multiple agent tasks in parallel')
      .argument('<tasks-file>', 'JSON file containing task definitions')
      .option('--max-concurrent <num>', 'Maximum concurrent tasks')
      .action(async (tasksFile: string, options) => {
        await this.runParallel(tasksFile, options, context);
      });

    program
      .command('agent:status')
      .description('Show agent orchestrator status')
      .action(async () => {
        await this.showStatus(context);
      });

    program
      .command('agent:create')
      .description('Create a new agent')
      .argument('<name>', 'Agent name')
      .option('-c, --capabilities <list>', 'Comma-separated capabilities')
      .action(async (name: string, options) => {
        await this.createAgent(name, options, context);
      });
  }

  private async runTask(
    type: string,
    description: string,
    options: any,
    context: CommandContext
  ): Promise<void> {
    const { logger, agentOrchestrator } = context;

    try {
      const task: AgentTask = {
        id: `task-${Date.now()}`,
        type: type as any,
        description,
        input: options.input ? JSON.parse(options.input) : {},
        priority: parseInt(options.priority || '1'),
        retryOnFailure: true,
      };

      logger.startSpinner(`Executing task: ${description}`);

      const result = await agentOrchestrator.executeTask(task);

      logger.stopSpinner(result.status === 'success', 'Task completed');

      if (result.status === 'success') {
        logger.success('Task completed successfully');
        logger.info('Output:');
        logger.json(result.output);
      } else {
        logger.error(`Task failed: ${result.error}`);
      }

      if (result.metrics) {
        logger.info(`\nMetrics:`);
        logger.info(`  Duration: ${result.metrics.duration}ms`);
        if (result.metrics.tokensUsed) {
          logger.info(`  Tokens: ${result.metrics.tokensUsed}`);
        }
      }
    } catch (error) {
      logger.stopSpinner(false, 'Task execution failed');
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async runParallel(
    tasksFile: string,
    options: any,
    context: CommandContext
  ): Promise<void> {
    const { logger, agentOrchestrator } = context;
    const { FileOperations } = await import('../utils/file-ops');

    try {
      logger.startSpinner('Loading tasks...');

      const fileContent = await FileOperations.readFile(tasksFile);
      const tasks: AgentTask[] = JSON.parse(fileContent);

      logger.stopSpinner(true, `Loaded ${tasks.length} tasks`);
      logger.info('Executing tasks in parallel...');

      const results = await agentOrchestrator.executeParallel(tasks);

      const successful = results.filter((r) => r.status === 'success').length;
      const failed = results.filter((r) => r.status === 'failure').length;

      logger.newLine();
      logger.success(`✓ Results: ${successful} successful, ${failed} failed`);

      results.forEach((result, index) => {
        const status = result.status === 'success' ? '✓' : '✗';
        logger.info(`${status} Task ${index + 1}: ${tasks[index].description}`);
        if (result.error) {
          logger.error(`  Error: ${result.error}`);
        }
      });
    } catch (error) {
      logger.stopSpinner(false, 'Parallel execution failed');
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async showStatus(context: CommandContext): Promise<void> {
    const { logger, agentOrchestrator } = context;

    try {
      const agents = agentOrchestrator.getStatus();

      logger.info(`\nAgent Orchestrator Status\n`);
      logger.info(`Total Agents: ${agents.size}\n`);

      const agentList = Array.from(agents.values()).map((agent: any) => ({
        ID: agent.id,
        Name: agent.name,
        Status: agent.status,
        'Current Task': agent.currentTask?.description || 'None',
        Capabilities: agent.capabilities.join(', '),
      }));

      logger.table(agentList);
    } catch (error) {
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async createAgent(name: string, options: any, context: CommandContext): Promise<void> {
    const { logger, agentOrchestrator } = context;

    try {
      const capabilities = options.capabilities
        ? options.capabilities.split(',').map((c: string) => c.trim())
        : ['general'];

      const agent = agentOrchestrator.createAgent(name, capabilities);

      logger.success(`✓ Created agent: ${agent.name}`);
      logger.info(`  ID: ${agent.id}`);
      logger.info(`  Capabilities: ${agent.capabilities.join(', ')}`);
    } catch (error) {
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }
}

