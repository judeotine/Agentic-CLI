import { Command as CommanderCommand } from 'commander';

export interface CommandContext {
  config: any;
  logger: any;
  aiProvider: any;
  agentOrchestrator: any;
  pluginManager: any;
  gitService: any;
}

export interface CommandOptions {
  interactive?: boolean;
  quiet?: boolean;
  verbose?: boolean;
  model?: string;
  parallel?: boolean;
  dryRun?: boolean;
}

export interface CommandHandler {
  name: string;
  description: string;
  aliases?: string[];
  options?: Array<{
    flags: string;
    description: string;
    defaultValue?: any;
  }>;
  arguments?: Array<{
    name: string;
    description: string;
    required?: boolean;
  }>;
  execute: (args: any, options: CommandOptions, context: CommandContext) => Promise<void>;
}

export interface CLICommand {
  register: (program: CommanderCommand) => void;
  validate?: (args: any) => boolean;
}

export interface SearchResult {
  file: string;
  line: number;
  column: number;
  match: string;
  context: string;
}

export interface EditOperation {
  file: string;
  operation: 'create' | 'update' | 'delete';
  content?: string;
  startLine?: number;
  endLine?: number;
  reasoning?: string;
}

export interface GitOperation {
  type: 'commit' | 'push' | 'pr' | 'branch' | 'merge';
  message?: string;
  branch?: string;
  files?: string[];
}

