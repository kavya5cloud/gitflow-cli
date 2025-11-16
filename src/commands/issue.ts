import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import { table } from 'table';
import open from 'open';
import { gitService } from '../services/git';
import { githubService } from '../services/github';
import { aiService } from '../services/ai';

export const issueCommand = new Command('issue')
  .description('Manage GitHub issues')
  .argument('[action]', 'action to perform (list, create, show)')
  .option('-t, --title <title>', 'issue title')
  .option('-b, --body <body>', 'issue description')
  .option('-l, --labels <labels>', 'comma-separated labels')
  .option('-a, --assignees <assignees>', 'comma-separated assignees')
  .option('--ai', 'generate issue title using AI')
  .action(async (action = 'list', options) => {
    try {
      if (!(await gitService.isRepository())) {
        console.error(chalk.red('Not a git repository'));
        process.exit(1);
      }

      const spinner = ora();

      // Get repository info
      const remoteUrl = await gitService.getRemoteUrl();
      if (!remoteUrl) {
        console.error(chalk.red('No remote repository configured'));
        process.exit(1);
      }

      // Parse owner and repo from remote URL
      const match = remoteUrl.match(/github\.com[\/:]([^\/]+)\/([^\/.]+)(\.git)?$/);
      if (!match) {
        console.error(chalk.red('Invalid GitHub repository URL'));
        process.exit(1);
      }

      const [, owner, repo] = match;

      switch (action) {
        case 'list':
          await listIssues(owner, repo, spinner);
          break;
        case 'create':
          await createIssue(owner, repo, options, spinner);
          break;
        case 'show':
          await showIssue(owner, repo, spinner);
          break;
        default:
          console.error(chalk.red(`Unknown action: ${action}`));
          console.log(chalk.yellow('Available actions: list, create, show'));
          process.exit(1);
      }

    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

async function listIssues(owner: string, repo: string, spinner: ora.Ora) {
  const { state } = await inquirer.prompt([
    {
      type: 'list',
      name: 'state',
      message: 'Filter by state:',
      choices: [
        { name: 'Open', value: 'open' },
        { name: 'Closed', value: 'closed' },
        { name: 'All', value: 'all' },
      ],
      default: 'open',
    },
  ]);

  spinner.start('Fetching issues...');
  
  try {
    const issues = await githubService.getIssues(owner, repo, state);
    spinner.succeed(chalk.green('Issues fetched'));

    if (issues.length === 0) {
      console.log(chalk.yellow(`No ${state} issues found`));
      return;
    }

    console.log(chalk.blue.bold(`\n🐛 Issues (${issues.length})\n`));

    const tableData = [
      ['#', 'Title', 'Author', 'Labels', 'Assignees', 'Updated'],
    ];

    issues.forEach(issue => {
      tableData.push([
        issue.number.toString(),
        issue.title.substring(0, 40) + (issue.title.length > 40 ? '...' : ''),
        issue.author,
        issue.labels.join(', ') || 'None',
        issue.assignees.join(', ') || 'None',
        new Date(issue.updatedAt).toLocaleDateString(),
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

  } catch (error: any) {
    spinner.fail(chalk.red(`Failed to fetch issues: ${error.message}`));
    process.exit(1);
  }
}

async function createIssue(owner: string, repo: string, options: any, spinner: ora.Ora) {
  // Get issue details
  let title = options.title;
  let body = options.body;
  let labels = options.labels ? options.labels.split(',').map((l: string) => l.trim()) : [];
  let assignees = options.assignees ? options.assignees.split(',').map((a: string) => a.trim()) : [];

  if (!title && options.ai) {
    spinner.start('Generating AI issue title...');
    try {
      const { description } = await inquirer.prompt([
        {
          type: 'input',
          name: 'description',
          message: 'Describe the issue or feature request:',
          validate: (input) => input.trim() !== '' || 'Description is required',
        },
      ]);

      const aiResponse = await aiService.generateIssueTitle(description);
      title = aiResponse.content;
      body = description;
      spinner.succeed(chalk.green('AI issue title generated'));
      
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `Use this AI-generated title?\n\n${chalk.cyan(title)}\n`,
          default: true,
        },
      ]);

      if (!confirmed) {
        const { customTitle } = await inquirer.prompt([
          {
            type: 'input',
            name: 'customTitle',
            message: 'Issue title:',
            validate: (input) => input.trim() !== '' || 'Issue title is required',
          },
        ]);
        title = customTitle.trim();
      }
    } catch (error: any) {
      spinner.fail(chalk.red(`Failed to generate AI title: ${error.message}`));
    }
  }

  if (!title) {
    const { inputTitle } = await inquirer.prompt([
      {
        type: 'input',
        name: 'inputTitle',
        message: 'Issue title:',
        validate: (input) => input.trim() !== '' || 'Issue title is required',
      },
    ]);
    title = inputTitle.trim();
  }

  if (!body) {
    const { inputBody } = await inquirer.prompt([
      {
        type: 'input',
        name: 'inputBody',
        message: 'Issue description:',
      },
    ]);
    body = inputBody.trim();
  }

  // Add labels
  const { addLabels } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'addLabels',
      message: 'Add labels?',
      default: false,
    },
  ]);

  if (addLabels) {
    const { inputLabels } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'inputLabels',
        message: 'Select labels:',
        choices: [
          'bug',
          'enhancement',
          'feature',
          'documentation',
          'good first issue',
          'help wanted',
          'question',
          'wontfix',
        ],
      },
    ]);
    labels = inputLabels;
  }

  // Create issue
  spinner.start('Creating issue...');
  
  try {
    const issue = await githubService.createIssue(owner, repo, {
      title,
      body,
      labels,
      assignees,
    });

    spinner.succeed(chalk.green('Issue created successfully'));

    console.log(chalk.blue('\n📋 Issue Details:'));
    console.log(chalk.gray(`Number: #${issue.number}`));
    console.log(chalk.gray(`Title: ${issue.title}`));
    console.log(chalk.gray(`State: ${issue.state}`));
    console.log(chalk.gray(`URL: ${issue.url}`));

    if (issue.labels.length > 0) {
      console.log(chalk.gray(`Labels: ${issue.labels.join(', ')}`));
    }

    if (issue.assignees.length > 0) {
      console.log(chalk.gray(`Assignees: ${issue.assignees.join(', ')}`));
    }

    const { openInBrowser } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'openInBrowser',
        message: 'Open in browser?',
        default: false,
      },
    ]);

    if (openInBrowser) {
      await open(issue.url);
    }

  } catch (error: any) {
    spinner.fail(chalk.red(`Failed to create issue: ${error.message}`));
    process.exit(1);
  }
}

async function showIssue(owner: string, repo: string, spinner: ora.Ora) {
  const { state } = await inquirer.prompt([
    {
      type: 'list',
      name: 'state',
      message: 'Filter by state:',
      choices: [
        { name: 'Open', value: 'open' },
        { name: 'Closed', value: 'closed' },
        { name: 'All', value: 'all' },
      ],
      default: 'open',
    },
  ]);

  spinner.start('Fetching issues...');
  
  try {
    const issues = await githubService.getIssues(owner, repo, state);
    spinner.succeed(chalk.green('Issues fetched'));

    if (issues.length === 0) {
      console.log(chalk.yellow(`No ${state} issues found`));
      return;
    }

    const { selectedIssue } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedIssue',
        message: 'Select issue to view:',
        choices: issues.map(issue => ({
          name: `#${issue.number} - ${issue.title} (${issue.author})`,
          value: issue,
        })),
      },
    ]);

    console.log(chalk.blue.bold(`\n📋 Issue #${selectedIssue.number}\n`));
    console.log(chalk.cyan(`Title: ${selectedIssue.title}`));
    console.log(chalk.gray(`Author: ${selectedIssue.author}`));
    console.log(chalk.gray(`State: ${selectedIssue.state}`));
    console.log(chalk.gray(`Created: ${new Date(selectedIssue.createdAt).toLocaleString()}`));
    console.log(chalk.gray(`Updated: ${new Date(selectedIssue.updatedAt).toLocaleString()}`));
    
    if (selectedIssue.labels.length > 0) {
      console.log(chalk.gray(`Labels: ${selectedIssue.labels.join(', ')}`));
    }
    
    if (selectedIssue.assignees.length > 0) {
      console.log(chalk.gray(`Assignees: ${selectedIssue.assignees.join(', ')}`));
    }
    
    console.log(chalk.blue(`\n📝 Description:\n${selectedIssue.body}`));
    console.log(chalk.blue(`\n🔗 URL: ${selectedIssue.url}`));

    const { openInBrowser } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'openInBrowser',
        message: 'Open in browser?',
        default: false,
      },
    ]);

    if (openInBrowser) {
      await open(selectedIssue.url);
    }

  } catch (error: any) {
    spinner.fail(chalk.red(`Failed to fetch issue: ${error.message}`));
    process.exit(1);
  }
}