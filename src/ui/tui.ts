import blessed from 'blessed';

export class TUI {
  private screen: blessed.Widgets.Screen;
  private logBox: blessed.Widgets.Log;
  private statusBox: blessed.Widgets.BoxElement;
  private agentBox: blessed.Widgets.BoxElement;
  private progressBox: blessed.Widgets.ProgressBarElement;
  private titleBox: blessed.Widgets.BoxElement;

  constructor() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Agentic CLI - AI-Powered Development',
      fullUnicode: true,
    });

    // Title bar
    this.titleBox = blessed.box({
      parent: this.screen,
      top: 0,
      left: 0,
      width: '100%',
      height: 3,
      content: this.getTitleContent(),
      tags: true,
      style: {
        fg: 'cyan',
        bg: '#1a1a2e',
        bold: true,
      },
    });

    // Main log panel
    this.logBox = blessed.log({
      parent: this.screen,
      top: 3,
      left: 0,
      width: '60%',
      height: '70%-3',
      border: {
        type: 'line',
        fg: '#00d9ff',
      },
      label: {
        text: ' Command Log ',
        side: 'left',
      },
      tags: true,
      scrollable: true,
      mouse: true,
      keys: true,
      vi: true,
      style: {
        fg: 'white',
        bg: '#0f0f1e',
        border: {
          fg: '#00d9ff',
        },
        scrollbar: {
          bg: '#9d4edd',
          fg: '#00d9ff',
        },
      },
      scrollbar: {
        ch: '█',
        track: {
          bg: '#1a1a2e',
        },
        style: {
          fg: '#00d9ff',
          bg: '#1a1a2e',
        },
      },
    });

    // Agent status panel
    this.agentBox = blessed.box({
      parent: this.screen,
      top: 3,
      left: '60%',
      width: '40%',
      height: '35%-3',
      border: {
        type: 'line',
        fg: '#9d4edd',
      },
      label: {
        text: ' Agent Status ',
        side: 'left',
      },
      tags: true,
      scrollable: true,
      style: {
        fg: 'white',
        bg: '#0f0f1e',
        border: {
          fg: '#9d4edd',
        },
      },
    });

    // System status panel
    this.statusBox = blessed.box({
      parent: this.screen,
      top: '35%',
      left: '60%',
      width: '40%',
      height: '35%',
      border: {
        type: 'line',
        fg: '#06ffa5',
      },
      label: {
        text: ' System Status ',
        side: 'left',
      },
      tags: true,
      scrollable: true,
      style: {
        fg: 'white',
        bg: '#0f0f1e',
        border: {
          fg: '#06ffa5',
        },
      },
    });

    // Progress bar
    this.progressBox = blessed.progressbar({
      parent: this.screen,
      top: '70%',
      left: 0,
      width: '100%',
      height: 3,
      border: {
        type: 'line',
        fg: '#ffb627',
      },
      label: {
        text: ' Overall Progress ',
        side: 'left',
      },
      filled: 0,
      style: {
        fg: 'white',
        bg: '#0f0f1e',
        border: {
          fg: '#ffb627',
        },
        bar: {
          bg: '#00d9ff',
          fg: '#00d9ff',
        },
      },
    });

    // Help footer
    const helpBox = blessed.box({
      parent: this.screen,
      bottom: 0,
      left: 0,
      width: '100%',
      height: 1,
      content: '{cyan-fg}[Q]{/cyan-fg} Quit  {cyan-fg}[↑↓]{/cyan-fg} Scroll  {cyan-fg}[Tab]{/cyan-fg} Switch Panels',
      tags: true,
      style: {
        fg: 'white',
        bg: '#1a1a2e',
      },
    });

    // Key bindings
    this.screen.key(['escape', 'q', 'C-c'], () => {
      return process.exit(0);
    });

    this.screen.key(['tab'], () => {
      this.screen.focusNext();
    });

    this.screen.key(['S-tab'], () => {
      this.screen.focusPrevious();
    });

    this.render();
  }

  private getTitleContent(): string {
    return [
      '',
      '  {#00d9ff-fg}{bold}AGENTIC CLI{/bold}{/#00d9ff-fg} {#9d4edd-fg}»{/#9d4edd-fg} {#06ffa5-fg}AI-Powered Development Automation{/#06ffa5-fg}',
      '',
    ].join('\n');
  }

  log(message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info'): void {
    const colors = {
      info: '#4ea8de',
      warn: '#ffb627',
      error: '#ff006e',
      success: '#06ffa5',
    };

    const icons = {
      info: 'ℹ',
      warn: '⚠',
      error: '✗',
      success: '✓',
    };

    const color = colors[level];
    const icon = icons[level];
    const timestamp = new Date().toLocaleTimeString();

    this.logBox.log(
      `{#666-fg}${timestamp}{/#666-fg} {${color}-fg}${icon}{/${color}-fg} ${message}`
    );
    this.screen.render();
  }

  updateAgentStatus(agents: Array<{ name: string; status: string; task?: string }>): void {
    const statusColors = {
      idle: '#666',
      busy: '#fb5607',
      error: '#ff006e',
      completed: '#06ffa5',
    };

    const statusIcons = {
      idle: '○',
      busy: '◉',
      error: '⊗',
      completed: '✓',
    };

    const content = agents
      .map((agent) => {
        const color = statusColors[agent.status as keyof typeof statusColors] || '#666';
        const icon = statusIcons[agent.status as keyof typeof statusIcons] || '○';
        const task = agent.task ? `\n    {#666-fg}Task: ${agent.task}{/#666-fg}` : '';
        return `{${color}-fg}${icon}{/${color}-fg} {#00d9ff-fg}${agent.name}{/#00d9ff-fg} {#9d4edd-fg}[${agent.status}]{/#9d4edd-fg}${task}`;
      })
      .join('\n\n');

    this.agentBox.setContent(content);
    this.screen.render();
  }

  updateStatus(content: string): void {
    this.statusBox.setContent(content);
    this.screen.render();
  }

  updateSystemStatus(stats: {
    filesModified?: number;
    testsGenerated?: number;
    vulnerabilities?: number;
    activeAgents?: number;
  }): void {
    const content = [
      '',
      `{#00d9ff-fg}Files Modified:{/#00d9ff-fg} {#06ffa5-fg}${stats.filesModified || 0}{/#06ffa5-fg}`,
      `{#00d9ff-fg}Tests Generated:{/#00d9ff-fg} {#06ffa5-fg}${stats.testsGenerated || 0}{/#06ffa5-fg}`,
      `{#00d9ff-fg}Vulnerabilities:{/#00d9ff-fg} {${stats.vulnerabilities ? '#ff006e' : '#06ffa5'}-fg}${stats.vulnerabilities || 0}{/${stats.vulnerabilities ? '#ff006e' : '#06ffa5'}-fg}`,
      `{#00d9ff-fg}Active Agents:{/#00d9ff-fg} {#9d4edd-fg}${stats.activeAgents || 0}{/#9d4edd-fg}`,
      '',
    ].join('\n');

    this.statusBox.setContent(content);
    this.screen.render();
  }

  updateProgress(percent: number): void {
    this.progressBox.setProgress(percent);
    this.screen.render();
  }

  clear(): void {
    this.logBox.setContent('');
    this.screen.render();
  }

  render(): void {
    this.screen.render();
  }

  destroy(): void {
    this.screen.destroy();
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
}
