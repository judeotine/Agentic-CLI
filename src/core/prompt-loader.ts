import * as path from 'path';
import { FileOperations } from '../utils/file-ops';

export interface CustomPrompt {
  name: string;
  model?: string;
  system: string;
  user?: string;
  temperature?: number;
  maxTokens?: number;
  rules?: string[];
  examples?: Array<{ input: string; output: string }>;
}

export interface PromptConfig {
  prompts: Map<string, CustomPrompt>;
  modelDefaults: Map<string, Partial<CustomPrompt>>;
}

export class PromptLoader {
  private config: PromptConfig;
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.config = {
      prompts: new Map(),
      modelDefaults: new Map(),
    };
  }

  async loadPrompts(): Promise<void> {
    await this.loadFromDirectory(this.projectRoot);

    const userConfigDir = path.join(
      process.env.HOME || process.env.USERPROFILE || '',
      '.cli-agent',
      'prompts'
    );
    await this.loadFromDirectory(userConfigDir);
  }

  private async loadFromDirectory(dir: string): Promise<void> {
    try {
      const agenticPath = path.join(dir, 'AGENTIC.md');
      if (await FileOperations.fileExists(agenticPath)) {
        const content = await FileOperations.readFile(agenticPath);
        const prompt = this.parseMarkdownPrompt(content, 'agentic');
        this.config.modelDefaults.set('default', prompt);
      }

      const modelFiles = [
        { file: 'ANTHROPIC.md', key: 'anthropic' },
        { file: 'OPENAI.md', key: 'openai' },
        { file: 'GEMINI.md', key: 'gemini' },
      ];

      for (const { file, key } of modelFiles) {
        const filePath = path.join(dir, file);
        if (await FileOperations.fileExists(filePath)) {
          const content = await FileOperations.readFile(filePath);
          const prompt = this.parseMarkdownPrompt(content, key);
          this.config.modelDefaults.set(key, prompt);
        }
      }

      const promptsDir = path.join(dir, 'prompts');
      if (await FileOperations.fileExists(promptsDir)) {
        const files = await FileOperations.listFiles(promptsDir, '*.md');
        for (const file of files) {
          const content = await FileOperations.readFile(path.join(promptsDir, file));
          const name = path.basename(file, '.md');
          const prompt = this.parseMarkdownPrompt(content, name);
          this.config.prompts.set(name, prompt as CustomPrompt);
        }
      }
    } catch {}
  }

  private parseMarkdownPrompt(content: string, name: string): Partial<CustomPrompt> {
    const prompt: Partial<CustomPrompt> = {
      name,
      rules: [],
      examples: [],
    };

    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const yaml = frontmatterMatch[1];
      const lines = yaml.split('\n');
      for (const line of lines) {
        const [key, value] = line.split(':').map((s) => s.trim());
        if (key === 'model') prompt.model = value;
        if (key === 'temperature') prompt.temperature = parseFloat(value);
        if (key === 'maxTokens') prompt.maxTokens = parseInt(value);
      }
      content = content.substring(frontmatterMatch[0].length);
    }

    const sections = content.split(/^##\s+/m);

    for (const section of sections) {
      const lines = section.trim().split('\n');
      const heading = lines[0]?.toLowerCase();

      if (heading.includes('system') || heading.includes('role')) {
        prompt.system = lines.slice(1).join('\n').trim();
      } else if (heading.includes('rule')) {
        prompt.rules = lines
          .slice(1)
          .filter((l) => l.trim().startsWith('-'))
          .map((l) => l.trim().substring(1).trim());
      } else if (heading.includes('example')) {
        const exampleText = lines.slice(1).join('\n');
        const exampleBlocks = exampleText.split(/```/);
        for (let i = 0; i < exampleBlocks.length - 1; i += 2) {
          if (exampleBlocks[i + 1]) {
            const input = exampleBlocks[i].trim();
            const output = exampleBlocks[i + 1].trim();
            prompt.examples?.push({ input, output });
          }
        }
      }
    }

    return prompt;
  }

  getPrompt(name: string): CustomPrompt | undefined {
    return this.config.prompts.get(name);
  }

  getModelDefaults(model: string): Partial<CustomPrompt> | undefined {
    let defaults = this.config.modelDefaults.get(model);
    if (defaults) return defaults;

    for (const [key, value] of this.config.modelDefaults.entries()) {
      if (model.includes(key) || key.includes(model)) {
        return value;
      }
    }

    return undefined;
  }

  applyPrompt(basePrompt: string, promptName: string): string {
    const custom = this.getPrompt(promptName);
    if (!custom) return basePrompt;

    let enhanced = custom.system || basePrompt;

    if (custom.rules && custom.rules.length > 0) {
      enhanced += '\n\n## Rules\n' + custom.rules.map((r) => `- ${r}`).join('\n');
    }

    if (custom.examples && custom.examples.length > 0) {
      enhanced += '\n\n## Examples\n';
      for (const example of custom.examples) {
        enhanced += `\nInput: ${example.input}\nOutput: ${example.output}\n`;
      }
    }

    return enhanced;
  }

  async createPromptTemplate(name: string): Promise<void> {
    const template = `---
model: gpt-4
temperature: 0.7
maxTokens: 4096
---

## System Role

You are a specialized AI assistant for ${name}.

## Rules

- Be concise and accurate
- Follow coding best practices
- Provide examples when helpful
- Consider edge cases

## Examples

**Example 1:**

Input:
\`\`\`
// Your example input
\`\`\`

Output:
\`\`\`
// Your example output
\`\`\`

## Additional Context

Add any additional context or guidelines here.
`;

    const promptPath = path.join(this.projectRoot, 'prompts', `${name}.md`);
    await FileOperations.ensureDir(path.dirname(promptPath));
    await FileOperations.writeFile(promptPath, template);
  }

  listPrompts(): string[] {
    return Array.from(this.config.prompts.keys());
  }
}

