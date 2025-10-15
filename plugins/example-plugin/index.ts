import { Plugin, PluginContext, PluginCommand, PluginHook } from '../../src/types/plugin';

const helloCommand: PluginCommand = {
  name: 'hello',
  description: 'Say hello from the plugin',
  async execute(args: any, context: PluginContext): Promise<void> {
    context.logger.info('Hello from example plugin!');
    context.logger.info(`Arguments: ${JSON.stringify(args)}`);
  },
};

const preEditHook: PluginHook = {
  name: 'pre-edit',
  async execute(data: any, context: PluginContext): Promise<any> {
    context.logger.debug('[Example Plugin] Pre-edit hook triggered');
    context.logger.debug(`Editing file: ${data.file}`);
    return data;
  },
};

const postEditHook: PluginHook = {
  name: 'post-edit',
  async execute(data: any, context: PluginContext): Promise<any> {
    context.logger.debug('[Example Plugin] Post-edit hook triggered');
    context.logger.success(`Successfully edited: ${data.file}`);
    return data;
  },
};

const plugin: Plugin = {
  manifest: require('./manifest.json'),
  commands: [helloCommand],
  hooks: new Map([
    ['pre-edit', preEditHook],
    ['post-edit', postEditHook],
  ]),

  async initialize(context: PluginContext): Promise<void> {
    context.logger.info('Example plugin initialized');
  },

  async cleanup(): Promise<void> {
    console.log('Example plugin cleanup');
  },
};

export default plugin;

