import { ConfigManager } from '../../src/core/config';
import * as fs from 'fs/promises';
import * as path from 'path';

jest.mock('fs/promises');

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  const mockConfigPath = '/mock/path/config.yaml';

  beforeEach(() => {
    configManager = new ConfigManager({ configPath: mockConfigPath });
    jest.clearAllMocks();
  });

  describe('load', () => {
    it('should load and parse valid config', async () => {
      const mockConfig = `
version: '1.0.0'
defaultModel: gpt-4
aiModels:
  gpt-4:
    provider: openai
    model: gpt-4-turbo-preview
    temperature: 0.7
`;

      (fs.readFile as jest.Mock).mockResolvedValue(mockConfig);

      const config = await configManager.load();

      expect(config.version).toBe('1.0.0');
      expect(config.defaultModel).toBe('gpt-4');
    });

    it('should create default config if file not found', async () => {
      const error: any = new Error('ENOENT');
      error.code = 'ENOENT';
      (fs.readFile as jest.Mock).mockRejectedValue(error);
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      const config = await configManager.load();

      expect(config).toBeDefined();
      expect(config.version).toBe('1.0.0');
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  describe('save', () => {
    it('should save config to file', async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      const config: any = {
        version: '1.0.0',
        defaultModel: 'test',
        aiModels: {},
        permissions: {},
        plugins: {},
        agents: {},
        ui: {},
        git: {},
        workspace: {},
      };

      await configManager.save(config);

      expect(fs.writeFile).toHaveBeenCalledWith(
        mockConfigPath,
        expect.any(String),
        'utf-8'
      );
    });
  });

  describe('getModel', () => {
    it('should return model config by name', async () => {
      const mockConfig = `
version: '1.0.0'
defaultModel: gpt-4
aiModels:
  gpt-4:
    provider: openai
    model: gpt-4-turbo-preview
    temperature: 0.7
`;

      (fs.readFile as jest.Mock).mockResolvedValue(mockConfig);

      await configManager.load();
      const model = configManager.getModel('gpt-4');

      expect(model.provider).toBe('openai');
      expect(model.model).toBe('gpt-4-turbo-preview');
    });

    it('should throw error for unknown model', async () => {
      const mockConfig = `
version: '1.0.0'
defaultModel: gpt-4
aiModels:
  gpt-4:
    provider: openai
    model: gpt-4-turbo-preview
`;

      (fs.readFile as jest.Mock).mockResolvedValue(mockConfig);

      await configManager.load();

      expect(() => configManager.getModel('unknown')).toThrow();
    });
  });
});

