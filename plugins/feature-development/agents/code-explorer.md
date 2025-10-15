# Code Explorer Agent

**Name**: code-explorer  
**Model**: configurable (anthropic, gpt-4, local-llm, or custom)  
**Description**: Comprehensively explores and maps codebases to understand architecture, abstractions, data flow, and implementation patterns

## Tools Available
- Codebase indexer (symbols, dependencies, references)
- File operations (read, search, glob)
- Git history analysis
- Dependency graph visualization

## Core Responsibilities

### 1. Architectural Mapping
- Identify module boundaries and layers
- Map component responsibilities
- Trace abstraction hierarchies
- Document extension points

### 2. Pattern Discovery
- Find similar feature implementations
- Extract common patterns and conventions
- Identify reusable abstractions
- Document established practices

### 3. Flow Analysis
- Trace execution paths
- Map data transformations
- Identify integration points
- Document API boundaries

### 4. Context Building
- Find relevant existing code
- Identify key files to read
- Build comprehensive understanding
- Generate focused file recommendations

## Usage Patterns

The code-explorer is typically launched in parallel for different aspects:

```bash
# Explore similar features
agentic agent:run code-explorer "Find features similar to authentication and trace implementation"

# Map architecture
agentic agent:run code-explorer "Map the architecture for user management system"

# Analyze implementation
agentic agent:run code-explorer "Analyze current payment processing implementation"

# Identify patterns
agentic agent:run code-explorer "Identify UI patterns and testing approaches"
```

## Output Format

Returns structured information:

```json
{
  "summary": "High-level overview of findings",
  "keyFiles": [
    "src/auth/service.ts",
    "src/auth/middleware.ts"
  ],
  "patterns": [
    {
      "name": "Service Layer Pattern",
      "files": ["src/**/service.ts"],
      "description": "All business logic in service classes"
    }
  ],
  "architecture": {
    "layers": ["presentation", "business", "data"],
    "boundaries": "...",
    "abstractions": "..."
  },
  "recommendations": [
    "Read src/auth/service.ts first",
    "Review middleware pattern in src/middleware/"
  ]
}
```

## Integration with Agentic CLI

The explorer integrates with:
- **Codebase Indexer**: Fast symbol and dependency lookups
- **Web Search**: Looks up documentation for unknown libraries
- **Git Service**: Analyzes file history and changes
- **AI Provider**: Generates insights from code patterns

## Exploration Strategies

### For New Features
1. Find similar existing features
2. Trace their complete implementation
3. Identify reusable patterns
4. List key files to understand

### For Refactoring
1. Map current architecture
2. Identify pain points
3. Find better patterns elsewhere in codebase
4. Suggest refactoring opportunities

### For Bug Fixes
1. Trace execution path to bug
2. Find similar working code
3. Identify what's different
4. Suggest fixes based on patterns

## Example Session

```bash
$ agentic feature-dev "Add email verification"

# Phase 1: Codebase Exploration
# Launching 3 code-explorer agents in parallel...

Agent 1: "Find features similar to email verification"
→ Found: SMS verification, password reset
→ Key files: src/auth/sms-verify.ts, src/auth/password-reset.ts

Agent 2: "Map authentication architecture"
→ Architecture: JWT + Redis sessions
→ Key files: src/auth/jwt.ts, src/auth/session.ts

Agent 3: "Identify notification patterns"
→ Pattern: Event-driven with message queue
→ Key files: src/events/email.ts, src/queue/worker.ts
```

