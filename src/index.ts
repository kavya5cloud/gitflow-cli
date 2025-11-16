#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init';
import { cloneCommand } from './commands/clone';
import { statusCommand } from './commands/status';
import { commitCommand } from './commands/commit';
import { pushCommand } from './commands/push';
import { pullCommand } from './commands/pull';
import { branchCommand } from './commands/branch';
import { prCommand } from './commands/pr';
import { issueCommand } from './commands/issue';
import { configCommand } from './commands/config';
import { aiCommand } from './commands/ai';

const program = new Command();

program
  .name('gitflow')
  .description('AI-powered GitHub CLI - brings GitHub to your terminal with intelligent automation')
  .version('1.0.0')
  .option('-v, --verbose', 'verbose output')
  .option('-q, --quiet', 'quiet mode')
  .hook('preAction', (thisCommand) => {
    const options = thisCommand.opts();
    if (options.verbose) {
      console.log(chalk.blue(`[DEBUG] Executing: ${thisCommand.name()}`));
    }
  });

// Core Git Commands
program.addCommand(initCommand);
program.addCommand(cloneCommand);
program.addCommand(statusCommand);
program.addCommand(commitCommand);
program.addCommand(pushCommand);
program.addCommand(pullCommand);
program.addCommand(branchCommand);

// GitHub-specific Commands
program.addCommand(prCommand);
program.addCommand(issueCommand);

// Configuration and AI Commands
program.addCommand(configCommand);
program.addCommand(aiCommand);

// Global error handler
program.exitOverride();

process.on('uncaughtException', (error) => {
  console.error(chalk.red('Error:'), error.message);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, 'reason:', reason);
  process.exit(1);
});

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(chalk.cyan.bold('🚀 GitFlow CLI - AI-Powered GitHub Tool\n'));
  program.outputHelp();
  console.log(chalk.gray('\nExamples:'));
  console.log(chalk.gray('  gitflow init                    # Initialize new repository'));
  console.log(chalk.gray('  gitflow clone user/repo         # Clone repository'));
  console.log(chalk.gray('  gitflow commit --ai             # AI-powered commit'));
  console.log(chalk.gray('  gitflow pr create               # Create pull request'));
  console.log(chalk.gray('  gitflow ai review               # AI code review'));
}