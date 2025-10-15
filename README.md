# Agentic CLI

An advanced AI-powered CLI tool combining the best of Claude Code with cutting-edge features: multi-agent orchestration, security scanning, web search integration, automated testing, codebase indexing, and intelligent workflow automation.

**Repository**: https://github.com/judeotine/Agentic-CLI.git

## Features

### Core Capabilities
- **Multi-Agent Support**: Run parallel tasks with intelligent orchestration
- **AI-Powered Code Editing**: Multi-file edits with full context awareness
- **Semantic Search**: Natural language code search across repositories
- **Git Integration**: Auto-commit, push, and PR creation with AI
- **Plugin Architecture**: Extensible with custom commands and hooks
- **Multiple UI Modes**: CLI, Terminal UI (TUI), or quiet mode

### Advanced Features 
- **Security Scanning**: Built-in vulnerability detection with auto-fixing
- **Web Search Integration**: Live web search for grounded AI answers
- **Session Management**: Persistent context with full audit logging
- **Test Generation**: Automated test creation with coverage analysis
- **Codebase Indexing**: Symbol tracking and dependency graphs
- **Workflow Automation**: Multi-step orchestration with conditions

### Animated User Interface
- **Typewriter Effects**: Commands and responses typed out character by character
- **Progress Animations**: Smooth progress bars and loading indicators
- **Agent Status**: Real-time animated status indicators for all agents
- **Banner Animations**: Engaging startup sequence with slide-in effects
- **Transition Effects**: Slide, fade, and pulse animations for enhanced UX
- **Customizable Speed**: Adjust animation speed from 1 (slowest) to 10 (fastest)



### Specialized Review Agents
- **comment-analyzer**: Documentation quality and accuracy
- **pr-test-analyzer**: Test coverage and behavioral testing
- **silent-failure-hunter**: Error handling and failure detection
- **type-design-analyzer**: Type system quality (TypeScript/Python)
- **code-reviewer**: Project guidelines and bug detection
- **code-simplifier**: Code clarity and refactoring

## Installation

```bash
# Clone the repository
git clone https://github.com/judeotine/Agentic-CLI.git
cd Agentic-CLI

# Install dependencies
npm install

# Build the project
npm run build

# Link for global use
npm link

# Initialize configuration
agentic init
```

## Quick Start

### 1. Configure API Keys

Create `.env` file:

```bash
# At least one AI provider key required
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Web search (for enhanced features)
BRAVE_API_KEY=...

# Optional: GitHub integration
GITHUB_TOKEN=ghp_...
```

### 2. Initialize

```bash
agentic init
```

### 3. Animation Demo

Experience the full animation system:

```bash
# Full animation showcase
agentic demo

# Custom speed (1=slowest, 10=fastest)
agentic demo --speed 3

# Skip specific animations
agentic demo --no-banner --no-progress
```

The demo showcases:
- Animated banner entrance
- Typewriter command effects
- Progress bar animations
- Agent status indicators
- Slide and fade transitions
- Pulse effects for notifications

### 4. Start Developing

```bash
# Guided feature development (Claude Code workflow)
agentic feature-dev "Add user authentication"

# AI-powered code editing
agentic code-edit src/index.ts --prompt "Add error handling"

# Security scan
agentic security scan --auto-fix

# Generate tests
agentic test generate src/**/*.ts

# Comprehensive PR review
agentic review-pr

# Commit and create PR
agentic commit-push-pr
```

## Command Overview

### Development Workflow
```bash
agentic feature-dev        # Guided feature development (7 phases)
agentic code-edit          # AI code editing
agentic code-edit:multi    # Multi-file parallel editing
```

### Code Quality
```bash
agentic review-pr          # Comprehensive PR review
agentic review-tests       # Test coverage review
agentic review-security    # Security and error handling review
agentic security scan      # Vulnerability scanning
agentic test generate      # Auto-generate tests
```

### Search & Navigation
```bash
agentic search             # Text/regex search
agentic search:semantic    # AI semantic search
agentic index build        # Build code index
agentic index find         # Find symbols
agentic index refs         # Find references
agentic web search         # Web search
agentic web ask            # Grounded AI answers
```

### Git & Automation
```bash
agentic commit-push-pr     # One-command ship
agentic smart-commit       # AI commit message
agentic git:commit --auto  # Conventional commits
agentic git:diff --analyze # AI diff analysis
agentic clean-gone         # Clean dead branches
```

### Agents & Orchestration
```bash
agentic agent:run          # Run single task
agentic agent:parallel     # Run parallel tasks
agentic agent:create       # Create custom agent
agentic agent:status       # Monitor agents
```

### Sessions & Context
```bash
agentic session create     # New session
agentic session list       # List sessions
agentic session export     # Export session
agentic session audit      # Audit log
```

### Workflows
```bash
agentic workflow create    # Create workflow
agentic workflow run       # Execute workflow
agentic workflow list      # List workflows
```

## Example Workflows

### Complete Feature Development

```bash
# Start session
agentic session create "oauth-feature"

# Guided development with exploration and architecture
agentic feature-dev "Add OAuth2 authentication with Google and GitHub"

# Follow 7-phase workflow:
# 1. Discovery - Clarify requirements
# 2. Exploration - 3 code-explorer agents analyze codebase
# 3. Questions - Answer all ambiguities
# 4. Architecture - 3 code-architect agents propose approaches
# 5. Implementation - Build chosen architecture
# 6. Review - 3 code-reviewer agents validate
# 7. Summary - Document what was built

# Generate comprehensive tests
agentic test generate src/auth/**/*.ts --coverage 90

# Security validation
agentic security scan --auto-fix

# Final review
agentic review-pr

# Ship it
agentic commit-push-pr
```

### Security-First Development

```bash
# Scan before starting
agentic security scan --severity high

# Edit with security hooks active (warns in real-time)
agentic code-edit src/api/**/*.ts --prompt "Add rate limiting"

# Security-focused review
agentic review-security

# Generate security report
agentic security report --format html --output security-report.html

# Commit only after validation
agentic smart-commit
```

### AI-Assisted Code Review

```bash
# Index codebase for better context
agentic index build

# Comprehensive multi-agent review
agentic review-pr

# Specific reviews:
agentic review-tests              # Test coverage
agentic review-security           # Error handling
agentic agent:run code-simplifier "Simplify complex functions"

# Web search for best practices
agentic web ask "Best practices for async error handling in Node.js"

# Apply improvements
agentic code-edit src/**/*.ts --prompt "Apply review suggestions"
```

## Project Structure

```
Agentic-CLI/
├── src/
│   ├── commands/          # 11 command groups
│   │   ├── code-edit.ts
│   │   ├── repo-search.ts
│   │   ├── agent-manager.ts
│   │   ├── git.ts
│   │   ├── security.ts
│   │   ├── test.ts
│   │   ├── session.ts
│   │   ├── web.ts
│   │   ├── index-cmd.ts
│   │   └── workflow.ts
│   ├── core/              # 8 core services
│   │   ├── config.ts
│   │   ├── ai-provider.ts
│   │   ├── agent.ts
│   │   ├── plugin-manager.ts
│   │   ├── git-service.ts
│   │   ├── security-scanner.ts
│   │   ├── web-search.ts
│   │   ├── session-manager.ts
│   │   ├── test-generator.ts
│   │   ├── codebase-indexer.ts
│   │   ├── workflow-engine.ts
│   │   └── prompt-loader.ts
│   ├── ui/
│   │   ├── logger.ts
│   │   └── tui.ts
│   ├── types/
│   │   ├── config.ts
│   │   ├── plugin.ts
│   │   ├── agent.ts
│   │   └── command.ts
│   └── utils/
│       ├── file-ops.ts
│       ├── async.ts
│       └── validation.ts
│
├── plugins/               # Plugin ecosystem
│   ├── feature-development/     # Claude Code integration
│   │   ├── agents/
│   │   │   ├── code-architect.md
│   │   │   ├── code-explorer.md
│   │   │   └── code-reviewer.md
│   │   └── commands/
│   │       └── feature-dev.md
│   ├── pr-review-toolkit/       # 6 specialized agents
│   │   └── agents/
│   │       ├── comment-analyzer.md
│   │       ├── pr-test-analyzer.md
│   │       ├── silent-failure-hunter.md
│   │       ├── type-design-analyzer.md
│   │       └── code-simplifier.md
│   ├── commit-automation/       # Git workflow automation
│   ├── security-hooks/          # Real-time security validation
│   └── example-plugin/
│
├── tests/
├── config/
├── examples/
└── workflows/
```

## Configuration

Config stored at `~/.agentic/config.yaml`:

```yaml
version: '1.0.0'

aiModels:
  gpt-4:
    provider: openai
    model: gpt-4-turbo-preview
    apiKey: ${OPENAI_API_KEY}
    temperature: 0.7
  
  claude-3:
    provider: anthropic
    model: claude-3-sonnet-20240229
    apiKey: ${ANTHROPIC_API_KEY}
    temperature: 0.7

defaultModel: claude-3

plugins:
  enabled: true
  directory: ./plugins
  
  feature-development:
    explorers: 3
    architects: 3
    reviewers: 3
    auto_test: true
    auto_security: true
  
  security-hooks:
    blockOnCritical: false
    warnOnHigh: true

agents:
  maxConcurrent: 5
  timeout: 300000
  retryAttempts: 3

permissions:
  fileSystem:
    read: true
    write: true
    delete: false
  git:
    read: true
    commit: true
    push: true
    createPR: true
```

## Architecture

### Unified AI Integration

Combines Claude Code's agent system with Agentic CLI's provider abstraction:

```typescript
// Supports multiple AI providers
AIProvider
  ├── OpenAIProvider (GPT-4, GPT-3.5)
  ├── AnthropicProvider (Claude 3 Sonnet/Opus)
  ├── AzureProvider
  └── LocalProvider (Ollama, LM Studio)

// With specialized agents
Agents
  ├── code-architect
  ├── code-explorer
  ├── code-reviewer
  ├── silent-failure-hunter
  ├── pr-test-analyzer
  └── custom agents...
```

### Advanced Features Stack

```
┌─────────────────────────────────────────┐
│  CLI Commands (11 groups, 30+ commands) │
├─────────────────────────────────────────┤
│  Plugin System (5+ plugins)             │
│  - feature-development                  │
│  - pr-review-toolkit                    │
│  - commit-automation                    │
│  - security-hooks                       │
├─────────────────────────────────────────┤
│  Core Services                          │
│  - Multi-Agent Orchestration            │
│  - Security Scanner                     │
│  - Test Generator                       │
│  - Codebase Indexer                     │
│  - Web Search                           │
│  - Session Manager                      │
│  - Workflow Engine                      │
├─────────────────────────────────────────┤
│  AI Providers                           │
│  - OpenAI / Anthropic / Azure / Local   │
└─────────────────────────────────────────┘
```

## Why Agentic CLI?

### Comprehensive Feature Set
- 60+ commands covering every aspect of development
- 9 specialized AI agents for different tasks
- 5 production-ready plugins with extensible architecture
- Multiple AI provider support (not locked to one service)

### Security-First Development
- Built-in vulnerability scanning (8+ types)
- Real-time security warnings during coding
- Auto-fix capabilities for common issues
- Compliance-ready security reports

### Quality Automation
- Automated test generation with coverage analysis
- 6 specialized code review agents
- Error handling validation
- Code simplification suggestions

### Advanced Automation
- Multi-step workflow orchestration
- Session management with audit trails
- Web search for grounded answers
- Codebase indexing for fast navigation

## Development

```bash
# Development mode
npm run dev -- <command> [options]

# Watch for changes
npm run watch

# Run tests
npm test

# Lint and format
npm run lint
npm run format

# Validate before commit
bash scripts/validate.sh
```

## Documentation

- **README.md** (this file) - Overview and getting started
- **COMMAND_REFERENCE.md** - Complete command documentation  
- **FINAL_SUMMARY.md** - Project summary and statistics
- **CONTRIBUTING.md** - Contributing guidelines
- **Plugin READMEs** - Individual plugin documentation

## Plugins Included

### 1. feature-development
7-phase guided development with code-architect, code-explorer, and code-reviewer agents.

### 2. pr-review-toolkit
6 specialized review agents for comprehensive code quality analysis.

### 3. commit-automation
Streamlined git workflows with AI-generated commit messages.

### 4. security-hooks
Real-time security validation with pre-edit and pre-commit hooks.

### 5. example-plugin
Template showing plugin development best practices.

## License

MIT

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Support

- GitHub Issues: https://github.com/judeotine/Agentic-CLI/issues
- Documentation: See docs in repository
- Command Help: `agentic <command> --help`

## Technology Stack

Built with:
- **TypeScript** - Type-safe development
- **Commander.js** - CLI framework
- **Zod** - Runtime validation
- **p-queue** - Concurrency control
- **simple-git** - Git operations
- **axios** - HTTP client
- **blessed** - Terminal UI
- Multiple AI providers (OpenAI, Anthropic, Azure, Local)

**Repository**: https://github.com/judeotine/Agentic-CLI.git
