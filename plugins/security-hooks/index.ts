import { Plugin, PluginContext } from '../../src/types/plugin';

/**
 * Security Hooks Plugin
 * 
 * Provides pre-edit and pre-commit hooks that check for security vulnerabilities
 */

interface SecurityPattern {
  ruleName: string;
  pathCheck?: (path: string) => boolean;
  substrings?: string[];
  reminder: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

const SECURITY_PATTERNS: SecurityPattern[] = [
  {
    ruleName: 'github_actions_workflow',
    pathCheck: (path) => path.includes('.github/workflows/') && (path.endsWith('.yml') || path.endsWith('.yaml')),
    reminder: `GitHub Actions workflow security risk detected:

1. Command Injection: Never use untrusted input directly in run: commands
2. Use environment variables: Instead of \${{ github.event.issue.title }}, use env: with proper quoting
3. Review guide: https://github.blog/security/vulnerability-research/how-to-catch-github-actions-workflow-injections-before-attackers-do/

UNSAFE: run: echo "\${{ github.event.issue.title }}"
SAFE: env: TITLE: \${{ github.event.issue.title }}
      run: echo "$TITLE"`,
    severity: 'critical'
  },
  {
    ruleName: 'sql_injection',
    substrings: ['execute(', 'query(', 'SELECT * FROM'],
    reminder: 'SQL Injection risk: Use parameterized queries or ORM. Never concatenate user input into SQL queries.',
    severity: 'critical'
  },
  {
    ruleName: 'command_injection',
    substrings: ['child_process.exec', 'exec(', 'execSync(', 'system(', 'os.system'],
    reminder: 'Command injection risk: Use execFile instead of exec, or validate/sanitize all inputs. Never pass user input directly to shell commands.',
    severity: 'critical'
  },
  {
    ruleName: 'eval_injection',
    substrings: ['eval(', 'new Function('],
    reminder: 'Code injection risk: eval() and new Function() execute arbitrary code. Use JSON.parse() for data or alternative approaches.',
    severity: 'high'
  },
  {
    ruleName: 'xss_vulnerability',
    substrings: ['dangerouslySetInnerHTML', 'innerHTML =', 'document.write('],
    reminder: 'XSS vulnerability risk: Sanitize all user input before rendering HTML. Use textContent or a sanitization library like DOMPurify.',
    severity: 'high'
  },
  {
    ruleName: 'hardcoded_secrets',
    substrings: ['password =', 'api_key =', 'secret =', 'token ='],
    reminder: 'Hardcoded secrets detected: Use environment variables or secret management systems. Never commit credentials to version control.',
    severity: 'critical'
  },
  {
    ruleName: 'insecure_crypto',
    substrings: ['md5(', 'sha1(', 'DES', 'RC4'],
    reminder: 'Insecure cryptography: MD5 and SHA1 are broken. Use SHA-256 or better. Avoid DES and RC4.',
    severity: 'high'
  },
  {
    ruleName: 'unsafe_deserialization',
    substrings: ['pickle.loads', 'unserialize(', 'yaml.load('],
    reminder: 'Unsafe deserialization: Can lead to remote code execution. Use safe alternatives like JSON or yaml.safe_load().',
    severity: 'critical'
  },
  {
    ruleName: 'path_traversal',
    substrings: ['../', '..\\'],
    reminder: 'Path traversal risk: Validate and normalize file paths. Use path.resolve() and check paths stay within allowed directories.',
    severity: 'high'
  }
];

function checkSecurityPatterns(filePath: string, content: string): { ruleName: string; reminder: string; severity: string } | null {
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  for (const pattern of SECURITY_PATTERNS) {
    // Check path-based patterns
    if (pattern.pathCheck && pattern.pathCheck(normalizedPath)) {
      return { ruleName: pattern.ruleName, reminder: pattern.reminder, severity: pattern.severity };
    }
    
    // Check content-based patterns
    if (pattern.substrings && content) {
      for (const substring of pattern.substrings) {
        if (content.includes(substring)) {
          return { ruleName: pattern.ruleName, reminder: pattern.reminder, severity: pattern.severity };
        }
      }
    }
  }
  
  return null;
}

const plugin: Plugin = {
  manifest: require('./manifest.json'),
  
  hooks: new Map([
    ['pre-edit', {
      name: 'pre-edit',
      async execute(data: any, context: PluginContext) {
        const { logger } = context;
        
        // Check for security patterns
        const issue = checkSecurityPatterns(data.file, data.content || '');
        
        if (issue) {
          if (issue.severity === 'critical') {
            logger.error(`[SECURITY] ${issue.ruleName.toUpperCase()}`);
            logger.error(issue.reminder);
            
            // Optionally block the edit
            if (context.config.plugins?.['security-hooks']?.blockOnCritical) {
              throw new Error('Critical security issue detected. Edit blocked.');
            }
          } else if (issue.severity === 'high') {
            logger.warn(`[SECURITY] ${issue.ruleName.toUpperCase()}`);
            logger.warn(issue.reminder);
          }
        }
        
        return data;
      }
    }],
    ['pre-commit', {
      name: 'pre-commit',
      async execute(data: any, context: PluginContext) {
        const { logger, utils } = context;
        
        logger.info('[Security Hooks] Scanning files for security issues...');
        
        // Get staged files
        const stagedFiles = await utils.exec('git diff --cached --name-only');
        const files = stagedFiles.trim().split('\n').filter(Boolean);
        
        let criticalIssues = 0;
        let highIssues = 0;
        
        for (const file of files) {
          try {
            const content = await utils.readFile(file);
            const issue = checkSecurityPatterns(file, content);
            
            if (issue) {
              if (issue.severity === 'critical') {
                criticalIssues++;
                logger.error(`[CRITICAL] ${file}: ${issue.ruleName}`);
              } else if (issue.severity === 'high') {
                highIssues++;
                logger.warn(`[HIGH] ${file}: ${issue.ruleName}`);
              }
            }
          } catch (error) {
            // File might not exist or unreadable
          }
        }
        
        if (criticalIssues > 0) {
          logger.error(`Found ${criticalIssues} critical security issues`);
          logger.warn('Consider fixing before committing');
        }
        
        if (highIssues > 0) {
          logger.warn(`Found ${highIssues} high-priority security warnings`);
        }
        
        return data;
      }
    }]
  ]),
  
  async initialize(context: PluginContext) {
    context.logger.info('Security Hooks plugin initialized');
    context.logger.info('  → Monitoring: SQL injection, XSS, command injection, secrets');
    context.logger.info('  → Hooks: pre-edit, pre-commit');
  },
  
  async cleanup() {
    console.log('Security Hooks plugin cleanup');
  }
};

export default plugin;

