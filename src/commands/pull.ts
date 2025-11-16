import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import { gitService } from '../services/git';

export const pullCommand = new Command('pull')
  .description('Fetch and integrate changes from remote repository')
  .argument('[remote]', 'remote name', 'origin')
  .argument('[branch]', 'branch name')
  .option('-r, --rebase', 'rebase instead of merge')
  .option('-f, --force', 'force pull')
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

      // Check for uncommitted changes
      const status = await gitService.status();
      if (status.changed.length > 0 || status.conflicts.length > 0) {
        console.log(chalk.yellow('⚠️  You have uncommitted changes:'));
        
        if (status.changed.length > 0) {
          status.changed.forEach(file => console.log(chalk.red(`  modified: ${file}`)));
        }
        if (status.conflicts.length > 0) {
          status.conflicts.forEach(file => console.log(chalk.magenta(`  conflict: ${file}`)));
        }

        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
              { name: 'Stash changes and continue', value: 'stash' },
              { name: 'Commit changes first', value: 'commit' },
              { name: 'Discard changes', value: 'discard' },
              { name: 'Cancel pull', value: 'cancel' },
            ],
          },
        ]);

        switch (action) {
          case 'stash':
            spinner.start('Stashing changes...');
            await gitService.stash();
            spinner.succeed(chalk.green('Changes stashed'));
            break;
          case 'commit':
            console.log(chalk.yellow('Please commit your changes first, then run pull again.'));
            return;
          case 'discard':
            spinner.start('Discarding changes...');
            await gitService.reset('HEAD', 'hard');
            spinner.succeed(chalk.green('Changes discarded'));
            break;
          case 'cancel':
            console.log(chalk.yellow('Pull cancelled'));
            return;
        }
      }

      // Pull changes
      spinner.start(`Pulling from ${remote}/${branch}...`);
      
      try {
        if (options.rebase) {
          await gitService.fetch(remote, branch);
          await gitService.merge(branch, { squash: false });
        } else {
          await gitService.pull(remote, branch);
        }
        
        spinner.succeed(chalk.green(`Successfully pulled from ${remote}/${branch}`));

        // Show updated status
        const newStatus = await gitService.status();
        console.log(chalk.blue(`\n📊 Status after pull:`));
        console.log(chalk.gray(`Branch: ${newStatus.current}`));
        console.log(chalk.gray(`Ahead: ${newStatus.ahead}`));
        console.log(chalk.gray(`Behind: ${newStatus.behind}`));

        // Check if stashed changes need to be restored
        if (status.changed.length > 0 && status.conflicts.length === 0) {
          const { restoreStash } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'restoreStash',
              message: 'Restore stashed changes?',
              default: true,
            },
          ]);

          if (restoreStash) {
            spinner.start('Restoring stashed changes...');
            try {
              await gitService.stashPop();
              spinner.succeed(chalk.green('Stashed changes restored'));
            } catch (error: any) {
              spinner.fail(chalk.red('Conflict while restoring stash'));
              console.log(chalk.yellow('Please resolve conflicts manually'));
            }
          }
        }

      } catch (error: any) {
        spinner.fail(chalk.red(`Failed to pull: ${error.message}`));
        
        // Offer helpful suggestions
        if (error.message.includes('conflict')) {
          console.log(chalk.yellow('\n⚠️  Merge conflicts detected:'));
          console.log(chalk.gray('  - Resolve conflicts in your files'));
          console.log(chalk.gray('  - Run "gitflow add <file>" for resolved files'));
          console.log(chalk.gray('  - Run "gitflow commit" to complete merge'));
          console.log(chalk.gray('  - Or run "gitflow merge --abort" to cancel'));
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