import simpleGit, { SimpleGit, StatusResult } from 'simple-git';
import { GitOperation } from '../types/command';

export class GitService {
  private git: SimpleGit;
  private workingDir: string;

  constructor(workingDir: string = process.cwd()) {
    this.workingDir = workingDir;
    try {
      this.git = simpleGit(workingDir);
    } catch (error) {
      // If simple-git fails, create a mock git instance
      this.git = simpleGit();
    }
  }

  async isRepository(): Promise<boolean> {
    try {
      await this.git.status();
      return true;
    } catch {
      return false;
    }
  }

  async getStatus(): Promise<StatusResult> {
    return this.git.status();
  }

  async getCurrentBranch(): Promise<string> {
    const status = await this.git.status();
    return status.current || 'unknown';
  }

  async commit(message: string, files?: string[]): Promise<string> {
    if (files && files.length > 0) {
      await this.git.add(files);
    } else {
      await this.git.add('.');
    }

    const result = await this.git.commit(message);
    return result.commit;
  }

  async createBranch(branchName: string, checkout: boolean = true): Promise<void> {
    if (checkout) {
      await this.git.checkoutLocalBranch(branchName);
    } else {
      await this.git.branch([branchName]);
    }
  }

  async push(remote: string = 'origin', branch?: string): Promise<void> {
    if (branch) {
      await this.git.push(remote, branch);
    } else {
      await this.git.push();
    }
  }

  async getDiff(staged: boolean = false): Promise<string> {
    if (staged) {
      return this.git.diff(['--cached']);
    }
    return this.git.diff();
  }

  async getModifiedFiles(): Promise<string[]> {
    const status = await this.git.status();
    return [
      ...status.modified,
      ...status.created,
      ...status.deleted,
      ...status.renamed.map((r) => r.to),
    ];
  }

  async stageFiles(files: string[]): Promise<void> {
    await this.git.add(files);
  }

  async unstageFiles(files: string[]): Promise<void> {
    await this.git.reset(['--', ...files]);
  }

  async getCommitHistory(count: number = 10): Promise<any[]> {
    const log = await this.git.log({ maxCount: count });
    return log.all as any[];
  }

  async executeOperation(operation: GitOperation): Promise<any> {
    switch (operation.type) {
      case 'commit':
        return this.commit(operation.message!, operation.files);

      case 'push':
        return this.push('origin', operation.branch);

      case 'branch':
        return this.createBranch(operation.branch!, true);

      case 'pr':
        throw new Error('PR creation requires GitHub/GitLab integration');

      case 'merge':
        return this.git.merge([operation.branch!]);

      default:
        throw new Error(`Unknown git operation: ${operation.type}`);
    }
  }

  async autoCommitChanges(template?: string): Promise<string> {
    const status = await this.git.status();
    const modifiedFiles = status.files.length;

    if (modifiedFiles === 0) {
      throw new Error('No changes to commit');
    }

    const message =
      template ||
      `Auto-commit: Updated ${modifiedFiles} file${modifiedFiles > 1 ? 's' : ''}`;

    return this.commit(message);
  }

  async hasUncommittedChanges(): Promise<boolean> {
    const status = await this.git.status();
    return status.files.length > 0;
  }

  getWorkingDirectory(): string {
    return this.workingDir;
  }
}

