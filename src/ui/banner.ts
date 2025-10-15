import { theme } from './theme';

export class Banner {
  static displayWelcome(): void {
    const width = 70;
    const border = theme.primary('═'.repeat(width));
    
    console.log('\n' + border);
    console.log(theme.primary('║') + ' '.repeat(width - 2) + theme.primary('║'));
    
    const title = [
      '     ___                    __  _         ________    ____',
      '    /   |  ____ ____  ____  / /_(_)____   / ____/ /   /  _/',
      '   / /| | / __ `/ _ \\/ __ \\/ __/ / ___/  / /   / /    / /  ',
      '  / ___ |/ /_/ /  __/ / / / /_/ / /__   / /___/ /____/ /   ',
      ' /_/  |_|\\__, /\\___/_/ /_/\\__/_/\\___/   \\____/_____/___/   ',
      '        /____/                                              ',
    ];
    
    title.forEach((line) => {
      console.log(line);
    });
    
    console.log(theme.primary('║') + ' '.repeat(width - 2) + theme.primary('║'));
    
    const tagline = 'AI-Powered Development Automation';
    console.log(tagline);
    
    console.log(theme.primary('║') + ' '.repeat(width - 2) + theme.primary('║'));
    console.log(border);
    
    console.log('  Version: 0.1.0');
    console.log('  Repository: github.com/judeotine/Agentic-CLI');
    console.log('  Commands: 60+ | Agents: 9+ | Plugins: 5');
    console.log('');
  }

  static displayCommand(command: string, description: string): void {
    console.log(theme.primary('▸ ') + theme.highlight(command));
    console.log('  ' + theme.muted(description));
  }

  static displaySection(title: string): void {
    console.log('\n' + theme.secondary('▔'.repeat(50)));
    console.log(theme.primary('● ') + theme.highlight(title.toUpperCase()));
    console.log(theme.secondary('▁'.repeat(50)) + '\n');
  }

  static displaySuccess(message: string): void {
    console.log(theme.success('✓ ') + message);
  }

  static displayError(message: string): void {
    console.log(theme.error('✗ ') + message);
  }

  static displayWarning(message: string): void {
    console.log(theme.warning('⚠ ') + message);
  }

  static displayInfo(message: string): void {
    console.log(theme.info('ℹ ') + message);
  }

  static displayProgress(current: number, total: number, label: string): void {
    const percentage = Math.floor((current / total) * 100);
    const barLength = 40;
    const filled = Math.floor((current / total) * barLength);
    const empty = barLength - filled;
    
    const bar = theme.primary('█'.repeat(filled)) + theme.muted('░'.repeat(empty));
    const percent = theme.highlight(`${percentage}%`);
    
    console.log(`${bar} ${percent} ${theme.muted(label)}`);
  }

  static displayAgentStatus(agentName: string, status: 'idle' | 'busy' | 'error'): void {
    const statusColors = {
      idle: theme.muted,
      busy: theme.accent,
      error: theme.error,
    };
    
    const statusIcons = {
      idle: '○',
      busy: '◉',
      error: '⊗',
    };
    
    const statusColor = statusColors[status];
    const icon = statusIcons[status];
    
    console.log(statusColor(icon) + ' ' + theme.info(agentName) + ' ' + statusColor(`[${status}]`));
  }

  static displayBox(content: string[], title?: string): void {
    const maxLength = Math.max(...content.map((line) => line.length), title?.length || 0);
    const width = Math.min(maxLength + 4, 80);
    
    console.log(theme.primary('╔' + '═'.repeat(width - 2) + '╗'));
    
    if (title) {
      const titlePadding = Math.floor((width - title.length - 4) / 2);
      const paddedTitle = ' '.repeat(titlePadding) + title + ' '.repeat(width - title.length - titlePadding - 4);
      console.log(theme.primary('║ ') + theme.highlight(paddedTitle) + theme.primary(' ║'));
      console.log(theme.primary('╠' + '═'.repeat(width - 2) + '╣'));
    }
    
    content.forEach((line) => {
      const padding = ' '.repeat(width - line.length - 4);
      console.log(theme.primary('║ ') + line + padding + theme.primary(' ║'));
    });
    
    console.log(theme.primary('╚' + '═'.repeat(width - 2) + '╝'));
  }

  static displayPhase(phaseNumber: number, totalPhases: number, phaseName: string): void {
    const phaseIndicator = theme.primary(`[${phaseNumber}/${totalPhases}]`);
    const phaseBadge = theme.highlight(`● ${phaseName.toUpperCase()}`);
    
    console.log('\n' + theme.secondary('▔'.repeat(60)));
    console.log(phaseIndicator + ' ' + phaseBadge);
    console.log(theme.secondary('▁'.repeat(60)) + '\n');
  }

  static displayTree(items: Array<{ label: string; children?: string[] }>, indent = 0): void {
    items.forEach((item, index) => {
      const isLast = index === items.length - 1;
      const prefix = ' '.repeat(indent) + (isLast ? '└─ ' : '├─ ');
      
      console.log(theme.muted(prefix) + theme.info(item.label));
      
      if (item.children) {
        item.children.forEach((child, childIndex) => {
          const childIsLast = childIndex === item.children!.length - 1;
          const childPrefix = ' '.repeat(indent) + (isLast ? '   ' : '│  ') + (childIsLast ? '└─ ' : '├─ ');
          console.log(theme.muted(childPrefix) + theme.secondary(child));
        });
      }
    });
  }

  static displayTable(headers: string[], rows: string[][]): void {
    const columnWidths = headers.map((header, i) => {
      return Math.max(header.length, ...rows.map((row) => row[i]?.length || 0));
    });
    
    const headerRow = headers.map((header, i) => 
      theme.highlight(header.padEnd(columnWidths[i]))
    ).join(theme.muted(' │ '));
    
    console.log(headerRow);
    console.log(theme.muted('─'.repeat(columnWidths.reduce((a, b) => a + b + 3, -3))));
    
    rows.forEach((row) => {
      const rowStr = row.map((cell, i) => 
        theme.info(cell.padEnd(columnWidths[i]))
      ).join(theme.muted(' │ '));
      console.log(rowStr);
    });
  }

  static displayBullet(text: string, level: number = 0): void {
    const indent = '  '.repeat(level);
    const bullet = level === 0 ? '▸' : '▹';
    console.log(indent + theme.accent(bullet) + ' ' + text);
  }

  static displayQuote(text: string): void {
    const lines = text.split('\n');
    lines.forEach((line) => {
      console.log(theme.muted('│ ') + theme.info(line));
    });
  }

  static displaySeparator(): void {
    console.log(theme.muted('─'.repeat(70)));
  }

  static displaySpinner(text: string): string {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    const randomFrame = frames[Math.floor(Math.random() * frames.length)];
    return theme.accent(randomFrame) + ' ' + theme.info(text);
  }
}

