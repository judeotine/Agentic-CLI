# Feature Development Plugin

A comprehensive plugin for guided feature development that combines codebase exploration, architecture design, and quality review through specialized AI agents.

## Overview

This plugin provides a systematic 7-phase approach to implementing features:

1. **Discovery** - Understand requirements
2. **Exploration** - Deep codebase analysis
3. **Clarification** - Resolve all ambiguities
4. **Architecture** - Design with trade-offs
5. **Implementation** - Build the feature
6. **Review** - Quality assurance
7. **Summary** - Document completion

## Agents Included

### code-architect
Designs feature architectures by analyzing existing patterns and providing comprehensive implementation blueprints.

**When to use:**
- Planning new features
- Refactoring existing code
- Need architecture guidance

### code-explorer
Comprehensively explores codebases to understand architecture, patterns, and implementation approaches.

**When to use:**
- Working in unfamiliar codebase
- Finding similar implementations
- Understanding system architecture

### code-reviewer
Reviews code for bugs, security issues, and convention compliance with confidence-based filtering.

**When to use:**
- Before committing changes
- Creating pull requests
- After feature implementation

## Installation

The plugin is included by default in Agentic CLI. To enable:

```bash
agentic plugin:list
agentic plugin:enable feature-development
```

## Usage

### Basic Feature Development

```bash
agentic feature-dev "Add user authentication"
```

### With Options

```bash
# Interactive mode (asks before each phase)
agentic feature-dev --interactive "Implement OAuth2"

# Dry-run (plan without implementing)
agentic feature-dev --dry-run "Add payment processing"

# Custom number of explorer agents
agentic feature-dev --explorers=5 "Refactor database layer"
```

### Individual Agent Usage

```bash
# Use code-architect directly
agentic agent:run code-architect "Design email verification system"

# Use code-explorer directly
agentic agent:run code-explorer "Find authentication patterns"

# Use code-reviewer directly
agentic agent:run code-reviewer "Review recent changes"
```

## Integration with Agentic CLI Features

This plugin seamlessly integrates with all Agentic CLI features:

### Security Scanning
```bash
agentic feature-dev "Add API endpoints" --security-scan
```

### Test Generation
```bash
agentic feature-dev "Add user service" --generate-tests
```

### Web Search
Agents automatically use web search to find best practices and documentation.

### Session Management
All feature development is tracked in sessions for audit and resume capability.

### Workflow Automation
Can be part of automated workflows.

## Configuration

Configure in `~/.agentic/config.yaml`:

```yaml
plugins:
  feature-development:
    # Number of parallel explorers
    explorers: 3
    
    # Number of parallel architects
    architects: 3
    
    # Number of parallel reviewers
    reviewers: 3
    
    # Auto-generate tests after implementation
    auto_test: true
    
    # Auto-run security scan
    auto_security: true
    
    # Auto-commit after successful implementation
    auto_commit: false
    
    # Model for agents
    agent_model: anthropic  # or gpt-4, or any configured model
```

## Example Workflow

```
$ agentic feature-dev "Add email verification"

=== Phase 1: Discovery ===
✓ Understanding feature requirements
✓ Creating todo list

=== Phase 2: Codebase Exploration ===
→ Launching 3 code-explorer agents in parallel
✓ Agent 1: Found similar SMS verification pattern
✓ Agent 2: Mapped authentication architecture
✓ Agent 3: Identified notification patterns
→ Reading 12 key files for context
✓ Generated comprehensive exploration summary

=== Phase 3: Clarifying Questions ===
? How long should verification tokens be valid? 24 hours
? Should we rate-limit verification emails? Yes, 3 per hour
? What happens to unverified users? Delete after 7 days
✓ All questions answered

=== Phase 4: Architecture Design ===
→ Launching 3 code-architect agents
✓ Approach A: Minimal (reuse SMS system) - Fast, less flexible
✓ Approach B: Clean (new email service) - Elegant, more work
✓ Approach C: Pragmatic (extend notifications) - Balanced
→ Recommendation: Approach C
? Which approach? C

=== Phase 5: Implementation ===
✓ User approved: Proceeding with Approach C
→ Creating src/auth/email-verification.ts
→ Updating src/notifications/email-sender.ts
→ Adding database migration
→ Updating API routes
✓ Implementation complete

=== Phase 6: Quality Review ===
→ Launching 3 code-reviewer agents
✓ Simplicity review: No issues
✓ Bugs review: 1 edge case found (handled)
✓ Conventions review: All good
✓ No critical issues

=== Phase 7: Summary ===
✓ Email verification implemented
✓ 5 files created/modified
✓ Architecture: Event-driven with notification system
✓ Security: Rate-limited, time-bounded tokens
✓ Next steps: Add tests, update documentation

Feature development complete! 🎉
```

## Hooks

The plugin provides hooks that run automatically:

### pre-edit
Validates edits against project conventions before applying.

### post-edit
Tracks all edits for the feature development session.

### pre-commit
Runs code-reviewer automatically before committing changes.

## Tips for Best Results

1. **Be specific**: "Add OAuth2 with Google" vs "Add login"
2. **Answer questions**: Clarifying phase is critical
3. **Review options**: Consider long-term maintainability
4. **Let agents explore**: Don't skip exploration phase
5. **Use with other features**: Combine with security, tests, etc.

## Advanced Usage

### Custom Workflows

Create a workflow that includes feature development:

```json
{
  "name": "complete-feature",
  "steps": [
    {
      "id": "develop",
      "type": "command",
      "config": {
        "command": "agentic feature-dev \"$FEATURE\""
      }
    },
    {
      "id": "security",
      "type": "command",
      "config": {
        "command": "agentic security scan --auto-fix"
      }
    },
    {
      "id": "tests",
      "type": "command",
      "config": {
        "command": "agentic test generate --coverage 85"
      }
    },
    {
      "id": "commit",
      "type": "command",
      "config": {
        "command": "agentic git:commit --auto"
      }
    }
  ]
}
```

### Integration with CI/CD

```yaml
# .github/workflows/feature-dev.yml
name: Feature Development Review

on: [pull_request]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install Agentic CLI
        run: npm install -g @your-org/agentic-cli
      - name: Run Code Review
        run: agentic agent:run code-reviewer "Review PR changes"
```

## Troubleshooting

### Agents Not Launching
**Problem**: Agents don't seem to start  
**Solution**: Check that the plugin is enabled: `agentic plugin:list`

### Exploration Takes Too Long
**Problem**: Codebase exploration is slow  
**Solution**: Reduce number of explorers: `--explorers=2` or skip for small changes: `--skip-exploration`

### Questions Not Answered
**Problem**: Stuck in clarification phase  
**Solution**: Answer all questions or use `--auto-answer` to use defaults

## Contributing

To extend this plugin:

1. Add new agents in `agents/` directory
2. Update manifest.json with agent names
3. Add agent documentation in markdown
4. Update README with usage examples

## License

MIT

---

**Quick Start**: `agentic feature-dev "your feature description"`

