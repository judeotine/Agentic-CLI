import { z } from 'zod';

export const PluginManifestSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string(),
  author: z.string().optional(),
  main: z.string(),
  commands: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      aliases: z.array(z.string()).optional(),
    })
  ),
  hooks: z
    .array(
      z.enum([
        'pre-command',
        'post-command',
        'pre-edit',
        'post-edit',
        'pre-commit',
        'post-commit',
      ])
    )
    .optional(),
  permissions: z.object({
    fileSystem: z.boolean().default(false),
    git: z.boolean().default(false),
    network: z.boolean().default(false),
  }),
  dependencies: z.record(z.string()).optional(),
});

export type PluginManifest = z.infer<typeof PluginManifestSchema>;

export interface PluginContext {
  config: any;
  logger: any;
  utils: {
    exec: (command: string) => Promise<string>;
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<void>;
  };
}

export interface PluginCommand {
  name: string;
  description: string;
  execute: (args: any, context: PluginContext) => Promise<void>;
}

export interface PluginHook {
  name: string;
  execute: (data: any, context: PluginContext) => Promise<any>;
}

export interface Plugin {
  manifest: PluginManifest;
  commands?: PluginCommand[];
  hooks?: Map<string, PluginHook>;
  initialize?: (context: PluginContext) => Promise<void>;
  cleanup?: () => Promise<void>;
}

export interface PluginLoadResult {
  plugin: Plugin;
  errors: string[];
}

