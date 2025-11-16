import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import { gitService } from '../services/git';
import { aiService } from '../services/ai';

export const commitCommand = new Command('commit')
  .description('Record changes to the repository')
  .option('-m, --message <message>', 'commit message')
  .option('-a, --all', 'stage all modified and deleted files')
  .option('--amend', 'amend previous commit')
  .option('--allow-empty', 'allow empty commit')
  .option('--ai', 'generate commit message using AI')
  .action(async (options) => {
    try {
      if (!(await gitService.isRepository())) {
        console.error(chalk.red('Not a git repository'));
        process.exit(1);
      }

      const spinner = ora();

      // Stage files if --all option is used
      if (options.all) {
        spinner.start('Staging files...');
        await gitService.add('.');
        spinner.succeed(chalk.green('Files staged'));
      }

      // Get commit message
      let message = options.message;
      
      if (!message && options.ai) {
        spinner.start('Generating AI commit message...');
        try {
          const diff = await gitService.getDiff();
          if (!diff.trim()) {
            spinner.warn(chalk.yellow('No changes to commit'));
            return;
          }
          
          const aiResponse = await aiService.generateCommitMessage(diff);
          message = aiResponse.content;
          spinner.succeed(chalk.green('AI commit message generated'));
          
          // Show the generated message and ask for confirmation
          const { confirmed } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirmed',
              message: `Use this commit message?\n\n${chalk.cyan(message)}\n`,
              default: true,
            },
          ]);

          if (!confirmed) {
            const { customMessage } = await inquirer.prompt([
              {
                type: 'input',
                name: 'customMessage',
                message: 'Enter commit message:',
                validate: (input) => input.trim() !== '' || 'Commit message is required',
              },
            ]);
            message = customMessage.trim();
          }
        } catch (error: any) {
          spinner.fail(chalk.red(`Failed to generate AI message: ${error.message}`));
          console.log(chalk.yellow('Please enter a commit message manually:'));
          
          const { manualMessage } = await inquirer.prompt([
            {
              type: 'input',
              name: 'manualMessage',
              message: 'Commit message:',
              validate: (input) => input.trim() !== '' || 'Commit message is required',
            },
          ]);
          message = manualMessage.trim();
        }
      } else if (!message) {
        const { inputMessage } = await inquirer.prompt([
          {
            type: 'input',
            name: 'inputMessage',
            message: 'Commit message:',
            validate: (input) => input.trim() !== '' || 'Commit message is required',
          },
        ]);
        message = inputMessage.trim();
      }

      // Create commit
      spinner.start('Creating commit...');
      try {
        const commitHash = await gitService.commit(message, {
          allowEmpty: options.allowEmpty,
          amend: options.amend,
        });
        
        spinner.succeed(chalk.green('Commit created successfully'));
        
        if (commitHash) {
          console.log(chalk.blue(`Commit: ${commitHash}`));
        }
        console.log(chalk.gray(`Message: ${message}`));

      } catch (error: any) {
        spinner.fail(chalk.red(`Failed to create commit: ${error.message}`));
        process.exit(1);
      }

    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });