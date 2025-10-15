import { Command } from 'commander';
import { CommandContext } from '../types/command';
import { SessionManager } from '../core/session-manager';

export class SessionCommand {
  register(program: Command, context: CommandContext): void {
    const session = program.command('session').description('Session and context management');

    session
      .command('create')
      .description('Create a new session')
      .argument('<name>', 'Session name')
      .action(async (name: string) => {
        await this.create(name, context);
      });

    session
      .command('load')
      .description('Load an existing session')
      .argument('<session-id>', 'Session ID')
      .action(async (sessionId: string) => {
        await this.load(sessionId, context);
      });

    session
      .command('list')
      .description('List all sessions')
      .action(async () => {
        await this.list(context);
      });

    session
      .command('export')
      .description('Export session to file')
      .argument('<session-id>', 'Session ID')
      .option('-f, --format <format>', 'Export format: json, markdown', 'json')
      .option('-o, --output <file>', 'Output file')
      .action(async (sessionId: string, options) => {
        await this.export(sessionId, options, context);
      });

    session
      .command('audit')
      .description('View audit log')
      .option('--session <id>', 'Filter by session ID')
      .option('--since <date>', 'Since date (ISO format)')
      .action(async (options) => {
        await this.audit(options, context);
      });

    session
      .command('compact')
      .description('Compact current session context')
      .option('--max <messages>', 'Maximum messages to keep', '50')
      .action(async (options) => {
        await this.compact(options, context);
      });
  }

  private async create(name: string, context: CommandContext): Promise<void> {
    const { logger, config } = context;

    try {
      const sessionManager = new SessionManager(config.workspace.root);
      await sessionManager.initialize();

      const session = await sessionManager.createSession(name, config.workspace.root);

      logger.success(`✓ Created session: ${session.name}`);
      logger.info(`  ID: ${session.id}`);
      logger.info(`  Path: ${session.metadata.projectPath}`);
    } catch (error) {
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async load(sessionId: string, context: CommandContext): Promise<void> {
    const { logger, config } = context;

    try {
      const sessionManager = new SessionManager(config.workspace.root);
      await sessionManager.initialize();

      const session = await sessionManager.loadSession(sessionId);

      logger.success(`✓ Loaded session: ${session.name}`);
      logger.info(`  Messages: ${session.context.messages.length}`);
      logger.info(`  Files: ${session.context.files.length}`);
      logger.info(`  Last updated: ${session.updated}`);
    } catch (error) {
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async list(context: CommandContext): Promise<void> {
    const { logger, config } = context;

    try {
      const sessionManager = new SessionManager(config.workspace.root);
      await sessionManager.initialize();

      const sessions = await sessionManager.listSessions();

      if (sessions.length === 0) {
        logger.info('No sessions found');
        return;
      }

      logger.info(`\nSessions (${sessions.length}):\n`);

      const sessionData = sessions.map((s) => ({
        ID: s.id,
        Name: s.name,
        Created: new Date(s.created).toLocaleDateString(),
        Updated: new Date(s.updated).toLocaleDateString(),
        Messages: s.context.messages.length,
        Files: s.context.files.length,
      }));

      logger.table(sessionData);
    } catch (error) {
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async export(sessionId: string, options: any, context: CommandContext): Promise<void> {
    const { logger, config } = context;

    try {
      const sessionManager = new SessionManager(config.workspace.root);
      await sessionManager.initialize();

      const exported = await sessionManager.exportSession(sessionId, options.format);

      if (options.output) {
        const { FileOperations } = await import('../utils/file-ops');
        await FileOperations.writeFile(options.output, exported);
        logger.success(`✓ Exported to ${options.output}`);
      } else {
        console.log(exported);
      }
    } catch (error) {
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async audit(options: any, context: CommandContext): Promise<void> {
    const { logger, config } = context;

    try {
      const sessionManager = new SessionManager(config.workspace.root);
      await sessionManager.initialize();

      const startDate = options.since ? new Date(options.since) : undefined;
      const entries = await sessionManager.getAuditLog(options.session, startDate);

      logger.info(`\nAudit Log (${entries.length} entries):\n`);

      const auditData = entries.slice(0, 50).map((e) => ({
        Timestamp: new Date(e.timestamp).toISOString(),
        Session: e.sessionId.substring(0, 12) + '...',
        Action: e.action,
        Actor: e.actor,
        Files: e.filesAffected?.length || 0,
      }));

      logger.table(auditData);

      if (entries.length > 50) {
        logger.info(`\n... and ${entries.length - 50} more entries`);
      }
    } catch (error) {
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async compact(options: any, context: CommandContext): Promise<void> {
    const { logger, config } = context;

    try {
      const sessionManager = new SessionManager(config.workspace.root);
      await sessionManager.initialize();

      await sessionManager.compactContext(parseInt(options.max));

      logger.success(`✓ Context compacted to ${options.max} messages`);
    } catch (error) {
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }
}

