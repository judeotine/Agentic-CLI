import * as fs from 'fs/promises';
import * as path from 'path';

export interface Session {
  id: string;
  name: string;
  created: Date;
  updated: Date;
  context: {
    messages: Array<{ role: string; content: string; timestamp: Date }>;
    files: string[];
    variables: Record<string, any>;
  };
  metadata: {
    projectPath: string;
    gitBranch?: string;
    tags: string[];
  };
}

export interface AuditLogEntry {
  timestamp: Date;
  sessionId: string;
  action: string;
  actor: 'user' | 'agent' | 'system';
  details: any;
  filesAffected?: string[];
}

export class SessionManager {
  private sessionDir: string;
  private currentSession: Session | null = null;
  private auditLog: AuditLogEntry[] = [];

  constructor(baseDir: string) {
    this.sessionDir = path.join(baseDir, '.sessions');
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.sessionDir, { recursive: true });
    await fs.mkdir(path.join(this.sessionDir, 'audit'), { recursive: true });
  }

  async createSession(name: string, projectPath: string): Promise<Session> {
    const session: Session = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      created: new Date(),
      updated: new Date(),
      context: {
        messages: [],
        files: [],
        variables: {},
      },
      metadata: {
        projectPath,
        tags: [],
      },
    };

    await this.saveSession(session);
    this.currentSession = session;

    await this.logAudit({
      timestamp: new Date(),
      sessionId: session.id,
      action: 'session_created',
      actor: 'user',
      details: { name, projectPath },
    });

    return session;
  }

  async loadSession(sessionId: string): Promise<Session> {
    const sessionPath = path.join(this.sessionDir, `${sessionId}.json`);
    const content = await fs.readFile(sessionPath, 'utf-8');
    const session = JSON.parse(content);

    // Restore Date objects
    session.created = new Date(session.created);
    session.updated = new Date(session.updated);
    session.context.messages.forEach((m: any) => {
      m.timestamp = new Date(m.timestamp);
    });

    this.currentSession = session;

    await this.logAudit({
      timestamp: new Date(),
      sessionId,
      action: 'session_loaded',
      actor: 'user',
      details: {},
    });

    return session;
  }

  async saveSession(session: Session): Promise<void> {
    session.updated = new Date();
    const sessionPath = path.join(this.sessionDir, `${session.id}.json`);
    await fs.writeFile(sessionPath, JSON.stringify(session, null, 2));
  }

  async listSessions(): Promise<Session[]> {
    const files = await fs.readdir(this.sessionDir);
    const sessionFiles = files.filter((f) => f.endsWith('.json') && f.startsWith('session-'));

    const sessions = await Promise.all(
      sessionFiles.map(async (file) => {
        const content = await fs.readFile(path.join(this.sessionDir, file), 'utf-8');
        return JSON.parse(content);
      })
    );

    return sessions.sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());
  }

  async addMessage(role: string, content: string): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    this.currentSession.context.messages.push({
      role,
      content,
      timestamp: new Date(),
    });

    await this.saveSession(this.currentSession);

    await this.logAudit({
      timestamp: new Date(),
      sessionId: this.currentSession.id,
      action: 'message_added',
      actor: role as any,
      details: { contentLength: content.length },
    });
  }

  async addFiles(files: string[]): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const newFiles = files.filter((f) => !this.currentSession!.context.files.includes(f));
    this.currentSession.context.files.push(...newFiles);

    await this.saveSession(this.currentSession);

    await this.logAudit({
      timestamp: new Date(),
      sessionId: this.currentSession.id,
      action: 'files_added',
      actor: 'user',
      details: { files: newFiles },
      filesAffected: newFiles,
    });
  }

  async setVariable(key: string, value: any): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    this.currentSession.context.variables[key] = value;
    await this.saveSession(this.currentSession);
  }

  getVariable(key: string): any {
    return this.currentSession?.context.variables[key];
  }

  async compactContext(maxMessages: number = 50): Promise<void> {
    if (!this.currentSession) return;

    const messages = this.currentSession.context.messages;
    if (messages.length > maxMessages) {
      const removed = messages.length - maxMessages;
      this.currentSession.context.messages = messages.slice(-maxMessages);
      await this.saveSession(this.currentSession);

      await this.logAudit({
        timestamp: new Date(),
        sessionId: this.currentSession.id,
        action: 'context_compacted',
        actor: 'system',
        details: { messagesRemoved: removed },
      });
    }
  }

  async exportSession(sessionId: string, format: 'json' | 'markdown'): Promise<string> {
    const session = await this.loadSession(sessionId);

    if (format === 'json') {
      return JSON.stringify(session, null, 2);
    }

    // Markdown format
    let md = `# Session: ${session.name}\n\n`;
    md += `**Created**: ${session.created.toISOString()}\n`;
    md += `**Updated**: ${session.updated.toISOString()}\n`;
    md += `**Project**: ${session.metadata.projectPath}\n\n`;
    md += `## Messages\n\n`;

    for (const msg of session.context.messages) {
      md += `### ${msg.role} (${msg.timestamp.toISOString()})\n\n`;
      md += `${msg.content}\n\n`;
    }

    md += `## Files\n\n`;
    for (const file of session.context.files) {
      md += `- ${file}\n`;
    }

    return md;
  }

  private async logAudit(entry: AuditLogEntry): Promise<void> {
    this.auditLog.push(entry);

    const auditPath = path.join(
      this.sessionDir,
      'audit',
      `audit-${new Date().toISOString().split('T')[0]}.jsonl`
    );

    await fs.appendFile(auditPath, JSON.stringify(entry) + '\n');
  }

  async getAuditLog(
    sessionId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AuditLogEntry[]> {
    const files = await fs.readdir(path.join(this.sessionDir, 'audit'));

    let entries: AuditLogEntry[] = [];
    for (const file of files) {
      const content = await fs.readFile(path.join(this.sessionDir, 'audit', file), 'utf-8');
      const lines = content.split('\n').filter(Boolean);
      entries.push(...lines.map((l) => JSON.parse(l)));
    }

    // Filter by criteria
    if (sessionId) {
      entries = entries.filter((e) => e.sessionId === sessionId);
    }
    if (startDate) {
      entries = entries.filter((e) => new Date(e.timestamp) >= startDate);
    }
    if (endDate) {
      entries = entries.filter((e) => new Date(e.timestamp) <= endDate);
    }

    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const sessionPath = path.join(this.sessionDir, `${sessionId}.json`);
    await fs.unlink(sessionPath);

    await this.logAudit({
      timestamp: new Date(),
      sessionId,
      action: 'session_deleted',
      actor: 'user',
      details: {},
    });
  }
}

