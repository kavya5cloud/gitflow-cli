import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import { gitService } from '../services/git';
import { existsSync } from 'fs';
import { basename, resolve } from 'path';

export const cloneCommand = new Command('clone')
  .description('Clone a repository from GitHub')
  .argument('<url>', 'repository URL or owner/repo')
  .option('-d, --directory <dir>', 'target directory')
  .option('-b, --branch <branch>', 'branch to checkout')
  .option('--depth <depth>', 'create a shallow clone', parseInt)
  .action(async (url, options) => {
    try {
      let repoUrl = url;
      let targetDir = options.directory;

      // Convert owner/repo format to GitHub URL
      if (!url.startsWith('http') && !url.startsWith('git@')) {
        const [owner, repo] = url.split('/');
        if (!owner || !repo) {
          throw new Error('Invalid repository format. Use owner/repo or full URL');
        }
        repoUrl = `https://github.com/${owner}/${repo}.git`;
        
        // Set default target directory if not specified
        if (!targetDir) {
          targetDir = repo.replace('.git', '');
        }
      }

      // Check if target directory already exists
      if (targetDir && existsSync(targetDir)) {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: `Directory '${targetDir}' already exists. Continue?`,
            default: false,
          },
        ]);

        if (!overwrite) {
          console.log(chalk.yellow('Clone cancelled'));
          return;
        }
      }

      const spinner = ora('Cloning repository...').start();

      try {
        const clonedPath = await gitService.clone(repoUrl, targetDir, {
          branch: options.branch,
          depth: options.depth,
        });

        spinner.succeed(chalk.green(`Repository cloned to ${clonedPath}`));

        // Show repository info
        const targetGit = gitService.constructor.name === 'GitService' 
          ? new (gitService.constructor as any)(clonedPath)
          : gitService;

        if (await targetGit.isRepository()) {
          const status = await targetGit.status();
          const remotes = await targetGit.getRemoteUrl();

          console.log(chalk.blue('\n📋 Repository Information:'));
          console.log(chalk.gray(`Path: ${resolve(clonedPath)}`));
          console.log(chalk.gray(`Branch: ${status.current}`));
          if (remotes) {
            console.log(chalk.gray(`Remote: ${remotes}`));
          }

          // Show next steps
          console.log(chalk.blue('\n🚀 Next steps:'));
          console.log(chalk.gray(`  cd ${clonedPath}`));
          console.log(chalk.gray('  gitflow status'));
          console.log(chalk.gray('  gitflow branch'));
        }

      } catch (error: any) {
        spinner.fail(chalk.red(`Failed to clone repository: ${error.message}`));
        process.exit(1);
      }

    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });