import ora, { Ora } from 'ora';
import { theme } from './theme';
import { Banner } from './banner';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

export class Logger {
  private verbose: boolean;
  private quiet: boolean;
  private useColors: boolean;
  private spinner: Ora | null = null;

  constructor(options: { verbose?: boolean; quiet?: boolean; colors?: boolean } = {}) {
    this.verbose = options.verbose || false;
    this.quiet = options.quiet || false;
    this.useColors = options.colors !== false;
  }

  showBanner(): void {
    if (!this.quiet && this.useColors) {
      Banner.displayWelcome();
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.verbose && !this.quiet) {
      console.log(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (!this.quiet) {
      console.log(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (!this.quiet) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    console.error(this.formatMessage('error', message), ...args);
  }

  success(message: string, ...args: any[]): void {
    if (!this.quiet) {
      console.log(this.formatMessage('success', message), ...args);
    }
  }

  startSpinner(text: string): void {
    if (!this.quiet) {
      this.spinner = ora({
        text: this.useColors ? theme.info(text) : text,
        color: 'cyan',
        spinner: 'dots12',
      }).start();
    }
  }

  updateSpinner(text: string): void {
    if (this.spinner) {
      this.spinner.text = text;
    }
  }

  stopSpinner(success: boolean = true, message?: string): void {
    if (this.spinner) {
      if (success) {
        this.spinner.succeed(this.useColors && message ? theme.success(message) : message);
      } else {
        this.spinner.fail(this.useColors && message ? theme.error(message) : message);
      }
      this.spinner = null;
    }
  }

  section(title: string): void {
    if (!this.quiet && this.useColors) {
      Banner.displaySection(title);
    } else if (!this.quiet) {
      console.log(`\n=== ${title.toUpperCase()} ===\n`);
    }
  }

  phase(phaseNumber: number, totalPhases: number, phaseName: string): void {
    if (!this.quiet && this.useColors) {
      Banner.displayPhase(phaseNumber, totalPhases, phaseName);
    } else if (!this.quiet) {
      console.log(`\n[Phase ${phaseNumber}/${totalPhases}] ${phaseName}\n`);
    }
  }

  bullet(text: string, level: number = 0): void {
    if (!this.quiet && this.useColors) {
      Banner.displayBullet(text, level);
    } else if (!this.quiet) {
      console.log('  '.repeat(level) + '• ' + text);
    }
  }

  box(content: string[], title?: string): void {
    if (!this.quiet && this.useColors) {
      Banner.displayBox(content, title);
    } else if (!this.quiet) {
      if (title) console.log(`\n${title}`);
      content.forEach((line) => console.log('  ' + line));
    }
  }

  agentStatus(agentName: string, status: 'idle' | 'busy' | 'error'): void {
    if (!this.quiet && this.useColors) {
      Banner.displayAgentStatus(agentName, status);
    } else if (!this.quiet) {
      console.log(`${agentName}: ${status}`);
    }
  }

  progress(current: number, total: number, label: string): void {
    if (!this.quiet && this.useColors) {
      Banner.displayProgress(current, total, label);
    } else if (!this.quiet) {
      console.log(`[${current}/${total}] ${label}`);
    }
  }

  private formatMessage(level: LogLevel, message: string): string {
    if (!this.useColors) {
      return `[${level.toUpperCase()}] ${message}`;
    }

    const timestamp = new Date().toLocaleTimeString();
    const prefix = theme.muted(`[${timestamp}]`);

    switch (level) {
      case 'debug':
        return `${prefix} ${theme.muted('DEBUG')} ${message}`;
      case 'info':
        return `${prefix} ${theme.info('INFO')} ${message}`;
      case 'warn':
        return `${prefix} ${theme.warning('WARN')} ${message}`;
      case 'error':
        return `${prefix} ${theme.error('ERROR')} ${message}`;
      case 'success':
        return `${prefix} ${theme.success('✓')} ${message}`;
      default:
        return `${prefix} ${message}`;
    }
  }

  table(data: any[]): void {
    if (!this.quiet) {
      console.table(data);
    }
  }

  json(data: any): void {
    if (!this.quiet) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  newLine(): void {
    if (!this.quiet) {
      console.log();
    }
  }

  typeCommand(command: string, _options?: { speed?: number; delay?: number }): void {
    if (this.quiet) return;
    console.log(`> ${command}`);
  }

  typeResponse(response: string, _options?: { speed?: number; color?: string }): void {
    if (this.quiet) return;
    console.log(response);
  }

  showProgress(current: number, total: number, label: string): void {
    if (this.quiet) return;
    const percentage = Math.round((current / total) * 100);
    console.log(`[${current}/${total}] ${percentage}% ${label}`);
  }

  showAgentStatus(agentName: string, status: 'idle' | 'busy' | 'thinking' | 'error' | 'complete'): void {
    if (this.quiet) return;
    console.log(`${agentName}: ${status}`);
  }
}

