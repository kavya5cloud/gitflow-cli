import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import { gitService } from '../services/git';
import { githubService } from '../services/github';
import { configManager } from '../services/config';

export const initCommand = new Command('init')
  .description('Initialize a new repository (local and/or remote)')
  .option('-n, --name <name>', 'repository name')
  .option('-d, --description <description>', 'repository description')
  .option('-p, --private', 'create private repository')
  .option('-r, --remote', 'create remote repository on GitHub')
  .option('--no-local', 'skip local git initialization')
  .action(async (options) => {
    try {
      const spinner = ora('Initializing repository...').start();

      // Get repository name
      let repoName = options.name;
      if (!repoName) {
        spinner.stop();
        const { name } = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Repository name:',
            validate: (input) => input.trim() !== '' || 'Repository name is required',
          },
        ]);
        repoName = name.trim();
        spinner.start();
      }

      // Initialize local repository
      if (options.local !== false) {
        if (!(await gitService.isRepository())) {
          await gitService.init({
            initialBranch: configManager.get('defaultBranch') || 'main',
          });
          spinner.succeed(chalk.green('Local repository initialized'));
        } else {
          spinner.warn(chalk.yellow('Local repository already exists'));
        }
      }

      // Create remote repository
      if (options.remote) {
        spinner.text = 'Creating remote repository...';
        
        try {
          const repo = await githubService.createRepository(repoName, {
            description: options.description,
            private: options.private,
            autoInit: options.local === false,
          });

          // Add remote if local repo exists
          if (options.local !== false && await gitService.isRepository()) {
            await gitService.addRemote('origin', repo.url);
            spinner.succeed(chalk.green(`Remote repository created: ${repo.url}`));
          } else {
            spinner.succeed(chalk.green(`Remote repository created: ${repo.url}`));
          }

          console.log(chalk.blue('\n🎉 Repository created successfully!'));
          console.log(chalk.gray(`Name: ${repo.name}`));
          console.log(chalk.gray(`URL: ${repo.url}`));
          console.log(chalk.gray(`Private: ${repo.private ? 'Yes' : 'No'}`));
          
        } catch (error: any) {
          spinner.fail(chalk.red(`Failed to create remote repository: ${error.message}`));
        }
      } else {
        spinner.succeed(chalk.green('Repository initialized'));
      }

      // Show next steps
      if (options.local !== false) {
        console.log(chalk.blue('\n📋 Next steps:'));
        if (options.remote) {
          console.log(chalk.gray('  gitflow add .'));
          console.log(chalk.gray('  gitflow commit -m "Initial commit"'));
          console.log(chalk.gray('  gitflow push -u origin main'));
        } else {
          console.log(chalk.gray('  gitflow add .'));
          console.log(chalk.gray('  gitflow commit -m "Initial commit"'));
          if (options.remote) {
            console.log(chalk.gray('  gitflow push -u origin main'));
          }
        }
      }

    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });