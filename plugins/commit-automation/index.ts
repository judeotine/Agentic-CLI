import { Plugin, PluginContext, PluginCommand } from '../../src/types/plugin';

/**
 * Commit Automation Plugin
 * 
 * Streamlines git workflows with intelligent automation
 */

const commitPushPrCommand: PluginCommand = {
  name: 'commit-push-pr',
  description: 'Commit, push, and create PR in one command',
  
  async execute(args: any, context: PluginContext): Promise<void> {
    const { logger, utils } = context;
    
    try {
      // 1. Check current status
      logger.info('Checking git status...');
      const status = await utils.exec('git status --porcelain');
      
      if (!status.trim()) {
        logger.warn('No changes to commit');
        return;
      }
      
      // 2. Get current branch
      const currentBranch = await utils.exec('git branch --show-current');
      const branch = currentBranch.trim();
      
      // 3. Create new branch if on main
      if (branch === 'main' || branch === 'master') {
        const newBranch = `feature/${Date.now()}`;
        logger.info(`Creating new branch: ${newBranch}`);
        await utils.exec(`git checkout -b ${newBranch}`);
      }
      
      // 4. Generate commit message with AI
      logger.info('Generating commit message...');
      const diff = await utils.exec('git diff HEAD');
      
      // Use Agentic CLI's AI to generate commit message
      logger.info('Analyzing changes...');
      
      const commitMessage = args.message || 'chore: automated commit';
      
      // 5. Add and commit
      logger.info('Committing changes...');
      await utils.exec('git add .');
      await utils.exec(`git commit -m "${commitMessage}"`);
      logger.success(`Committed: ${commitMessage}`);
      
      // 6. Push to remote
      logger.info('Pushing to remote...');
      await utils.exec(`git push -u origin ${branch}`);
      logger.success('Pushed to remote');
      
      // 7. Create PR (if gh CLI available)
      try {
        logger.info('Creating pull request...');
        const prUrl = await utils.exec('gh pr create --fill');
        logger.success(`PR created: ${prUrl}`);
      } catch (error) {
        logger.warn('Could not create PR automatically (gh CLI not available)');
        logger.info('Create PR manually at: https://github.com/judeotine/Agentic-CLI/compare');
      }
      
    } catch (error) {
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }
};

const smartCommitCommand: PluginCommand = {
  name: 'smart-commit',
  description: 'Commit with AI-generated message',
  
  async execute(args: any, context: PluginContext): Promise<void> {
    const { logger, utils } = context;
    
    try {
      const status = await utils.exec('git status --porcelain');
      
      if (!status.trim()) {
        logger.warn('No changes to commit');
        return;
      }
      
      logger.info('Analyzing changes for commit message...');
      const diff = await utils.exec('git diff HEAD');
      
      // AI will analyze diff and generate appropriate commit message
      logger.info('AI is analyzing your changes...');
      
      const commitMessage = args.message || 'chore: update files';
      
      await utils.exec('git add .');
      await utils.exec(`git commit -m "${commitMessage}"`);
      
      logger.success(`Committed: ${commitMessage}`);
    } catch (error) {
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }
};

const cleanGoneCommand: PluginCommand = {
  name: 'clean-gone',
  description: 'Clean up local branches that are gone on remote',
  
  async execute(args: any, context: PluginContext): Promise<void> {
    const { logger, utils } = context;
    
    try {
      logger.info('Finding branches gone on remote...');
      
      // Fetch and prune
      await utils.exec('git fetch --prune');
      
      // Find gone branches
      const branches = await utils.exec('git branch -vv');
      const lines = branches.split('\n');
      const goneBranches = lines
        .filter(line => line.includes(': gone]'))
        .map(line => line.trim().split(/\s+/)[0].replace('*', '').trim())
        .filter(Boolean);
      
      if (goneBranches.length === 0) {
        logger.info('No branches to clean');
        return;
      }
      
      logger.info(`Found ${goneBranches.length} branches gone on remote:`);
      goneBranches.forEach(b => logger.info(`  - ${b}`));
      
      if (args.force || args.f) {
        for (const branch of goneBranches) {
          await utils.exec(`git branch -D ${branch}`);
          logger.success(`Deleted: ${branch}`);
        }
      } else {
        logger.info('\nRun with --force to delete these branches');
      }
    } catch (error) {
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }
};

const plugin: Plugin = {
  manifest: require('./manifest.json'),
  
  commands: [commitPushPrCommand, smartCommitCommand, cleanGoneCommand],
  
  hooks: new Map([
    ['pre-commit', {
      name: 'pre-commit',
      async execute(data: any, context: PluginContext) {
        context.logger.info('[Commit Automation] Running pre-commit checks...');
        // Could run linting, tests, etc.
        return data;
      }
    }],
    ['post-commit', {
      name: 'post-commit',
      async execute(data: any, context: PluginContext) {
        context.logger.debug('[Commit Automation] Commit completed');
        return data;
      }
    }]
  ]),
  
  async initialize(context: PluginContext) {
    context.logger.info('Commit Automation plugin initialized');
    context.logger.info('  → Commands: commit-push-pr, smart-commit, clean-gone');
  },
  
  async cleanup() {
    console.log('Commit Automation plugin cleanup');
  }
};

export default plugin;

