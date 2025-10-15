import { AgentTask } from '../types/agent';
import { FileOperations } from '../utils/file-ops';

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'command' | 'agent' | 'hook' | 'condition' | 'parallel';
  config: any;
  dependsOn?: string[];
  condition?: string;
  onSuccess?: string[];
  onFailure?: string[];
}

export interface Workflow {
  name: string;
  description: string;
  trigger: 'manual' | 'git-commit' | 'file-change' | 'schedule' | 'hook';
  triggerConfig?: any;
  steps: WorkflowStep[];
  permissions: {
    requireApproval: boolean;
    allowedUsers?: string[];
  };
  notifications: {
    onComplete?: string[];
    onFailure?: string[];
  };
}

export interface WorkflowExecution {
  workflowId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'paused';
  steps: Map<string, StepExecution>;
}

export interface StepExecution {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  output?: any;
  error?: string;
}

export class WorkflowEngine {
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private hooks: Map<string, Array<(data: any) => Promise<void>>> = new Map();

  async loadWorkflow(workflowPath: string): Promise<Workflow> {
    const content = await FileOperations.readFile(workflowPath);
    const workflow: Workflow = JSON.parse(content);
    this.workflows.set(workflow.name, workflow);
    return workflow;
  }

  async executeWorkflow(
    workflowName: string,
    context: any = {}
  ): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowName);
    if (!workflow) {
      throw new Error(`Workflow ${workflowName} not found`);
    }

    // Check permissions
    if (workflow.permissions.requireApproval) {
      const approved = await this.requestApproval(workflow);
      if (!approved) {
        throw new Error('Workflow execution not approved');
      }
    }

    const execution: WorkflowExecution = {
      workflowId: workflow.name,
      startTime: new Date(),
      status: 'running',
      steps: new Map(),
    };

    this.executions.set(`${workflow.name}-${Date.now()}`, execution);

    try {
      await this.executeSteps(workflow.steps, execution, context);
      execution.status = 'completed';
      execution.endTime = new Date();

      // Send notifications
      await this.sendNotifications(workflow.notifications.onComplete || [], execution);
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      await this.sendNotifications(workflow.notifications.onFailure || [], execution);
      throw error;
    }

    return execution;
  }

  private async executeSteps(
    steps: WorkflowStep[],
    execution: WorkflowExecution,
    context: any
  ): Promise<void> {
    for (const step of steps) {
      // Check dependencies
      if (step.dependsOn) {
        const depsCompleted = step.dependsOn.every((depId) => {
          const depExec = execution.steps.get(depId);
          return depExec && depExec.status === 'completed';
        });

        if (!depsCompleted) {
          continue;
        }
      }

      // Check condition
      if (step.condition) {
        const conditionMet = await this.evaluateCondition(step.condition, context);
        if (!conditionMet) {
          execution.steps.set(step.id, {
            stepId: step.id,
            status: 'skipped',
          });
          continue;
        }
      }

      // Execute step
      const stepExec: StepExecution = {
        stepId: step.id,
        status: 'running',
        startTime: new Date(),
      };
      execution.steps.set(step.id, stepExec);

      try {
        if (step.type === 'parallel') {
          await this.executeParallelSteps(step.config.steps, execution, context);
        } else {
          const result = await this.executeStep(step, context);
          stepExec.output = result;
          stepExec.status = 'completed';
          stepExec.endTime = new Date();

          // Execute success handlers
          if (step.onSuccess) {
            const successSteps = steps.filter((s) => step.onSuccess!.includes(s.id));
            await this.executeSteps(successSteps, execution, context);
          }
        }
      } catch (error) {
        stepExec.status = 'failed';
        stepExec.error = (error as Error).message;
        stepExec.endTime = new Date();

        // Execute failure handlers
        if (step.onFailure) {
          const failureSteps = steps.filter((s) => step.onFailure!.includes(s.id));
          await this.executeSteps(failureSteps, execution, context);
        } else {
          throw error;
        }
      }
    }
  }

  private async executeParallelSteps(
    steps: WorkflowStep[],
    execution: WorkflowExecution,
    context: any
  ): Promise<void> {
    await Promise.all(
      steps.map((step) => this.executeStep(step, context))
    );
  }

  private async executeStep(step: WorkflowStep, context: any): Promise<any> {
    switch (step.type) {
      case 'command':
        return this.executeCommand(step.config);

      case 'agent':
        return this.executeAgentTask(step.config);

      case 'hook':
        return this.executeHook(step.config.name, step.config.data);

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  private async executeCommand(config: any): Promise<any> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const { stdout } = await execAsync(config.command);
    return stdout;
  }

  private async executeAgentTask(config: any): Promise<any> {
    // This would integrate with AgentOrchestrator
    // For now, returning placeholder
    return { status: 'completed', config };
  }

  private async executeHook(name: string, data: any): Promise<void> {
    const handlers = this.hooks.get(name) || [];
    for (const handler of handlers) {
      await handler(data);
    }
  }

  private async evaluateCondition(condition: string, context: any): Promise<boolean> {
    // Simple condition evaluator
    // In production, use a safe expression evaluator
    try {
      const func = new Function('context', `return ${condition}`);
      return func(context);
    } catch {
      return false;
    }
  }

  private async requestApproval(workflow: Workflow): Promise<boolean> {
    // In a real implementation, this would prompt the user or check permissions
    // For now, auto-approve
    console.log(`Approval required for workflow: ${workflow.name}`);
    return true;
  }

  private async sendNotifications(recipients: string[], execution: WorkflowExecution): Promise<void> {
    // Placeholder for notification system
    console.log(`Sending notifications to: ${recipients.join(', ')}`);
  }

  registerHook(name: string, handler: (data: any) => Promise<void>): void {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, []);
    }
    this.hooks.get(name)!.push(handler);
  }

  async createWorkflow(name: string, description: string): Promise<void> {
    const template: Workflow = {
      name,
      description,
      trigger: 'manual',
      steps: [
        {
          id: 'step1',
          name: 'Example Step',
          type: 'command',
          config: {
            command: 'echo "Hello"',
          },
        },
      ],
      permissions: {
        requireApproval: false,
      },
      notifications: {},
    };

    const workflowPath = `workflows/${name}.json`;
    await FileOperations.writeFile(workflowPath, JSON.stringify(template, null, 2));
  }

  listWorkflows(): string[] {
    return Array.from(this.workflows.keys());
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }
}

