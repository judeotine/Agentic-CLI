import { Plugin, PluginContext, PluginCommand, PluginHook } from '../../src/types/plugin';

/**
 * Custom command implementation
 */
const myCommand: PluginCommand = {
  name: 'my-command',
  description: 'Custom command description',
  
  async execute(args: any, context: PluginContext): Promise<void> {
    const { logger, config, utils } = context;
    
    logger.info('Executing custom command...');
    
    // Access configuration
    logger.debug(`Config version: ${config.version}`);
    
    // Use utilities
    try {
      const result = await utils.exec('echo "Hello from plugin"');
      logger.info(`Command output: ${result}`);
    } catch (error) {
      logger.error(`Command failed: ${(error as Error).message}`);
    }
    
    // Read/write files
    try {
      const content = await utils.readFile('package.json');
      const pkg = JSON.parse(content);
      logger.info(`Project: ${pkg.name}`);
    } catch (error) {
      logger.error(`File read failed: ${(error as Error).message}`);
    }
    
    logger.success('Custom command completed!');
  }
};

/**
 * Pre-command hook
 * Runs before any command executes
 */
const preCommandHook: PluginHook = {
  name: 'pre-command',
  
  async execute(data: any, context: PluginContext): Promise<any> {
    context.logger.debug('[Plugin] Pre-command hook triggered');
    context.logger.debug(`Command: ${data.command}`);
    
    // You can modify the data before it's processed
    // Return modified data or original data
    return data;
  }
};

/**
 * Post-command hook
 * Runs after command execution
 */
const postCommandHook: PluginHook = {
  name: 'post-command',
  
  async execute(data: any, context: PluginContext): Promise<any> {
    context.logger.debug('[Plugin] Post-command hook triggered');
    context.logger.debug(`Result: ${JSON.stringify(data.result)}`);
    
    return data;
  }
};

/**
 * Pre-edit hook
 * Runs before file edits
 */
const preEditHook: PluginHook = {
  name: 'pre-edit',
  
  async execute(data: any, context: PluginContext): Promise<any> {
    context.logger.debug('[Plugin] Pre-edit hook triggered');
    context.logger.debug(`File: ${data.file}`);
    context.logger.debug(`Operation: ${data.operation}`);
    
    // Example: Validate file path
    if (!data.file.startsWith('src/')) {
      throw new Error('Plugin policy: Only files in src/ can be edited');
    }
    
    // Example: Backup file before edit
    if (data.operation === 'update') {
      const content = await context.utils.readFile(data.file);
      await context.utils.writeFile(`${data.file}.backup`, content);
      context.logger.info(`Created backup: ${data.file}.backup`);
    }
    
    return data;
  }
};

/**
 * Post-edit hook
 * Runs after file edits
 */
const postEditHook: PluginHook = {
  name: 'post-edit',
  
  async execute(data: any, context: PluginContext): Promise<any> {
    context.logger.debug('[Plugin] Post-edit hook triggered');
    context.logger.success(`Successfully edited: ${data.file}`);
    
    // Example: Run linter on edited file
    if (data.file.endsWith('.ts') || data.file.endsWith('.js')) {
      try {
        await context.utils.exec(`npx eslint ${data.file} --fix`);
        context.logger.info(`Linted: ${data.file}`);
      } catch (error) {
        context.logger.warn(`Linting failed for ${data.file}`);
      }
    }
    
    return data;
  }
};

/**
 * Pre-commit hook
 * Runs before git commits
 */
const preCommitHook: PluginHook = {
  name: 'pre-commit',
  
  async execute(data: any, context: PluginContext): Promise<any> {
    context.logger.debug('[Plugin] Pre-commit hook triggered');
    context.logger.debug(`Message: ${data.message}`);
    
    // Example: Validate commit message format
    const conventionalCommitPattern = /^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+/;
    if (!conventionalCommitPattern.test(data.message)) {
      context.logger.warn('Commit message does not follow conventional commits format');
      // Optionally throw to prevent commit
      // throw new Error('Invalid commit message format');
    }
    
    return data;
  }
};

/**
 * Post-commit hook
 * Runs after git commits
 */
const postCommitHook: PluginHook = {
  name: 'post-commit',
  
  async execute(data: any, context: PluginContext): Promise<any> {
    context.logger.debug('[Plugin] Post-commit hook triggered');
    context.logger.debug(`Commit hash: ${data.hash}`);
    
    // Example: Send notification
    context.logger.info(`✓ Committed: ${data.hash.substring(0, 7)}`);
    
    return data;
  }
};

/**
 * Main plugin export
 */
const plugin: Plugin = {
  manifest: require('./manifest.json'),
  
  // Register custom commands
  commands: [myCommand],
  
  // Register hooks
  hooks: new Map([
    ['pre-command', preCommandHook],
    ['post-command', postCommandHook],
    ['pre-edit', preEditHook],
    ['post-edit', postEditHook],
    ['pre-commit', preCommitHook],
    ['post-commit', postCommitHook],
  ]),
  
  /**
   * Initialize plugin
   * Called when plugin is loaded
   */
  async initialize(context: PluginContext): Promise<void> {
    context.logger.info('Custom plugin initialized');
    
    // Perform any setup here
    // - Load configuration
    // - Initialize resources
    // - Validate dependencies
    
    context.logger.debug(`Plugin version: ${this.manifest.version}`);
  },
  
  /**
   * Cleanup plugin
   * Called when plugin is unloaded
   */
  async cleanup(): Promise<void> {
    console.log('Custom plugin cleanup');
    
    // Perform any cleanup here
    // - Close connections
    // - Save state
    // - Release resources
  }
};

export default plugin;

