import { theme } from './theme';

export class Icons {
  // Status icons
  static readonly SUCCESS = theme.success('✓');
  static readonly ERROR = theme.error('✗');
  static readonly WARNING = theme.warning('⚠');
  static readonly INFO = theme.info('ℹ');
  
  // Progress icons
  static readonly PENDING = theme.muted('○');
  static readonly IN_PROGRESS = theme.accent('◉');
  static readonly COMPLETED = theme.success('●');
  static readonly FAILED = theme.error('⊗');
  static readonly SKIPPED = theme.muted('⊘');
  
  // Agent icons
  static readonly AGENT_IDLE = theme.muted('○');
  static readonly AGENT_BUSY = theme.accent('◉');
  static readonly AGENT_ERROR = theme.error('⊗');
  static readonly AGENT_SUCCESS = theme.success('✓');
  
  // File operation icons
  static readonly FILE_CREATED = theme.success('+');
  static readonly FILE_MODIFIED = theme.warning('✎');
  static readonly FILE_DELETED = theme.error('✗');
  static readonly FILE_RENAMED = theme.info('→');
  
  // Git icons
  static readonly GIT_BRANCH = theme.primary('⎇');
  static readonly GIT_COMMIT = theme.success('◆');
  static readonly GIT_MERGE = theme.accent('⎇');
  static readonly GIT_TAG = theme.highlight('⚑');
  
  // Phase indicators
  static readonly PHASE_1 = theme.primary('①');
  static readonly PHASE_2 = theme.primary('②');
  static readonly PHASE_3 = theme.primary('③');
  static readonly PHASE_4 = theme.primary('④');
  static readonly PHASE_5 = theme.primary('⑤');
  static readonly PHASE_6 = theme.primary('⑥');
  static readonly PHASE_7 = theme.primary('⑦');
  
  // Arrows and pointers
  static readonly ARROW_RIGHT = theme.accent('▸');
  static readonly ARROW_DOWN = theme.accent('▾');
  static readonly POINTER = theme.primary('→');
  static readonly BULLET = theme.accent('•');
  
  // Security icons
  static readonly SECURITY_CRITICAL = theme.error('🔴');
  static readonly SECURITY_HIGH = theme.warning('🟠');
  static readonly SECURITY_MEDIUM = theme.highlight('🟡');
  static readonly SECURITY_LOW = theme.success('🟢');
  static readonly SECURITY_SHIELD = theme.primary('🛡');
  
  // Misc icons
  static readonly ROBOT = theme.primary('🤖');
  static readonly ROCKET = theme.accent('🚀');
  static readonly SPARKLES = theme.highlight('✨');
  static readonly HOURGLASS = theme.warning('⏳');
  static readonly CHECK = theme.success('✅');
  
  static getPhaseIcon(phase: number): string {
    const icons = [
      this.PHASE_1,
      this.PHASE_2,
      this.PHASE_3,
      this.PHASE_4,
      this.PHASE_5,
      this.PHASE_6,
      this.PHASE_7,
    ];
    return icons[phase - 1] || theme.primary(`${phase}`);
  }
  
  static getStatusIcon(status: string): string {
    const statusMap: Record<string, string> = {
      pending: this.PENDING,
      'in-progress': this.IN_PROGRESS,
      'in_progress': this.IN_PROGRESS,
      completed: this.COMPLETED,
      failed: this.FAILED,
      skipped: this.SKIPPED,
      idle: this.AGENT_IDLE,
      busy: this.AGENT_BUSY,
      error: this.AGENT_ERROR,
      success: this.AGENT_SUCCESS,
    };
    return statusMap[status.toLowerCase()] || this.PENDING;
  }
  
  static getSeverityIcon(severity: string): string {
    const severityMap: Record<string, string> = {
      critical: this.SECURITY_CRITICAL,
      high: this.SECURITY_HIGH,
      medium: this.SECURITY_MEDIUM,
      low: this.SECURITY_LOW,
    };
    return severityMap[severity.toLowerCase()] || this.INFO;
  }
}

