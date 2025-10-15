export interface AgentTask {
  id: string;
  type: 'code-edit' | 'search' | 'git' | 'analyze' | 'custom';
  description: string;
  input: any;
  priority: number;
  dependencies?: string[];
  timeout?: number;
  retryOnFailure?: boolean;
}

export interface AgentResult {
  taskId: string;
  status: 'success' | 'failure' | 'partial';
  output: any;
  error?: string;
  metrics?: {
    duration: number;
    tokensUsed?: number;
    filesModified?: number;
  };
}

export interface Agent {
  id: string;
  name: string;
  status: 'idle' | 'busy' | 'error';
  currentTask?: AgentTask;
  capabilities: string[];
}

export interface AgentConfig {
  maxConcurrent: number;
  timeout: number;
  retryAttempts: number;
  autoScale?: boolean;
}

export interface TaskQueue {
  add: (task: AgentTask) => void;
  remove: (taskId: string) => boolean;
  peek: () => AgentTask | undefined;
  size: () => number;
}

export interface AgentOrchestrator {
  createAgent: (name: string, capabilities: string[]) => Agent;
  assignTask: (agentId: string, task: AgentTask) => Promise<void>;
  executeTask: (task: AgentTask) => Promise<AgentResult>;
  executeParallel: (tasks: AgentTask[]) => Promise<AgentResult[]>;
  getStatus: () => Map<string, Agent>;
}

