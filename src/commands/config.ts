import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import { configManager } from '../services/config';

export const configCommand = new Command('config')
  .description('Manage configuration')
  .argument('[action]', 'action to perform (get, set, list, reset)')
  .argument('[key]', 'configuration key')
  .argument('[value]', 'configuration value')
  .action(async (action = 'list', key?: string, value?: string) => {
    try {
      switch (action) {
        case 'get':
          if (!key) {
            console.error(chalk.red('Key is required for get action'));
            process.exit(1);
          }
          getConfig(key);
          break;
        case 'set':
          if (!key || !value) {
            console.error(chalk.red('Key and value are required for set action'));
            process.exit(1);
          }
          await setConfig(key, value);
          break;
        case 'list':
          listConfig();
          break;
        case 'reset':
          await resetConfig();
          break;
        case 'setup':
          await setupConfig();
          break;
        default:
          console.error(chalk.red(`Unknown action: ${action}`));
          console.log(chalk.yellow('Available actions: get, set, list, reset, setup'));
          process.exit(1);
      }
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

function getConfig(key: string) {
  const value = configManager.get(key as any);
  if (value !== undefined) {
    console.log(chalk.cyan(`${key}:`), chalk.white(value));
  } else {
    console.log(chalk.yellow(`${key}: not set`));
  }
}

async function setConfig(key: string, value: string) {
  // Convert string value to appropriate type
  let parsedValue: any = value;
  
  // Handle boolean values
  if (value === 'true') parsedValue = true;
  else if (value === 'false') parsedValue = false;
  
  // Handle numeric values
  else if (!isNaN(Number(value)) && value !== '') {
    parsedValue = Number(value);
  }

  configManager.set(key as any, parsedValue);
  console.log(chalk.green(`✓ ${key} set to ${parsedValue}`));
  
  // Validate configuration after setting
  const validation = configManager.validateConfig();
  if (!validation.valid) {
    console.log(chalk.yellow('\n⚠️  Configuration warnings:'));
    validation.errors.forEach(error => console.log(chalk.yellow(`  - ${error}`)));
  }
}

function listConfig() {
  const config = configManager.getConfig();
  
  console.log(chalk.blue.bold('📋 Configuration\n'));
  
  const configEntries = [
    ['githubToken', config.githubToken ? '***' + config.githubToken.slice(-4) : 'Not set'],
    ['defaultBranch', config.defaultBranch || 'main'],
    ['aiProvider', config.aiProvider || 'openai'],
    ['aiApiKey', config.aiApiKey ? '***' + config.aiApiKey.slice(-4) : 'Not set'],
    ['editor', config.editor || 'Not set'],
    ['autoOpenPr', config.autoOpenPr ? 'Yes' : 'No'],
  ];

  configEntries.forEach(([key, value]) => {
    console.log(chalk.cyan(`${key.padEnd(12)}:`), chalk.white(value));
  });

  console.log(chalk.gray(`\nConfig file: ${configManager.getConfigPath()}`));
  
  // Show validation status
  const validation = configManager.validateConfig();
  if (validation.valid) {
    console.log(chalk.green('\n✓ Configuration is valid'));
  } else {
    console.log(chalk.red('\n⚠️  Configuration issues:'));
    validation.errors.forEach(error => console.log(chalk.red(`  - ${error}`)));
  }
}

async function resetConfig() {
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: 'This will reset all configuration. Are you sure?',
      default: false,
    },
  ]);

  if (confirmed) {
    configManager.clear();
    console.log(chalk.green('✓ Configuration reset to defaults'));
  } else {
    console.log(chalk.yellow('Reset cancelled'));
  }
}

async function setupConfig() {
  console.log(chalk.blue.bold('🚀 GitFlow CLI Setup\n'));
  
  const config = await inquirer.prompt([
    {
      type: 'input',
      name: 'githubToken',
      message: 'GitHub Personal Access Token:',
      validate: (input) => {
        if (!input.trim()) return 'GitHub token is required';
        if (!input.startsWith('ghp_') && !input.startsWith('github_pat_')) {
          return 'Token should start with ghp_ or github_pat_';
        }
        return true;
      },
    },
    {
      type: 'list',
      name: 'aiProvider',
      message: 'AI Provider:',
      choices: [
        { name: 'OpenAI (GPT)', value: 'openai' },
        { name: 'Anthropic (Claude)', value: 'anthropic' },
        { name: 'Local/None', value: 'local' },
      ],
      default: 'openai',
    },
    {
      type: 'input',
      name: 'aiApiKey',
      message: 'AI API Key (optional):',
      when: (answers) => answers.aiProvider !== 'local',
    },
    {
      type: 'input',
      name: 'defaultBranch',
      message: 'Default branch name:',
      default: 'main',
    },
    {
      type: 'input',
      name: 'editor',
      message: 'Default editor (for commit messages, etc.):',
      default: process.env.EDITOR || 'code',
    },
    {
      type: 'confirm',
      name: 'autoOpenPr',
      message: 'Auto-open pull requests in browser after creation?',
      default: false,
    },
  ]);

  // Save configuration
  Object.entries(config).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      configManager.set(key as any, value);
    }
  });

  console.log(chalk.green('\n✓ Configuration saved successfully!'));
  
  // Validate configuration
  const validation = configManager.validateConfig();
  if (!validation.valid) {
    console.log(chalk.yellow('\n⚠️  Configuration warnings:'));
    validation.errors.forEach(error => console.log(chalk.yellow(`  - ${error}`)));
  }
  
  console.log(chalk.blue('\n🎉 Setup complete! You can now use GitFlow CLI.'));
  console.log(chalk.gray('Try: gitflow --help'));
}