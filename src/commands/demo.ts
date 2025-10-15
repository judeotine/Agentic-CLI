import { Command } from 'commander';
import { Logger } from '../ui/logger';
import { theme } from '../ui/theme';

export function createDemoCommand(): Command {
  const command = new Command('demo');

  command
    .description('Demonstrate Agentic CLI animations and UI features')
    .option('-s, --speed <speed>', 'Animation speed (1-10)', '5')
    .option('--no-banner', 'Skip banner animation')
    .option('--no-typing', 'Skip typing animations')
    .option('--no-progress', 'Skip progress animations')
    .action(async (options) => {
      const logger = new Logger({ verbose: true, colors: true });
      

        try {
          if (options.banner) {
            logger.showBanner();
          }

          if (options.typing) {
          console.log(theme.primary('Welcome to Agentic CLI Demo!'));
          logger.typeCommand('agentic demo --speed 3');
          logger.typeResponse(theme.success('Command executed successfully!'));
          }

          if (options.progress) {
            console.log(theme.secondary('Progress Demo'));
            
            for (let i = 1; i <= 10; i++) {
            logger.showProgress(i, 10, `Processing step ${i}`);
            }
            
            console.log();
          }

          console.log(theme.secondary('Agent Status Demo'));

        const agents = ['Code Architect', 'Security Scanner', 'Test Generator', 'Git Assistant'];
        
        for (const agent of agents) {
          logger.showAgentStatus(agent, 'idle');
          logger.showAgentStatus(agent, 'busy');
          logger.showAgentStatus(agent, 'thinking');
          logger.showAgentStatus(agent, 'complete');
          }

          console.log(theme.secondary('Simple Messages'));
          console.log(theme.accent('Simple message display'));
          console.log('Regular text output');
          
          console.log(theme.success('✨ Demo complete! ✨'));
        console.log(theme.info('Agentic CLI is ready to use!'));

      } catch (error) {
        logger.error('Demo failed:', error);
        process.exit(1);
      }
    });

  return command;
}
