import { Command } from 'commander';
import { CommandContext } from '../types/command';
import { SecurityScanner } from '../core/security-scanner';
import { FileOperations } from '../utils/file-ops';

export class SecurityCommand {
  register(program: Command, context: CommandContext): void {
    const security = program.command('security').description('Security scanning and analysis');

    security
      .command('scan')
      .description('Scan codebase for security vulnerabilities')
      .option('-p, --pattern <pattern>', 'File pattern to scan', '**/*.{ts,js,tsx,jsx}')
      .option('--severity <level>', 'Minimum severity level', 'low')
      .option('--auto-fix', 'Automatically fix issues when possible')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        await this.scan(options, context);
      });

    security
      .command('fix')
      .description('Auto-fix security issues')
      .argument('<file>', 'File containing the issue')
      .option('-l, --line <number>', 'Line number of the issue')
      .action(async (file: string, options) => {
        await this.fix(file, options, context);
      });

    security
      .command('report')
      .description('Generate security report')
      .option('-f, --format <format>', 'Report format: json, html, markdown', 'markdown')
      .option('-o, --output <file>', 'Output file')
      .action(async (options) => {
        await this.generateReport(options, context);
      });
  }

  private async scan(options: any, context: CommandContext): Promise<void> {
    const { logger, aiProvider, config } = context;

    try {
      logger.startSpinner('Scanning codebase for security vulnerabilities...');

      const files = await FileOperations.findFiles(
        config.workspace.root,
        options.pattern,
        config.workspace.ignorePaths
      );

      const scanner = new SecurityScanner(aiProvider);
      const report = await scanner.scanFiles(files);

      logger.stopSpinner(true, `Scan complete`);

      if (options.json) {
        logger.json(report);
        return;
      }

      logger.info(`\n🔒 Security Scan Report\n`);
      logger.info(`Files scanned: ${report.filesScanned}`);
      logger.info(`Issues found: ${report.issuesFound}\n`);

      logger.info(`Summary:`);
      logger.error(`  Critical: ${report.summary.critical}`);
      logger.warn(`  High: ${report.summary.high}`);
      logger.info(`  Medium: ${report.summary.medium}`);
      logger.debug(`  Low: ${report.summary.low}\n`);

      // Filter by severity
      const minSeverity = options.severity;
      const severityOrder = ['low', 'medium', 'high', 'critical'];
      const minIndex = severityOrder.indexOf(minSeverity);

      const filteredIssues = report.issues.filter(
        (issue) => severityOrder.indexOf(issue.severity) >= minIndex
      );

      if (filteredIssues.length === 0) {
        logger.success('✓ No security issues found at this severity level');
        return;
      }

      logger.info(`\nIssues:\n`);

      for (const issue of filteredIssues.slice(0, 20)) {
        const icon = this.getSeverityIcon(issue.severity);
        logger.info(`${icon} ${issue.file}:${issue.line}`);
        logger.info(`  ${issue.description}`);
        if (issue.suggestion) {
          logger.info(`  💡 ${issue.suggestion}`);
        }
        if (options.autoFix && issue.autoFixable) {
          logger.info(`  🔧 Auto-fixing...`);
          await scanner.autoFix(issue);
          logger.success(`  ✓ Fixed`);
        }
        logger.newLine();
      }

      if (report.issuesFound > 20) {
        logger.info(`... and ${report.issuesFound - 20} more issues`);
      }
    } catch (error) {
      logger.stopSpinner(false, 'Scan failed');
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async fix(file: string, options: any, context: CommandContext): Promise<void> {
    const { logger, aiProvider } = context;

    try {
      logger.startSpinner('Analyzing and fixing security issue...');

      const scanner = new SecurityScanner(aiProvider);
      const content = await FileOperations.readFile(file);

      // Create a synthetic issue for the line
      const issue = {
        file,
        line: parseInt(options.line) || 1,
        severity: 'high' as const,
        type: 'manual-fix',
        description: 'Security issue to be fixed',
        autoFixable: true,
      };

      const fix = await scanner.autoFix(issue);

      logger.stopSpinner(true, 'Fix generated');

      if (fix) {
        logger.info('\nProposed fix:\n');
        logger.info(fix);

        const inquirer = await import('inquirer');
        const { apply } = await inquirer.default.prompt([
          {
            type: 'confirm',
            name: 'apply',
            message: 'Apply this fix?',
            default: false,
          },
        ]);

        if (apply) {
          await FileOperations.writeFile(file, fix);
          logger.success('✓ Fix applied');
        }
      } else {
        logger.warn('No automatic fix available');
      }
    } catch (error) {
      logger.stopSpinner(false, 'Fix failed');
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private async generateReport(options: any, context: CommandContext): Promise<void> {
    const { logger, aiProvider, config } = context;

    try {
      logger.startSpinner('Generating security report...');

      const files = await FileOperations.findFiles(
        config.workspace.root,
        '**/*.{ts,js,tsx,jsx}',
        config.workspace.ignorePaths
      );

      const scanner = new SecurityScanner(aiProvider);
      const report = await scanner.scanFiles(files);

      let output: string;

      if (options.format === 'json') {
        output = JSON.stringify(report, null, 2);
      } else if (options.format === 'html') {
        output = this.generateHtmlReport(report);
      } else {
        output = this.generateMarkdownReport(report);
      }

      if (options.output) {
        await FileOperations.writeFile(options.output, output);
        logger.stopSpinner(true, `Report saved to ${options.output}`);
      } else {
        logger.stopSpinner(true, 'Report generated');
        console.log(output);
      }
    } catch (error) {
      logger.stopSpinner(false, 'Report generation failed');
      logger.error(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private generateMarkdownReport(report: any): string {
    let md = `# Security Scan Report\n\n`;
    md += `**Date**: ${report.timestamp}\n`;
    md += `**Files Scanned**: ${report.filesScanned}\n`;
    md += `**Issues Found**: ${report.issuesFound}\n\n`;

    md += `## Summary\n\n`;
    md += `- 🔴 Critical: ${report.summary.critical}\n`;
    md += `- 🟠 High: ${report.summary.high}\n`;
    md += `- 🟡 Medium: ${report.summary.medium}\n`;
    md += `- 🟢 Low: ${report.summary.low}\n\n`;

    md += `## Issues\n\n`;

    for (const issue of report.issues) {
      md += `### ${this.getSeverityIcon(issue.severity)} ${issue.type}\n\n`;
      md += `**File**: \`${issue.file}:${issue.line}\`\n`;
      md += `**Severity**: ${issue.severity}\n`;
      md += `**Description**: ${issue.description}\n`;
      if (issue.suggestion) {
        md += `**Suggestion**: ${issue.suggestion}\n`;
      }
      md += `\n`;
    }

    return md;
  }

  private generateHtmlReport(report: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Security Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .critical { color: #d32f2f; }
    .high { color: #f57c00; }
    .medium { color: #fbc02d; }
    .low { color: #388e3c; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>Security Scan Report</h1>
  <p><strong>Date:</strong> ${report.timestamp}</p>
  <p><strong>Files Scanned:</strong> ${report.filesScanned}</p>
  <p><strong>Issues Found:</strong> ${report.issuesFound}</p>
  
  <h2>Summary</h2>
  <ul>
    <li class="critical">Critical: ${report.summary.critical}</li>
    <li class="high">High: ${report.summary.high}</li>
    <li class="medium">Medium: ${report.summary.medium}</li>
    <li class="low">Low: ${report.summary.low}</li>
  </ul>
  
  <h2>Issues</h2>
  <table>
    <tr>
      <th>Severity</th>
      <th>Type</th>
      <th>File</th>
      <th>Line</th>
      <th>Description</th>
    </tr>
    ${report.issues
      .map(
        (issue: any) => `
      <tr>
        <td class="${issue.severity}">${issue.severity.toUpperCase()}</td>
        <td>${issue.type}</td>
        <td>${issue.file}</td>
        <td>${issue.line}</td>
        <td>${issue.description}</td>
      </tr>
    `
      )
      .join('')}
  </table>
</body>
</html>
    `;
  }

  private getSeverityIcon(severity: string): string {
    const icons: Record<string, string> = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢',
    };
    return icons[severity] || '⚪';
  }
}

