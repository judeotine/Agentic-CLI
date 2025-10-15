# Feature Development Command

**Command**: `feature-dev`  
**Aliases**: `fd`  
**Description**: Guided feature development with codebase understanding and architecture focus

## Overview

The feature-dev command provides a systematic, multi-phase approach to implementing new features:

1. **Discovery**: Understand what needs to be built
2. **Exploration**: Deep codebase analysis with parallel agents
3. **Clarification**: Ask all questions before committing to design
4. **Architecture**: Design with multiple approaches and trade-offs
5. **Implementation**: Build following chosen architecture
6. **Review**: Quality assurance with specialized reviewers
7. **Summary**: Document what was accomplished

## Usage

```bash
# Start feature development
agentic feature-dev "Add user authentication"

# With detailed description
agentic feature-dev "Implement OAuth2 login with Google and GitHub providers"

# Interactive mode (asks questions before proceeding)
agentic feature-dev --interactive

# Dry-run mode (plan without implementing)
agentic feature-dev --dry-run "Add payment processing"
```

## Phase Breakdown

### Phase 1: Discovery
- Understand the feature request
- Ask clarifying questions if needed
- Create comprehensive todo list
- Confirm understanding with user

### Phase 2: Codebase Exploration
- Launch 2-3 code-explorer agents in parallel
- Each agent focuses on different aspect:
  - Similar existing features
  - Architectural patterns
  - UI/UX patterns
  - Testing approaches
- Read all key files identified by agents
- Present comprehensive findings summary

### Phase 3: Clarifying Questions
**CRITICAL PHASE - ALWAYS EXECUTE**

Identify all underspecified aspects:
- Edge cases and boundary conditions
- Error handling strategies
- Integration points with existing code
- Scope boundaries and limitations
- Design preferences and patterns
- Backward compatibility requirements
- Performance and scalability needs

Present all questions in organized list format.
Wait for complete user answers before proceeding to architecture phase.

### Phase 4: Architecture Design
- Launch 2-3 code-architect agents with different focuses:
  - Minimal changes (smallest change, maximum reuse)
  - Clean architecture (maintainability, elegant abstractions)
  - Pragmatic balance (speed + quality)
- Review all approaches
- Present trade-offs comparison
- Provide recommendation
- Ask user to choose approach

### Phase 5: Implementation
**REQUIRES USER APPROVAL**

- Read all relevant files
- Implement following chosen architecture
- Follow codebase conventions strictly
- Write clean, documented code
- Update todos throughout

### Phase 6: Quality Review
- Launch 3 code-reviewer agents in parallel:
  - Simplicity/DRY/elegance
  - Bugs/functional correctness
  - Project conventions/abstractions
- Consolidate findings
- Present highest severity issues
- Ask user what to fix
- Address issues per user decision

### Phase 7: Summary
- Mark all todos complete
- Summarize what was built
- Document key decisions
- List files modified
- Suggest next steps

## Advanced Integration Features

This command seamlessly integrates with Agentic CLI's advanced capabilities:

**Security Integration**
- Automatic vulnerability scanning after implementation
- Real-time security warnings during coding
- Auto-fix for common security issues

**Test Integration**
- Generate comprehensive test suites automatically
- Analyze coverage and suggest improvements
- Auto-augment tests for better coverage

**Web Search Integration**
- Agents search for best practices and documentation
- Find code examples from across the web
- Get grounded answers for implementation decisions

**Session Management**
- Track entire development session with full context
- Export sessions for documentation
- Audit log for compliance

**Workflow Automation**
- Execute complete development workflows
- Conditional steps based on results
- Parallel execution for speed

**Git Integration**
- Auto-commit with descriptive messages
- Create PRs automatically
- Branch management

## Configuration

Can be configured in `~/.agentic/config.yaml`:

```yaml
feature_dev:
  # Number of explorer agents to launch
  explorers: 3
  
  # Number of architect agents to launch
  architects: 3
  
  # Number of reviewer agents to launch
  reviewers: 3
  
  # Auto-generate tests
  auto_test: true
  
  # Auto-run security scan
  auto_security: true
  
  # Create git commit after implementation
  auto_commit: false
  
  # AI model to use for agents
    agent_model: anthropic  # any configured model: anthropic, gpt-4, local-llm
```

## Example Session

```bash
$ agentic feature-dev "Add email verification"

Phase 1: Discovery
✓ Created todo list with 7 phases
✓ Understanding confirmed

Phase 2: Codebase Exploration
→ Launching 3 code-explorer agents...
✓ Agent 1: Found similar SMS verification
✓ Agent 2: Mapped auth architecture
✓ Agent 3: Identified notification patterns
→ Reading 12 key files...
✓ Comprehensive summary generated

Phase 3: Clarifying Questions
? How long should verification codes be valid? 24 hours
? Should we rate-limit verification emails? Yes, 3 per hour
? What happens to unverified accounts after 7 days? Delete them

Phase 4: Architecture Design
→ Launching 3 code-architect agents...
✓ Approach A: Minimal changes (reuse SMS system)
✓ Approach B: Clean architecture (new email service)
✓ Approach C: Pragmatic balance (extend notification system)
→ Recommendation: Approach C
? Which approach do you prefer? C

Phase 5: Implementation
→ Implementing email verification...
✓ Created src/auth/email-verify.ts
✓ Updated src/auth/service.ts
✓ Added src/events/email-verified.ts
✓ Updated database schema

Phase 6: Quality Review
→ Launching 3 code-reviewer agents...
✓ No critical issues found
✓ 2 minor suggestions
? Fix suggestions now? No

Phase 7: Summary
✓ Email verification implemented
✓ Key decisions documented
✓ 4 files modified
→ Next steps: Add tests, update documentation
```

## Tips for Best Results

1. **Be specific in initial request**: "Add OAuth2 with Google and GitHub" vs "Add login"
2. **Answer all clarifying questions**: Helps avoid wrong assumptions
3. **Review architecture options carefully**: Consider long-term maintainability
4. **Let agents explore first**: Don't skip codebase exploration
5. **Use with other commands**: Combine with security scan, test generation, etc.

## Advanced Usage

### Parallel with Other Commands

```bash
# Feature development + security + tests
agentic feature-dev "Add API rate limiting" && \
  agentic security scan && \
  agentic test generate src/api/rate-limit.ts
```

### Custom Agent Configuration

```bash
# Use more explorers for complex codebases
agentic feature-dev --explorers=5 "Refactor authentication system"

# Skip exploration if you know the codebase well
agentic feature-dev --skip-exploration "Fix typo in error message"
```

### Integration with Workflows

```yaml
# workflows/feature-workflow.json
{
  "name": "complete-feature-development",
  "steps": [
    {
      "id": "develop",
      "type": "command",
      "config": {
        "command": "agentic feature-dev \"$FEATURE\""
      }
    },
    {
      "id": "test",
      "type": "command",
      "config": {
        "command": "agentic test generate --coverage 90"
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
      "id": "commit",
      "type": "command",
      "config": {
        "command": "agentic git:commit --auto"
      }
    }
  ]
}
```

