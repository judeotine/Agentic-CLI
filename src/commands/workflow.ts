import { Command } from 'commander';
import { CommandContext } from '../types/command';
import { WorkflowEngine } from '../core/workflow-engine';

export class WorkflowCommand {
  register(program: Command, context: CommandContext): void {
    const workflow = program.command('workflow').description('Workflow automation and orchestration');

    workflow
      .command('create')
      .description('Create a new workflow')
      .argument('<name>', 'Workflow name')
      .argument('<description>', 'Workflow description')
      .action(async (name: string, description: string) => {
        await this.create(name, description, context);
      });

    workflow
      .command('run')
      .description('Execute a workflow')
      .argument('<name>', 'Workflow name')
      .option('-c, --context <json>', 'Context as JSON string')
      .action(async (name: string, options) => {
        await this.run(name, options, context);
      });

    workflow
      .command('list')
      .description('List all workflows')
      .action(async () => {
        await this.list(context);
      });

    workflow
      .command('status')
      .description('Check workflow execution status')
      .argument('<execution-id>', 'Execution ID')
      .action(async (executionId: string) => {
        await this.status(executionId, context);
      });
  }

  private async create(name: string, description: string, context: CommandContext): Promise<void> {
    const { logger } = context;

    try {
      const engine = new WorkflowEngine();
      await engine.createWorkflow(name, description);

      logger.success(`✓ Created workflow: ${name}`);
      logger.info(`  Edit the workflow file at: workflows/${name}.json`);
    } catch (error) {
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async run(name: string, options: any, context: CommandContext): Promise<void> {
    const { logger } = context;

    try {
      logger.startSpinner(`Executing workflow: ${name}...`);

      const engine = new WorkflowEngine();
      await engine.loadWorkflow(`workflows/${name}.json`);

      const workflowContext = options.context ? JSON.parse(options.context) : {};
      const execution = await engine.executeWorkflow(name, workflowContext);

      logger.stopSpinner(true, 'Workflow completed');

      logger.info(`\n✅ Workflow: ${name}\n`);
      logger.info(`  Status: ${execution.status}`);
      logger.info(`  Duration: ${execution.endTime && execution.startTime
        ? execution.endTime.getTime() - execution.startTime.getTime()
        : 0}ms`);
      logger.info(`  Steps: ${execution.steps.size}`);

      logger.info(`\nSteps:\n`);
      for (const [stepId, step] of execution.steps.entries()) {
        const icon = step.status === 'completed' ? '✓' : step.status === 'failed' ? '✗' : '○';
        logger.info(`  ${icon} ${stepId}: ${step.status}`);
      }
    } catch (error) {
      logger.stopSpinner(false, 'Workflow failed');
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async list(context: CommandContext): Promise<void> {
    const { logger } = context;

    try {
      const engine = new WorkflowEngine();
      const workflows = engine.listWorkflows();

      if (workflows.length === 0) {
        logger.info('No workflows found');
        return;
      }

      logger.info(`\n📋 Workflows (${workflows.length}):\n`);

      for (const name of workflows) {
        logger.info(`  • ${name}`);
      }
    } catch (error) {
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async status(executionId: string, context: CommandContext): Promise<void> {
    const { logger } = context;

    try {
      const engine = new WorkflowEngine();
      const execution = engine.getExecution(executionId);

      if (!execution) {
        logger.warn(`Execution '${executionId}' not found`);
        return;
      }

      logger.info(`\n📊 Execution Status: ${executionId}\n`);
      logger.info(`  Workflow: ${execution.workflowId}`);
      logger.info(`  Status: ${execution.status}`);
      logger.info(`  Started: ${execution.startTime}`);
      if (execution.endTime) {
        logger.info(`  Ended: ${execution.endTime}`);
        logger.info(`  Duration: ${execution.endTime.getTime() - execution.startTime.getTime()}ms`);
      }

      logger.info(`\n  Steps (${execution.steps.size}):\n`);
      const stepData = Array.from(execution.steps.values()).map((s) => ({
        Step: s.stepId,
        Status: s.status,
        Duration: s.startTime && s.endTime
          ? `${s.endTime.getTime() - s.startTime.getTime()}ms`
          : '-',
      }));

      logger.table(stepData);
    } catch (error) {
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }
}

