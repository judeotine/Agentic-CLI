import chalk from 'chalk';

export interface Theme {
  name: string;
  colors: {
    primary: chalk.Chalk;
    secondary: chalk.Chalk;
    success: chalk.Chalk;
    warning: chalk.Chalk;
    error: chalk.Chalk;
    info: chalk.Chalk;
    accent: chalk.Chalk;
    muted: chalk.Chalk;
    highlight: chalk.Chalk;
  };
  banner: {
    border: string;
    text: string;
  };
}

export const AgenticTheme: Theme = {
  name: 'agentic-default',
  colors: {
    primary: chalk.hex('#00D9FF'),      // Bright cyan - main brand color
    secondary: chalk.hex('#9D4EDD'),    // Purple - secondary brand
    success: chalk.hex('#06FFA5'),      // Bright green
    warning: chalk.hex('#FFB627'),      // Golden yellow
    error: chalk.hex('#FF006E'),        // Hot pink
    info: chalk.hex('#4EA8DE'),         // Sky blue
    accent: chalk.hex('#FB5607'),       // Orange
    muted: chalk.gray,                  // Gray
    highlight: chalk.hex('#FFBE0B'),    // Yellow
  },
  banner: {
    border: '═',
    text: 'bold',
  },
};

export const DarkTheme: Theme = {
  name: 'agentic-dark',
  colors: {
    primary: chalk.hex('#00B4D8'),
    secondary: chalk.hex('#7209B7'),
    success: chalk.hex('#06D6A0'),
    warning: chalk.hex('#F77F00'),
    error: chalk.hex('#D62828'),
    info: chalk.hex('#457B9D'),
    accent: chalk.hex('#E63946'),
    muted: chalk.hex('#6C757D'),
    highlight: chalk.hex('#F4A261'),
  },
  banner: {
    border: '─',
    text: 'bold',
  },
};

export const LightTheme: Theme = {
  name: 'agentic-light',
  colors: {
    primary: chalk.hex('#0077B6'),
    secondary: chalk.hex('#5A189A'),
    success: chalk.hex('#2D6A4F'),
    warning: chalk.hex('#E85D04'),
    error: chalk.hex('#9D0208'),
    info: chalk.hex('#1D3557'),
    accent: chalk.hex('#DC2F02'),
    muted: chalk.hex('#495057'),
    highlight: chalk.hex('#D4A373'),
  },
  banner: {
    border: '━',
    text: 'bold',
  },
};

export class ThemeManager {
  private currentTheme: Theme = AgenticTheme;

  setTheme(themeName: 'default' | 'dark' | 'light'): void {
    switch (themeName) {
      case 'dark':
        this.currentTheme = DarkTheme;
        break;
      case 'light':
        this.currentTheme = LightTheme;
        break;
      default:
        this.currentTheme = AgenticTheme;
    }
  }

  getTheme(): Theme {
    return this.currentTheme;
  }

  // Convenience methods
  primary(text: string): string {
    return this.currentTheme.colors.primary(text);
  }

  secondary(text: string): string {
    return this.currentTheme.colors.secondary(text);
  }

  success(text: string): string {
    return this.currentTheme.colors.success(text);
  }

  warning(text: string): string {
    return this.currentTheme.colors.warning(text);
  }

  error(text: string): string {
    return this.currentTheme.colors.error(text);
  }

  info(text: string): string {
    return this.currentTheme.colors.info(text);
  }

  accent(text: string): string {
    return this.currentTheme.colors.accent(text);
  }

  muted(text: string): string {
    return this.currentTheme.colors.muted(text);
  }

  highlight(text: string): string {
    return this.currentTheme.colors.highlight(text);
  }
}

export const theme = new ThemeManager();

