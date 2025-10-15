# Security Hooks Plugin

Provides automated security validation that runs before code edits and commits to catch vulnerabilities early.

## Overview

This plugin implements pre-edit and pre-commit hooks that scan for common security vulnerabilities:

- SQL Injection (CWE-89)
- Command Injection (CWE-78)
- Cross-Site Scripting / XSS (CWE-79)
- Hardcoded Secrets (CWE-798)
- Path Traversal (CWE-22)
- Weak Cryptography (CWE-327)
- Unsafe Deserialization (CWE-502)
- Code Injection (CWE-95)

## Features

- **Pre-edit validation**: Warns before writing vulnerable code
- **Pre-commit scanning**: Catches issues before they're committed
- **Pattern-based detection**: Fast regex-based vulnerability detection
- **Configurable severity**: Choose which issues to block vs warn
- **Integration with security scanner**: Works with Agentic CLI's security command

## Installation

Included by default in Agentic CLI. To enable:

```bash
agentic plugin:list
agentic plugin:enable security-hooks
```

## Configuration

```yaml
# ~/.agentic/config.yaml
plugins:
  security-hooks:
    # Block edits with critical vulnerabilities
    blockOnCritical: false
    
    # Warn on high severity issues
    warnOnHigh: true
    
    # Patterns to check
    enabled: true
    
    # Custom patterns
    customPatterns: []
```

## Usage

The plugin runs automatically:

### Pre-Edit Hook

Triggers when editing files:

```bash
$ agentic code-edit src/api/users.ts --prompt "Add user search"

[SECURITY] SQL_INJECTION
SQL Injection risk: Use parameterized queries or ORM. Never concatenate user input into SQL queries.

File: src/api/users.ts
Pattern detected: query("SELECT * FROM users WHERE name = '" + input + "'")

Fix: db.query('SELECT * FROM users WHERE name = ?', [input])

Continue anyway? (y/N)
```

### Pre-Commit Hook

Triggers before commits:

```bash
$ agentic git:commit --auto

[Security Hooks] Scanning files for security issues...
[CRITICAL] src/config.ts: hardcoded_secrets
[HIGH] src/api/auth.ts: xss_vulnerability

Found 1 critical security issues
Found 1 high-priority security warnings

Consider fixing before committing.

Continue with commit? (y/N)
```

## Security Patterns

### Critical Severity

**SQL Injection**
```typescript
// BAD
query(`SELECT * FROM users WHERE id = ${userId}`);

// GOOD
query('SELECT * FROM users WHERE id = ?', [userId]);
```

**Command Injection**
```typescript
// BAD
exec(`git log --author=${author}`);

// GOOD
execFile('git', ['log', `--author=${author}`]);
```

**Hardcoded Secrets**
```typescript
// BAD
const apiKey = 'sk-1234567890abcdef';

// GOOD
const apiKey = process.env.API_KEY;
```

### High Severity

**XSS**
```typescript
// BAD
element.innerHTML = userInput;

// GOOD
element.textContent = userInput;
// or
element.innerHTML = DOMPurify.sanitize(userInput);
```

**Path Traversal**
```typescript
// BAD
const file = path.join(baseDir, userPath);

// GOOD
const file = path.join(baseDir, path.normalize(userPath));
if (!file.startsWith(baseDir)) throw new Error('Invalid path');
```

## Integration with Agentic CLI

Works seamlessly with other features:

### Security Command
```bash
# Comprehensive security scan
agentic security scan

# Hooks provide real-time warnings
# Scanner provides detailed analysis
```

### Code Review
```bash
# Hooks warn during development
# code-reviewer agent validates in review
agentic agent:run code-reviewer "Review security"
```

### Workflow Integration
```json
{
  "hooks": {
    "pre-commit": [
      {
        "plugin": "security-hooks",
        "blockOnCritical": true
      }
    ]
  }
}
```

## Extending Patterns

Add custom security patterns:

```typescript
// In plugin configuration
{
  "customPatterns": [
    {
      "ruleName": "custom_vulnerability",
      "substrings": ["dangerousFunction("],
      "reminder": "Avoid using dangerousFunction()",
      "severity": "high"
    }
  ]
}
```

## Disabling Hooks

Temporarily disable for trusted operations:

```bash
# Disable security hooks for one command
AGENTIC_SKIP_SECURITY_HOOKS=1 agentic code-edit file.ts

# Or in config
plugins:
  security-hooks:
    enabled: false
```

## Best Practices

1. **Fix critical issues immediately**: Don't commit code with critical vulnerabilities
2. **Review warnings**: High-severity warnings should also be addressed
3. **Use with security scanner**: Combine hooks with full security scans
4. **Customize for your stack**: Add patterns specific to your technologies
5. **Educate team**: Use warnings as learning opportunities

## Troubleshooting

### Too Many False Positives

Adjust severity thresholds or disable specific patterns:

```yaml
plugins:
  security-hooks:
    patterns:
      eval_injection:
        enabled: false  # If you have legitimate use of eval
```

### Hooks Not Running

Check plugin status:
```bash
agentic plugin:list
agentic plugin:info security-hooks
```

## License

MIT

## Security Pattern Detection

Advanced pattern detection system with configurable severity levels and automated remediation.

