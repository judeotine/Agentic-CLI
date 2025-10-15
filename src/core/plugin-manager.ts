import * as fs from 'fs/promises';
import * as path from 'path';
import { Plugin, PluginManifest, PluginManifestSchema, PluginContext } from '../types/plugin';

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private hooks: Map<string, Array<{ plugin: string; handler: Function }>> = new Map();
  private pluginDirectory: string;
  private context: PluginContext;

  constructor(pluginDirectory: string, context: PluginContext) {
    this.pluginDirectory = pluginDirectory;
    this.context = context;
  }

  async loadAll(): Promise<void> {
    try {
      await fs.access(this.pluginDirectory);
    } catch {
      await fs.mkdir(this.pluginDirectory, { recursive: true });
      return;
    }

    const entries = await fs.readdir(this.pluginDirectory, { withFileTypes: true });
    const pluginDirs = entries.filter((e) => e.isDirectory());

    for (const dir of pluginDirs) {
      try {
        await this.loadPlugin(path.join(this.pluginDirectory, dir.name));
      } catch (error) {
        console.error(`Failed to load plugin ${dir.name}:`, error);
      }
    }
  }

  async loadPlugin(pluginPath: string): Promise<void> {
    const manifestPath = path.join(pluginPath, 'manifest.json');
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest: PluginManifest = PluginManifestSchema.parse(JSON.parse(manifestContent));

    const mainPath = path.join(pluginPath, manifest.main);
    const pluginModule = await import(mainPath);
    const plugin: Plugin = pluginModule.default || pluginModule;

    plugin.manifest = manifest;

    if (plugin.initialize) {
      await plugin.initialize(this.context);
    }

    this.plugins.set(manifest.name, plugin);

    if (plugin.hooks) {
      for (const [hookName, hook] of plugin.hooks.entries()) {
        this.registerHook(hookName, manifest.name, hook.execute.bind(hook));
      }
    }
  }

  private registerHook(hookName: string, pluginName: string, handler: Function): void {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    this.hooks.get(hookName)!.push({ plugin: pluginName, handler });
  }

  async executeHook(hookName: string, data: any): Promise<any> {
    const handlers = this.hooks.get(hookName) || [];
    let result = data;

    for (const { handler } of handlers) {
      try {
        result = await handler(result, this.context);
      } catch (error) {
        console.error(`Hook ${hookName} failed:`, error);
      }
    }

    return result;
  }

  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  listPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values()).map((p) => p.manifest);
  }

  async unloadPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) return;

    if (plugin.cleanup) {
      await plugin.cleanup();
    }

    this.hooks.forEach((handlers, hookName) => {
      this.hooks.set(
        hookName,
        handlers.filter((h) => h.plugin !== name)
      );
    });

    this.plugins.delete(name);
  }

  async reloadPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} not found`);
    }

    const pluginPath = path.join(this.pluginDirectory, name);
    await this.unloadPlugin(name);
    await this.loadPlugin(pluginPath);
  }

  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }
}

