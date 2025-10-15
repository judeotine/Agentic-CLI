import { Command } from 'commander';
import { ConfigManager } from './core/config';
import { AIProviderFactory } from './core/ai-provider';
import { AgentOrchestrator } from './core/agent';
import { PluginManager } from './core/plugin-manager';
import { GitService } from './core/git-service';
import { Logger } from './ui/logger';
import { CommandContext } from './types/command';
import { registerCommands } from './commands';
import * as dotenv from 'dotenv';

dotenv.config();

export class CLI {
  private program: Command;
  private context: CommandContext | null = null;

  constructor() {
    this.program = new Command();
  }

  async initialize(): Promise<void> {
    this.program
      .name('agentic')
      .description('Agentic CLI - AI-powered development automation with multi-agent orchestration')
      .version('0.1.0')
      .option('-c, --config <path>', 'Path to config file')
      .option('-v, --verbose', 'Verbose output')
      .option('-q, --quiet', 'Quiet mode')
      .option('--no-color', 'Disable colors')
      .option('-m, --model <name>', 'AI model to use')
      .option('--tui', 'Enable Terminal UI mode');

    const configPath = this.program.opts().config;
    const configManager = new ConfigManager({ configPath });
    const config = await configManager.load();

    const logger = new Logger({
      verbose: this.program.opts().verbose,
      quiet: this.program.opts().quiet,
      colors: this.program.opts().color !== false,
    });

    if (!this.program.opts().quiet) {
      logger.showBanner();
    }

    const modelName = this.program.opts().model || config.defaultModel;
    const modelConfig = configManager.getModel(modelName);
    const aiProvider = AIProviderFactory.create(modelConfig);

    const agentOrchestrator = new AgentOrchestrator({
      timeout: config.agents.timeout || 300000,
      maxConcurrent: config.agents.maxConcurrent || 5,
      retryAttempts: config.agents.retryAttempts || 3
    }, aiProvider);

    const pluginContext = {
      config,
      logger,
      utils: {
        exec: async (command: string) => {
          const { exec } = await import('child_process');
          const { promisify } = await import('util');
          const execAsync = promisify(exec);
          const { stdout } = await execAsync(command);
          return stdout;
        },
        readFile: async (path: string) => {
          const { FileOperations } = await import('./utils/file-ops');
          return FileOperations.readFile(path);
        },
        writeFile: async (path: string, content: string) => {
          const { FileOperations } = await import('./utils/file-ops');
          return FileOperations.writeFile(path, content);
        },
      },
    };

    const pluginManager = new PluginManager(config.plugins.directory, pluginContext);

    if (config.plugins.enabled) {
      await pluginManager.loadAll();
      logger.debug(`Loaded ${pluginManager.listPlugins().length} plugins`);
    }

    const gitService = new GitService(config.workspace.root);

    this.context = {
      config,
      logger,
      aiProvider,
      agentOrchestrator,
      pluginManager,
      gitService,
    };

    registerCommands(this.program, this.context);

    this.program
      .command('init')
      .description('Initialize configuration')
      .action(async () => {
        await this.initConfig(configManager);
      });

    this.program
      .command('config')
      .description('Manage configuration')
      .argument('[action]', 'Action: show, edit, reset')
      .action(async (action: string) => {
        await this.manageConfig(action, configManager);
      });

    this.program.on('command:*', () => {
      logger.error('Invalid command. Use --help for available commands.');
      process.exit(1);
    });
  }

  async run(argv: string[]): Promise<void> {
    try {
      await this.initialize();
      await this.program.parseAsync(argv);
    } catch (error) {
      console.error(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  }

  private async initConfig(configManager: ConfigManager): Promise<void> {
    const { logger } = this.context!;
    const inquirer = await import('inquirer');

    logger.info('Initializing configuration...\n');

    const answers = await inquirer.default.prompt([
      {
        type: 'list',
        name: 'provider',
        message: 'Select your primary AI provider:',
        choices: ['openai', 'anthropic', 'azure', 'local'],
      },
      {
        type: 'input',
        name: 'apiKey',
        message: 'Enter API key (or press Enter to skip):',
      },
      {
        type: 'input',
        name: 'model',
        message: 'Enter model name:',
        default: (answers: any) =>
          answers.provider === 'openai' ? 'gpt-4-turbo-preview' : 'claude-3-sonnet-20240229',
      },
      {
        type: 'confirm',
        name: 'enablePlugins',
        message: 'Enable plugin support?',
        default: true,
      },
      {
        type: 'number',
        name: 'maxConcurrent',
        message: 'Maximum concurrent agents:',
        default: 3,
      },
    ]);

    const config = configManager.get();
    config.aiModels[answers.model] = {
      provider: answers.provider,
      model: answers.model,
      apiKey: answers.apiKey || process.env[`${answers.provider.toUpperCase()}_API_KEY`] || '',
      temperature: 0.7,
      timeout: 30000,
    };
    config.defaultModel = answers.model;
    config.plugins.enabled = answers.enablePlugins;
    config.agents.maxConcurrent = answers.maxConcurrent;

    await configManager.save(config);

    logger.success('✓ Configuration initialized successfully');
  }

  private async manageConfig(action: string, configManager: ConfigManager): Promise<void> {
    const { logger } = this.context!;

    switch (action) {
      case 'show':
        logger.json(configManager.get());
        break;

      case 'edit':
        logger.info('Opening configuration for editing...');
        const { exec } = await import('child_process');
        exec(`${process.env.EDITOR || 'nano'} ${configManager['configPath']}`);
        break;

      case 'reset':
        await configManager['createDefaultConfig']();
        logger.success('✓ Configuration reset to defaults');
        break;

      default:
        logger.json(configManager.get());
    }
  }

  getProgram(): Command {
    return this.program;
  }
}

