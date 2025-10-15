import { theme } from './theme';

export interface AnimationOptions {
  speed?: number;
  delay?: number;
  color?: string;
  repeat?: boolean;
}

export interface TypingOptions extends AnimationOptions {
  cursor?: boolean;
  pauseAtEnd?: number;
}

export class AnimationEngine {
  private static instance: AnimationEngine;
  private isAnimating = false;

  static getInstance(): AnimationEngine {
    if (!AnimationEngine.instance) {
      AnimationEngine.instance = new AnimationEngine();
    }
    return AnimationEngine.instance;
  }

  async typewriter(
    text: string,
    options: TypingOptions = {}
  ): Promise<void> {
    const {
      speed = 50,
      delay = 0,
      color = 'white',
      cursor = true,
      pauseAtEnd = 500
    } = options;

    if (delay > 0) {
      await this.delay(delay);
    }

    this.isAnimating = true;
    let currentText = '';
    const coloredText = this.applyColor(text, color);

    for (let i = 0; i <= text.length; i++) {
      if (!this.isAnimating) break;
      
      currentText = coloredText.slice(0, i);
      const displayText = cursor && i < text.length ? currentText + '█' : currentText;
      
      process.stdout.write(`\r${displayText}`);
      await this.delay(speed);
    }

    if (pauseAtEnd > 0) {
      await this.delay(pauseAtEnd);
    }

    process.stdout.write('\n');
    this.isAnimating = false;
  }

  async progressBar(
    current: number,
    total: number,
    label: string = '',
    options: AnimationOptions = {}
  ): Promise<void> {
    const { speed = 100, color = theme.secondary } = options;
    
    const percentage = Math.min(Math.max((current / total) * 100, 0), 100);
    const barWidth = 30;
    const filledWidth = Math.round((percentage / 100) * barWidth);
    
    const bar = '█'.repeat(filledWidth) + '░'.repeat(barWidth - filledWidth);
    const display = `${typeof color === 'function' ? color(`[${bar}]`) : `[${bar}]`} ${percentage.toFixed(1)}% ${label}`;
    
    process.stdout.write(`\r${display}`);
    await this.delay(speed);
  }

  async spinner(
    text: string,
    frames: string[] = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    options: AnimationOptions = {}
  ): Promise<void> {
    const { speed = 100, color = theme.info } = options;
    let frameIndex = 0;

    return new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        const frame = typeof color === 'function' ? color(frames[frameIndex]) : frames[frameIndex];
        process.stdout.write(`\r${frame} ${text}`);
        frameIndex = (frameIndex + 1) % frames.length;
      }, speed);

      (this as any).spinnerInterval = interval;
      
      setTimeout(() => {
        clearInterval(interval);
        process.stdout.write('\n');
        resolve();
      }, 5000);
    });
  }

  async pulse(
    text: string,
    color1: any,
    color2: any,
    duration: number = 2000,
    options: AnimationOptions = {}
  ): Promise<void> {
    const { speed = 200 } = options;
    const cycles = duration / (speed * 2);
    
    for (let i = 0; i < cycles; i++) {
      const color = i % 2 === 0 ? color1 : color2;
      process.stdout.write(`\r${typeof color === 'function' ? color(text) : text}`);
      await this.delay(speed);
    }
    
    process.stdout.write(`\r${text}\n`);
  }

  async slideIn(
    text: string,
    direction: 'left' | 'right' | 'up' | 'down' = 'left',
    options: AnimationOptions = {}
  ): Promise<void> {
    const { speed = 50, color = 'white' } = options;
    const coloredText = this.applyColor(text, color);
    const maxWidth = process.stdout.columns || 80;
    
    switch (direction) {
      case 'left':
        for (let i = 0; i <= maxWidth; i++) {
          const displayText = ' '.repeat(Math.max(0, maxWidth - i)) + coloredText;
          process.stdout.write(`\r${displayText.slice(-maxWidth)}`);
          await this.delay(speed);
        }
        break;
      case 'right':
        for (let i = maxWidth; i >= 0; i--) {
          const displayText = coloredText + ' '.repeat(Math.max(0, maxWidth - i));
          process.stdout.write(`\r${displayText.slice(0, maxWidth)}`);
          await this.delay(speed);
        }
        break;
    }
    
    process.stdout.write('\n');
  }

  async fadeIn(
    text: string,
    steps: number = 10,
    options: AnimationOptions = {}
  ): Promise<void> {
    const { speed = 100, color = 'white' } = options;
    
    for (let i = 0; i <= steps; i++) {
      const alpha = i / steps;
      const fadedText = this.applyAlpha(text, alpha, color);
      process.stdout.write(`\r${fadedText}`);
      await this.delay(speed);
    }
    
    process.stdout.write('\n');
  }

  async agentStatus(
    agentName: string,
    status: 'idle' | 'busy' | 'thinking' | 'error' | 'complete',
    options: AnimationOptions = {}
  ): Promise<void> {
    const { speed = 500 } = options;
    
    const statusConfig = {
      idle: { icon: '○', color: theme.muted, frames: ['○'] },
      busy: { icon: '●', color: theme.accent, frames: ['●', '◐', '○', '◑'] },
      thinking: { icon: '◐', color: theme.info, frames: ['◐', '◑', '◒', '◓'] },
      error: { icon: '✗', color: theme.error, frames: ['✗'] },
      complete: { icon: '✓', color: theme.success, frames: ['✓'] }
    };

    const config = statusConfig[status];
    const frame = config.frames[0];
    const displayText = `${config.color(frame)} ${agentName}: ${status}`;
    
    process.stdout.write(`\r${displayText}\n`);
    await this.delay(speed);
  }

  async bannerEntrance(
    bannerLines: string[],
    options: AnimationOptions = {}
  ): Promise<void> {
    const { speed = 100, delay = 200 } = options;
    
    for (const line of bannerLines) {
      await this.slideIn(line, 'left', { speed });
      await this.delay(delay);
    }
  }

  stop(): void {
    this.isAnimating = false;
    if ((this as any).spinnerInterval) {
      clearInterval((this as any).spinnerInterval);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private applyColor(text: string, color: string): string {
    if (color === 'white') return text;
    if (color === 'primary') return theme.primary(text);
    if (color === 'secondary') return theme.secondary(text);
    if (color === 'accent') return theme.accent(text);
    if (color === 'success') return theme.success(text);
    if (color === 'error') return theme.error(text);
    if (color === 'warning') return theme.warning(text);
    if (color === 'info') return theme.info(text);
    
    return text;
  }

  private applyAlpha(text: string, alpha: number, baseColor: string): string {
    if (alpha < 0.3) return theme.muted(text);
    if (alpha < 0.6) return theme.info(text);
    return this.applyColor(text, baseColor);
  }
}

export const animations = AnimationEngine.getInstance();
