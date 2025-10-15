import { z } from 'zod';

export const AIModelSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'azure', 'local']),
  model: z.string(),
  apiKey: z.string().optional(),
  endpoint: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().optional(),
  timeout: z.number().default(30000),
});

export const PermissionsSchema = z.object({
  fileSystem: z.object({
    read: z.boolean().default(true),
    write: z.boolean().default(false),
    delete: z.boolean().default(false),
    allowedPaths: z.array(z.string()).optional(),
  }),
  git: z.object({
    read: z.boolean().default(true),
    commit: z.boolean().default(false),
    push: z.boolean().default(false),
    createPR: z.boolean().default(false),
  }),
  network: z.object({
    enabled: z.boolean().default(true),
    allowedDomains: z.array(z.string()).optional(),
  }),
});

export const ConfigSchema = z.object({
  version: z.string().default('1.0.0'),
  aiModels: z.record(AIModelSchema),
  defaultModel: z.string(),
  permissions: PermissionsSchema,
  plugins: z.object({
    enabled: z.boolean().default(true),
    directory: z.string().default('./plugins'),
    whitelist: z.array(z.string()).optional(),
  }),
  agents: z.object({
    maxConcurrent: z.number().default(3),
    timeout: z.number().default(300000),
    retryAttempts: z.number().default(3),
  }),
  ui: z.object({
    mode: z.enum(['tui', 'interactive', 'quiet']).default('interactive'),
    colors: z.boolean().default(true),
    progressBar: z.boolean().default(true),
  }),
  git: z.object({
    autoCommit: z.boolean().default(false),
    commitMessageTemplate: z.string().optional(),
    autoPush: z.boolean().default(false),
  }),
  workspace: z.object({
    root: z.string().default(process.cwd()),
    ignorePaths: z.array(z.string()).default(['node_modules', 'dist', '.git']),
  }),
});

export type AIModel = z.infer<typeof AIModelSchema>;
export type Permissions = z.infer<typeof PermissionsSchema>;
export type Config = z.infer<typeof ConfigSchema>;

export interface ConfigOptions {
  configPath?: string;
  overrides?: Partial<Config>;
}

