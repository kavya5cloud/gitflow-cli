import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import { table } from 'table';
import { gitService } from '../services/git';

export const branchCommand = new Command('branch')
  .description('List, create, or delete branches')
  .argument('[name]', 'branch name')
  .option('-c, --create', 'create new branch')
  .option('-d, --delete', 'delete branch')
  .option('-D, --force-delete', 'force delete branch')
  .option('-r, --remote', 'show remote branches')
  .option('-a, --all', 'show all branches (local and remote)')
  .option('-v, --verbose', 'show verbose information')
  .action(async (name, options) => {
    try {
      if (!(await gitService.isRepository())) {
        console.error(chalk.red('Not a git repository'));
        process.exit(1);
      }

      const spinner = ora();

      // Create branch
      if (options.create && name) {
        const currentBranch = await gitService.getCurrentBranch();
        
        spinner.start(`Creating branch '${name}'...`);
        try {
          await gitService.createBranch(name, true);
          spinner.succeed(chalk.green(`Branch '${name}' created and checked out`));
          
          console.log(chalk.blue(`\n📋 Branch Information:`));
          console.log(chalk.gray(`From: ${currentBranch}`));
          console.log(chalk.gray(`Current: ${name}`));
          
        } catch (error: any) {
          spinner.fail(chalk.red(`Failed to create branch: ${error.message}`));
          process.exit(1);
        }
        return;
      }

      // Delete branch
      if ((options.delete || options.force_delete) && name) {
        const currentBranch = await gitService.getCurrentBranch();
        
        if (name === currentBranch) {
          console.error(chalk.red('Cannot delete the current branch'));
          process.exit(1);
        }

        const { confirmed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmed',
            message: `Delete branch '${name}'?`,
            default: false,
          },
        ]);

        if (!confirmed) {
          console.log(chalk.yellow('Branch deletion cancelled'));
          return;
        }

        spinner.start(`Deleting branch '${name}'...`);
        try {
          await gitService.deleteBranch(name, options.force_delete);
          spinner.succeed(chalk.green(`Branch '${name}' deleted`));
        } catch (error: any) {
          spinner.fail(chalk.red(`Failed to delete branch: ${error.message}`));
          process.exit(1);
        }
        return;
      }

      // List branches
      spinner.start('Fetching branches...');
      try {
        const branches = await gitService.getBranches();
        const currentBranch = await gitService.getCurrentBranch();
        
        spinner.succeed(chalk.green('Branches fetched'));

        if (name && !options.create && !options.delete && !options.force_delete) {
          // Checkout existing branch
          if (branches.find(b => b.name === name)) {
            spinner.start(`Switching to branch '${name}'...`);
            await gitService.checkout(name);
            spinner.succeed(chalk.green(`Switched to branch '${name}'`));
          } else {
            console.error(chalk.red(`Branch '${name}' not found`));
            console.log(chalk.yellow('Available branches:'));
            branches.forEach(branch => {
              const marker = branch.name === currentBranch ? chalk.green('*') : ' ';
              console.log(`  ${marker} ${branch.name}`);
            });
          }
          return;
        }

        // Display branches in table format
        console.log(chalk.blue.bold('\n🌿 Branches\n'));

        const tableData = [
          ['Branch', 'Current', 'Protected'],
        ];

        branches.forEach(branch => {
          const isCurrent = branch.name === currentBranch;
          tableData.push([
            branch.name,
            isCurrent ? chalk.green('✓') : '',
            branch.protected ? chalk.red('🔒') : '',
          ]);
        });

        console.log(table(tableData, {
          border: {
            topBody: '─',
            topJoin: '┬',
            topLeft: '┌',
            topRight: '┐',
            bottomBody: '─',
            bottomJoin: '┴',
            bottomLeft: '└',
            bottomRight: '┘',
            bodyLeft: '│',
            bodyRight: '│',
            bodyJoin: '│',
            joinBody: '─',
            joinLeft: '├',
            joinRight: '┤',
            joinJoin: '┼'
          }
        }));

        // Show verbose information if requested
        if (options.verbose) {
          console.log(chalk.blue('\n📊 Detailed Information:'));
          const status = await gitService.status();
          console.log(chalk.gray(`Current branch: ${currentBranch}`));
          console.log(chalk.gray(`Tracking: ${status.tracking || 'None'}`));
          console.log(chalk.gray(`Ahead: ${status.ahead} commits`));
          console.log(chalk.gray(`Behind: ${status.behind} commits`));
        }

        // Show usage hints
        console.log(chalk.blue('\n💡 Usage:'));
        console.log(chalk.gray('  gitflow branch <name>           # Checkout branch'));
        console.log(chalk.gray('  gitflow branch -c <name>       # Create new branch'));
        console.log(chalk.gray('  gitflow branch -d <name>       # Delete branch'));
        console.log(chalk.gray('  gitflow branch -D <name>       # Force delete branch'));

      } catch (error: any) {
        spinner.fail(chalk.red(`Failed to fetch branches: ${error.message}`));
        process.exit(1);
      }

    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });