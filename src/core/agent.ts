import PQueue from 'p-queue';
import {
  Agent,
  AgentTask,
  AgentResult,
  AgentConfig,
  AgentOrchestrator as IAgentOrchestrator,
} from '../types/agent';
import { AIProvider } from './ai-provider';

export class AgentOrchestrator implements IAgentOrchestrator {
  private agents: Map<string, Agent> = new Map();
  private taskQueue: PQueue;
  private config: AgentConfig;
  private aiProvider: AIProvider;
  private taskResults: Map<string, AgentResult> = new Map();

  constructor(config: AgentConfig, aiProvider: AIProvider) {
    this.config = config;
    this.aiProvider = aiProvider;
    this.taskQueue = new PQueue({ concurrency: config.maxConcurrent });
  }

  createAgent(name: string, capabilities: string[]): Agent {
    const agent: Agent = {
      id: `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      status: 'idle',
      capabilities,
    };
    this.agents.set(agent.id, agent);
    return agent;
  }

  async assignTask(agentId: string, task: AgentTask): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    agent.currentTask = task;
    agent.status = 'busy';

    try {
      const result = await this.executeTask(task);
      this.taskResults.set(task.id, result);
    } finally {
      agent.currentTask = undefined;
      agent.status = 'idle';
    }
  }

  async executeTask(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      if (task.dependencies) {
        await this.waitForDependencies(task.dependencies);
      }

      const result = await this.processTask(task);
      const duration = Date.now() - startTime;

      return {
        taskId: task.id,
        status: 'success',
        output: result,
        metrics: {
          duration,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      if (task.retryOnFailure && this.config.retryAttempts > 0) {
        return this.retryTask(task, error as Error);
      }

      return {
        taskId: task.id,
        status: 'failure',
        output: null,
        error: (error as Error).message,
        metrics: {
          duration,
        },
      };
    }
  }

  async executeParallel(tasks: AgentTask[]): Promise<AgentResult[]> {
    const promises = tasks.map((task) =>
      this.taskQueue.add(() => this.executeTask(task))
    );
    const results = await Promise.all(promises);
    return results.filter((result): result is AgentResult => result !== undefined);
  }

  private async processTask(task: AgentTask): Promise<any> {
    const systemPrompt = this.getSystemPrompt(task.type);
    const userPrompt = this.getUserPrompt(task);

    const response = await this.aiProvider.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    return this.parseTaskResult(task.type, response.content);
  }

  private getSystemPrompt(taskType: string): string {
    const prompts: Record<string, string> = {
      'code-edit': `You are a code editing agent. Analyze the request and provide precise file edits in JSON format.`,
      search: `You are a code search agent. Find relevant code patterns and return structured results.`,
      git: `You are a git operations agent. Execute git commands and manage repository operations.`,
      analyze: `You are a code analysis agent. Review code quality, patterns, and provide insights.`,
      custom: `You are a general-purpose agent. Follow the task instructions carefully.`,
    };
    return prompts[taskType] || prompts.custom;
  }

  private getUserPrompt(task: AgentTask): string {
    return `Task: ${task.description}\n\nInput:\n${JSON.stringify(task.input, null, 2)}`;
  }

  private parseTaskResult(taskType: string, content: string): any {
    try {
      return JSON.parse(content);
    } catch {
      return { raw: content };
    }
  }

  private async retryTask(task: AgentTask, error: Error): Promise<AgentResult> {
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        const result = await this.processTask(task);
        return {
          taskId: task.id,
          status: 'success',
          output: result,
          metrics: { duration: 0 },
        };
      } catch (retryError) {
        if (attempt === this.config.retryAttempts) {
          return {
            taskId: task.id,
            status: 'failure',
            output: null,
            error: (retryError as Error).message,
            metrics: { duration: 0 },
          };
        }
      }
    }

    return {
      taskId: task.id,
      status: 'failure',
      output: null,
      error: error.message,
      metrics: { duration: 0 },
    };
  }

  private async waitForDependencies(dependencies: string[]): Promise<void> {
    const checkInterval = 100;
    const maxWaitTime = this.config.timeout;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const allComplete = dependencies.every((depId) => {
        const result = this.taskResults.get(depId);
        return result && result.status === 'success';
      });

      if (allComplete) {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }

    throw new Error('Dependency timeout: Some dependencies did not complete in time');
  }

  getStatus(): Map<string, Agent> {
    return new Map(this.agents);
  }

  getTaskResult(taskId: string): AgentResult | undefined {
    return this.taskResults.get(taskId);
  }

  async shutdown(): Promise<void> {
    await this.taskQueue.onIdle();
    this.agents.clear();
    this.taskResults.clear();
  }
}

