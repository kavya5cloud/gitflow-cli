import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import { gitService } from '../services/git';

export const pushCommand = new Command('push')
  .description('Push changes to remote repository')
  .argument('[remote]', 'remote name', 'origin')
  .argument('[branch]', 'branch name')
  .option('-f, --force', 'force push')
  .option('-u, --set-upstream', 'set upstream tracking')
  .option('-a, --all', 'push all branches')
  .action(async (remote, branch, options) => {
    try {
      if (!(await gitService.isRepository())) {
        console.error(chalk.red('Not a git repository'));
        process.exit(1);
      }

      const spinner = ora();

      // Get current branch if not specified
      if (!branch) {
        const status = await gitService.status();
        branch = status.current;
      }

      // Check if remote exists
      try {
        const remoteUrl = await gitService.getRemoteUrl(remote);
        if (!remoteUrl) {
          throw new Error(`Remote '${remote}' not found`);
        }
      } catch (error) {
        // Offer to add remote if it doesn't exist
        const { shouldAddRemote, remoteUrl } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'shouldAddRemote',
            message: `Remote '${remote}' not found. Would you like to add it?`,
            default: true,
          },
          {
            type: 'input',
            name: 'remoteUrl',
            message: 'Remote URL:',
            when: (answers) => answers.shouldAddRemote,
            validate: (input) => input.trim() !== '' || 'Remote URL is required',
          },
        ]);

        if (!shouldAddRemote) {
          console.log(chalk.yellow('Push cancelled'));
          return;
        }

        spinner.start('Adding remote...');
        await gitService.addRemote(remote, remoteUrl.trim());
        spinner.succeed(chalk.green(`Remote '${remote}' added`));
      }

      // Confirm force push
      if (options.force) {
        const { confirmed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmed',
            message: chalk.red('Force push can overwrite remote changes. Continue?'),
            default: false,
          },
        ]);

        if (!confirmed) {
          console.log(chalk.yellow('Push cancelled'));
          return;
        }
      }

      // Push changes
      spinner.start(`Pushing to ${remote}/${branch}...`);
      
      try {
        await gitService.push(remote, branch, {
          force: options.force,
          setUpstream: options.set_upstream,
        });
        
        spinner.succeed(chalk.green(`Successfully pushed to ${remote}/${branch}`));

        // Show status after push
        const status = await gitService.status();
        if (status.ahead === 0) {
          console.log(chalk.green('✨ Your branch is up to date'));
        }

      } catch (error: any) {
        spinner.fail(chalk.red(`Failed to push: ${error.message}`));
        
        // Offer helpful suggestions
        if (error.message.includes('reject') || error.message.includes('non-fast-forward')) {
          console.log(chalk.yellow('\n💡 Suggestions:'));
          console.log(chalk.gray('  - Pull latest changes first: gitflow pull'));
          console.log(chalk.gray('  - Or force push if you want to overwrite: gitflow push --force'));
        } else if (error.message.includes('authentication')) {
          console.log(chalk.yellow('\n💡 Suggestions:'));
          console.log(chalk.gray('  - Check your GitHub token: gitflow config set githubToken <token>'));
          console.log(chalk.gray('  - Or use SSH URL for the remote'));
        }
        
        process.exit(1);
      }

    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });