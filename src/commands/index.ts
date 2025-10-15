import { Command } from 'commander';
import { CommandContext } from '../types/command';
import { CodeEditCommand } from './code-edit';
import { RepoSearchCommand } from './repo-search';
import { AgentManagerCommand } from './agent-manager';
import { GitCommand } from './git';
import { PluginCommand } from './plugin';
import { SecurityCommand } from './security';
import { TestCommand } from './test';
import { SessionCommand } from './session';
import { WebCommand } from './web';
import { IndexCommand } from './index-cmd';
import { WorkflowCommand } from './workflow';
import { DemoCommand } from './demo-class';

export function registerCommands(program: Command, context: CommandContext): void {
  const commands = [
    new CodeEditCommand(),
    new RepoSearchCommand(),
    new AgentManagerCommand(),
    new GitCommand(),
    new PluginCommand(),
    new SecurityCommand(),
    new TestCommand(),
    new SessionCommand(),
    new WebCommand(),
    new IndexCommand(),
    new WorkflowCommand(),
    new DemoCommand(),
  ];

  commands.forEach((command) => command.register(program, context));
}

export {
  CodeEditCommand,
  RepoSearchCommand,
  AgentManagerCommand,
  GitCommand,
  PluginCommand,
  SecurityCommand,
  TestCommand,
  SessionCommand,
  WebCommand,
  IndexCommand,
  WorkflowCommand,
  DemoCommand,
};
