import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';
import { Config, ConfigSchema, ConfigOptions } from '../types/config';

export class ConfigManager {
  private config: Config | null = null;
  private configPath: string;

  constructor(options: ConfigOptions = {}) {
    this.configPath = options.configPath || this.getDefaultConfigPath();
  }

  private getDefaultConfigPath(): string {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    return path.join(homeDir, '.agentic', 'config.yaml');
  }

  async load(): Promise<Config> {
    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      const rawConfig = yaml.parse(content);
      this.config = ConfigSchema.parse(rawConfig);
      return this.config;
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return this.createDefaultConfig();
      }
      throw new Error(`Failed to load config: ${(error as Error).message}`);
    }
  }

  async save(config: Config): Promise<void> {
    const configDir = path.dirname(this.configPath);
    await fs.mkdir(configDir, { recursive: true });
    const content = yaml.stringify(config);
    await fs.writeFile(this.configPath, content, 'utf-8');
    this.config = config;
  }

  private async createDefaultConfig(): Promise<Config> {
    const defaultConfig: Config = {
      version: '1.0.0',
      aiModels: {
        'gpt-4': {
          provider: 'openai',
          model: 'gpt-4-turbo-preview',
          apiKey: process.env.OPENAI_API_KEY || '',
          temperature: 0.7,
          timeout: 30000,
        },
        'claude-3': {
          provider: 'anthropic',
          model: 'claude-3-sonnet-20240229',
          apiKey: process.env.ANTHROPIC_API_KEY || '',
          temperature: 0.7,
          timeout: 30000,
        },
      },
      defaultModel: 'gpt-4',
      permissions: {
        fileSystem: {
          read: true,
          write: false,
          delete: false,
        },
        git: {
          read: true,
          commit: false,
          push: false,
          createPR: false,
        },
        network: {
          enabled: true,
        },
      },
      plugins: {
        enabled: true,
        directory: './plugins',
      },
      agents: {
        maxConcurrent: 3,
        timeout: 300000,
        retryAttempts: 3,
      },
      ui: {
        mode: 'interactive',
        colors: true,
        progressBar: true,
      },
      git: {
        autoCommit: false,
        autoPush: false,
      },
      workspace: {
        root: process.cwd(),
        ignorePaths: ['node_modules', 'dist', '.git', 'coverage'],
      },
    };

    await this.save(defaultConfig);
    return defaultConfig;
  }

  get(): Config {
    if (!this.config) {
      throw new Error('Config not loaded. Call load() first.');
    }
    return this.config;
  }

  async update(updates: Partial<Config>): Promise<Config> {
    const current = this.get();
    const updated = { ...current, ...updates };
    await this.save(ConfigSchema.parse(updated));
    return this.config!;
  }

  getModel(modelName?: string): any {
    const name = modelName || this.get().defaultModel;
    const model = this.get().aiModels[name];
    if (!model) {
      throw new Error(`Model '${name}' not found in configuration`);
    }
    return model;
  }
}

