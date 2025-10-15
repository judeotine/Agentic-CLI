import { Command } from 'commander';
import { CommandContext } from '../types/command';

export class PluginCommand {
  register(program: Command, context: CommandContext): void {
    program
      .command('plugin:list')
      .description('List all installed plugins')
      .action(async () => {
        await this.list(context);
      });

    program
      .command('plugin:info')
      .description('Show plugin information')
      .argument('<name>', 'Plugin name')
      .action(async (name: string) => {
        await this.info(name, context);
      });

    program
      .command('plugin:reload')
      .description('Reload a plugin')
      .argument('<name>', 'Plugin name')
      .action(async (name: string) => {
        await this.reload(name, context);
      });

    program
      .command('plugin:unload')
      .description('Unload a plugin')
      .argument('<name>', 'Plugin name')
      .action(async (name: string) => {
        await this.unload(name, context);
      });
  }

  private async list(context: CommandContext): Promise<void> {
    const { logger, pluginManager } = context;

    try {
      const plugins = pluginManager.listPlugins();

      if (plugins.length === 0) {
        logger.info('No plugins installed');
        return;
      }

      logger.info(`\nInstalled Plugins (${plugins.length}):\n`);

      const pluginData = plugins.map((plugin) => ({
        Name: plugin.name,
        Version: plugin.version,
        Description: plugin.description,
        Commands: plugin.commands?.length || 0,
        Hooks: plugin.hooks?.length || 0,
      }));

      logger.table(pluginData);
    } catch (error) {
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async info(name: string, context: CommandContext): Promise<void> {
    const { logger, pluginManager } = context;

    try {
      const plugin = pluginManager.getPlugin(name);

      if (!plugin) {
        logger.error(`Plugin '${name}' not found`);
        return;
      }

      logger.info(`\nPlugin: ${plugin.manifest.name}\n`);
      logger.info(`Version: ${plugin.manifest.version}`);
      logger.info(`Description: ${plugin.manifest.description}`);
      logger.info(`Author: ${plugin.manifest.author || 'Unknown'}`);
      logger.info(`Main: ${plugin.manifest.main}`);

      if (plugin.manifest.commands && plugin.manifest.commands.length > 0) {
        logger.info('\nCommands:');
        plugin.manifest.commands.forEach((cmd) => {
          logger.info(`  ${cmd.name} - ${cmd.description}`);
          if (cmd.aliases) {
            logger.info(`    Aliases: ${cmd.aliases.join(', ')}`);
          }
        });
      }

      if (plugin.manifest.hooks && plugin.manifest.hooks.length > 0) {
        logger.info('\nHooks:');
        plugin.manifest.hooks.forEach((hook) => {
          logger.info(`  ${hook}`);
        });
      }

      logger.info('\nPermissions:');
      logger.info(`  File System: ${plugin.manifest.permissions.fileSystem ? '✓' : '✗'}`);
      logger.info(`  Git: ${plugin.manifest.permissions.git ? '✓' : '✗'}`);
      logger.info(`  Network: ${plugin.manifest.permissions.network ? '✓' : '✗'}`);
    } catch (error) {
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async reload(name: string, context: CommandContext): Promise<void> {
    const { logger, pluginManager } = context;

    try {
      logger.startSpinner(`Reloading plugin: ${name}`);

      await pluginManager.reloadPlugin(name);

      logger.stopSpinner(true, 'Plugin reloaded');
      logger.success(`✓ Reloaded plugin: ${name}`);
    } catch (error) {
      logger.stopSpinner(false, 'Reload failed');
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async unload(name: string, context: CommandContext): Promise<void> {
    const { logger, pluginManager } = context;

    try {
      logger.startSpinner(`Unloading plugin: ${name}`);

      await pluginManager.unloadPlugin(name);

      logger.stopSpinner(true, 'Plugin unloaded');
      logger.success(`✓ Unloaded plugin: ${name}`);
    } catch (error) {
      logger.stopSpinner(false, 'Unload failed');
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }
}

