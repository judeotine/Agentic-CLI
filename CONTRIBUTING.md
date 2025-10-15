# Contributing to Agentic CLI

**Repository**: https://github.com/judeotine/Agentic-CLI.git

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Git

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/judeotine/Agentic-CLI.git
cd Agentic-CLI

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Start development mode
npm run dev
```

## Project Structure

Understanding the codebase structure:

```
src/
├── commands/      # CLI command implementations
├── core/          # Core functionality (config, agents, plugins, security)
├── types/         # TypeScript type definitions
├── ui/            # User interface (logger, TUI)
└── utils/         # Utility functions

tests/             # Test files mirroring src/ structure
plugins/           # Plugin directory
config/            # Configuration templates
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number
```

### 2. Make Changes

- Write clean, readable code
- Follow TypeScript best practices
- Add/update tests
- Update documentation

### 3. Test Your Changes

```bash
# Run unit tests
npm test

# Run specific test file
npm test -- path/to/test.test.ts

# Run with coverage
npm test -- --coverage

# Lint code
npm run lint

# Format code
npm run format
```

### 4. Commit Changes

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: <type>(<scope>): <description>

git commit -m "feat(commands): add new search command"
git commit -m "fix(config): resolve validation error"
git commit -m "docs(readme): update installation steps"
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### 5. Push and Create PR

```bash
git push origin your-branch-name
```

Then create a Pull Request on GitHub at https://github.com/judeotine/Agentic-CLI.git

## Writing Tests

### Test Structure

```typescript
import { YourModule } from '../../src/path/to/module';

describe('YourModule', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  describe('methodName', () => {
    it('should do something', async () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = await module.method(input);
      
      // Assert
      expect(result).toBe('expected');
    });

    it('should handle errors', async () => {
      await expect(module.method(null)).rejects.toThrow();
    });
  });
});
```

### Mocking

```typescript
// Mock fs module
jest.mock('fs/promises');

// Mock specific function
const mockFn = jest.fn().mockResolvedValue('result');

// Verify calls
expect(mockFn).toHaveBeenCalledWith('expected-arg');
expect(mockFn).toHaveBeenCalledTimes(1);
```

## Adding New Features

### Adding a New Command

1. **Create command file**: `src/commands/my-command.ts`

```typescript
import { Command } from 'commander';
import { CommandContext } from '../types/command';

export class MyCommand {
  register(program: Command, context: CommandContext): void {
    program
      .command('my-command')
      .description('Description of command')
      .option('-o, --option <value>', 'Option description')
      .action(async (options) => {
        await this.execute(options, context);
      });
  }

  private async execute(options: any, context: CommandContext): Promise<void> {
    const { logger, aiProvider } = context;
    
    logger.startSpinner('Processing...');
    
    try {
      // Implementation
      logger.stopSpinner(true, 'Success');
    } catch (error) {
      logger.stopSpinner(false, 'Failed');
      throw error;
    }
  }
}
```

2. **Register command**: Update `src/commands/index.ts`

```typescript
import { MyCommand } from './my-command';

export function registerCommands(program: Command, context: CommandContext): void {
  const commands = [
    // ... existing
    new MyCommand(),
  ];
  
  commands.forEach(cmd => cmd.register(program, context));
}
```

3. **Add tests**: `tests/commands/my-command.test.ts`

4. **Update documentation**: Add usage to README.md

### Adding a New AI Provider

1. **Implement provider**: `src/core/ai-provider.ts`

```typescript
export class MyAIProvider extends AIProvider {
  constructor(config: AIModel) {
    super(config);
    // Setup
  }

  async chat(messages: AIMessage[]): Promise<AIResponse> {
    // Implementation
  }

  async streamChat(messages: AIMessage[], handler: AIStreamHandler): Promise<void> {
    // Implementation
  }
}
```

2. **Register in factory**:

```typescript
export class AIProviderFactory {
  static create(config: AIModel): AIProvider {
    switch (config.provider) {
      // ... existing
      case 'my-provider':
        return new MyAIProvider(config);
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }
}
```

3. **Add configuration schema**: Update `src/types/config.ts`

4. **Add tests**: `tests/core/ai-provider.test.ts`

### Adding a New Hook

1. **Define hook type**: Update `src/types/plugin.ts`

```typescript
export const PluginManifestSchema = z.object({
  hooks: z.array(
    z.enum([
      // ... existing
      'my-new-hook',
    ])
  ).optional(),
});
```

2. **Execute hook**: In relevant command

```typescript
await context.pluginManager.executeHook('my-new-hook', data);
```

3. **Document hook**: Update plugin documentation

## Code Style

### TypeScript Guidelines

- Use TypeScript strict mode
- Prefer interfaces over types for object shapes
- Use Zod for runtime validation
- Avoid `any`, use `unknown` when necessary
- Use async/await over promises

### Naming Conventions

- **Files**: kebab-case (`my-file.ts`)
- **Classes**: PascalCase (`MyClass`)
- **Functions**: camelCase (`myFunction`)
- **Constants**: UPPER_SNAKE_CASE (`MY_CONSTANT`)
- **Interfaces**: PascalCase (`MyInterface`)
- **Types**: PascalCase (`MyType`)

### Code Organization

```typescript
// Imports
import { external } from 'external';
import { internal } from '../internal';

// Types
interface MyInterface {
  // ...
}

// Constants
const MY_CONSTANT = 'value';

// Class
export class MyClass {
  private field: string;

  constructor() {
    // ...
  }

  public method(): void {
    // ...
  }

  private helperMethod(): void {
    // ...
  }
}
```

## Documentation

### Code Documentation

Use JSDoc for public APIs:

```typescript
/**
 * Execute a task with retry logic
 * 
 * @param task - The task to execute
 * @param options - Execution options
 * @returns Task result
 * @throws {Error} If task fails after all retries
 * 
 * @example
 * ```typescript
 * const result = await executeTask(myTask, { retries: 3 });
 * ```
 */
async function executeTask(task: Task, options: Options): Promise<Result> {
  // Implementation
}
```

### README Updates

When adding features, update:
- Feature list
- Usage examples
- API documentation
- Configuration options

## Bug Reports

### Before Reporting

1. Search existing issues at https://github.com/judeotine/Agentic-CLI/issues
2. Update to latest version
3. Check documentation

### Reporting Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Run command '...'
2. With arguments '...'
3. See error

**Expected behavior**
What you expected to happen.

**Environment:**
- OS: [e.g., Windows 10, macOS 13]
- Node version: [e.g., 18.0.0]
- CLI version: [e.g., 0.1.0]

**Additional context**
Any other relevant information.
```

## Feature Requests

### Template

```markdown
**Feature Description**
Clear description of the feature.

**Use Case**
Why is this feature needed?

**Proposed Solution**
How should it work?

**Alternatives Considered**
Other approaches you've thought about.
```

## Code Review Process

### What We Look For

- **Functionality**: Does it work as intended?
- **Tests**: Are there adequate tests?
- **Documentation**: Is it well documented?
- **Code Quality**: Is it clean and maintainable?
- **Performance**: Any performance concerns?
- **Security**: Any security implications?

### Getting Your PR Merged

1. All tests pass
2. Code follows style guidelines
3. Documentation is updated
4. At least one approval from maintainer
5. No unresolved comments

## Checklist

Before submitting PR:

- [ ] Tests added/updated
- [ ] Tests passing
- [ ] Code linted and formatted
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] Branch up to date with main
- [ ] No merge conflicts

## Thank You!

Your contributions make this project better. We appreciate your time and effort!

## Questions?

- Open an issue for discussion at https://github.com/judeotine/Agentic-CLI/issues
- Check existing documentation
- Review architecture guide

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.
