import { FileOperations } from '../utils/file-ops';
import { AIProvider } from './ai-provider';

export interface SecurityIssue {
  file: string;
  line: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  description: string;
  cwe?: string;
  suggestion?: string;
  autoFixable: boolean;
}

export interface SecurityReport {
  timestamp: Date;
  filesScanned: number;
  issuesFound: number;
  issues: SecurityIssue[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export class SecurityScanner {
  private aiProvider: AIProvider;
  private patterns: Map<string, RegExp>;

  constructor(aiProvider: AIProvider) {
    this.aiProvider = aiProvider;
    this.patterns = this.initializePatterns();
  }

  private initializePatterns(): Map<string, RegExp> {
    return new Map([
      ['sql-injection', /execute.*\+.*query|exec.*\+|SELECT.*\+/gi],
      ['xss', /innerHTML.*\+|eval\(|document\.write\(/gi],
      ['hardcoded-secrets', /(password|api_key|secret|token)\s*=\s*['"][^'"]+['"]/gi],
      ['command-injection', /exec\(|spawn\(|system\(/gi],
      ['path-traversal', /\.\.\/|\.\.\\|path\.join.*\+/gi],
      ['insecure-crypto', /md5|sha1(?!256)|DES|RC4/gi],
      ['unsafe-deserialization', /eval|unserialize|pickle\.loads/gi],
    ]);
  }

  async scanFiles(files: string[]): Promise<SecurityReport> {
    const issues: SecurityIssue[] = [];
    const startTime = Date.now();

    for (const file of files) {
      try {
        const content = await FileOperations.readFile(file);
        const fileIssues = await this.scanFile(file, content);
        issues.push(...fileIssues);
      } catch (error) {
        console.error(`Error scanning ${file}:`, error);
      }
    }

    return {
      timestamp: new Date(),
      filesScanned: files.length,
      issuesFound: issues.length,
      issues,
      summary: {
        critical: issues.filter((i) => i.severity === 'critical').length,
        high: issues.filter((i) => i.severity === 'high').length,
        medium: issues.filter((i) => i.severity === 'medium').length,
        low: issues.filter((i) => i.severity === 'low').length,
      },
    };
  }

  private async scanFile(file: string, content: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    // Pattern-based detection
    for (const [type, pattern] of this.patterns.entries()) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const line = content.substring(0, match.index).split('\n').length;
        issues.push({
          file,
          line,
          severity: this.getSeverity(type),
          type,
          description: this.getDescription(type),
          suggestion: this.getSuggestion(type),
          autoFixable: this.isAutoFixable(type),
        });
      }
    }

    // AI-powered deep analysis
    if (issues.length > 0) {
      const aiIssues = await this.aiAnalysis(file, content, issues);
      issues.push(...aiIssues);
    }

    return issues;
  }

  private async aiAnalysis(
    file: string,
    content: string,
    existingIssues: SecurityIssue[]
  ): Promise<SecurityIssue[]> {
    const response = await this.aiProvider.chat([
      {
        role: 'system',
        content: `You are a security expert. Analyze code for vulnerabilities beyond basic pattern matching. Return JSON array of issues.`,
      },
      {
        role: 'user',
        content: `File: ${file}\n\nCode:\n${content.substring(0, 2000)}\n\nExisting issues: ${JSON.stringify(existingIssues)}\n\nFind additional security vulnerabilities.`,
      },
    ]);

    try {
      return JSON.parse(response.content);
    } catch {
      return [];
    }
  }

  async autoFix(issue: SecurityIssue): Promise<string | null> {
    if (!issue.autoFixable) return null;

    const content = await FileOperations.readFile(issue.file);
    const response = await this.aiProvider.chat([
      {
        role: 'system',
        content: `You are a security expert. Generate a secure fix for the vulnerability. Return only the fixed code.`,
      },
      {
        role: 'user',
        content: `Issue: ${issue.description}\nFile: ${issue.file}\nLine: ${issue.line}\n\nCode:\n${content}\n\nProvide secure fix.`,
      },
    ]);

    return response.content;
  }

  private getSeverity(type: string): 'critical' | 'high' | 'medium' | 'low' {
    const severityMap: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
      'sql-injection': 'critical',
      'command-injection': 'critical',
      'hardcoded-secrets': 'high',
      xss: 'high',
      'path-traversal': 'high',
      'insecure-crypto': 'medium',
      'unsafe-deserialization': 'high',
    };
    return severityMap[type] || 'medium';
  }

  private getDescription(type: string): string {
    const descriptions: Record<string, string> = {
      'sql-injection': 'Potential SQL injection vulnerability',
      'command-injection': 'Potential command injection vulnerability',
      'hardcoded-secrets': 'Hardcoded credentials or secrets',
      xss: 'Potential cross-site scripting (XSS) vulnerability',
      'path-traversal': 'Potential path traversal vulnerability',
      'insecure-crypto': 'Use of insecure cryptographic algorithm',
      'unsafe-deserialization': 'Unsafe deserialization of untrusted data',
    };
    return descriptions[type] || 'Security issue detected';
  }

  private getSuggestion(type: string): string {
    const suggestions: Record<string, string> = {
      'sql-injection': 'Use parameterized queries or ORM',
      'command-injection': 'Validate and sanitize all inputs',
      'hardcoded-secrets': 'Use environment variables or secret management',
      xss: 'Sanitize user input and use textContent instead of innerHTML',
      'path-traversal': 'Validate and normalize file paths',
      'insecure-crypto': 'Use SHA-256 or better',
      'unsafe-deserialization': 'Validate data before deserialization',
    };
    return suggestions[type] || 'Review and fix manually';
  }

  private isAutoFixable(type: string): boolean {
    return ['hardcoded-secrets', 'insecure-crypto'].includes(type);
  }
}

