import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import { table } from 'table';
import open from 'open';
import { gitService } from '../services/git';
import { githubService } from '../services/github';
import { aiService } from '../services/ai';
import { configManager } from '../services/config';

export const prCommand = new Command('pr')
  .description('Manage pull requests')
  .argument('[action]', 'action to perform (list, create, merge, show)')
  .option('-t, --title <title>', 'PR title')
  .option('-b, --body <body>', 'PR description')
  .option('-H, --head <branch>', 'head branch')
  .option('-B, --base <branch>', 'base branch', 'main')
  .option('-d, --draft', 'create draft PR')
  .option('--ai', 'generate PR description using AI')
  .option('--open', 'open PR in browser after creation')
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
          await listPRs(owner, repo, spinner);
          break;
        case 'create':
          await createPR(owner, repo, options, spinner);
          break;
        case 'merge':
          await mergePR(owner, repo, spinner);
          break;
        case 'show':
          await showPR(owner, repo, spinner);
          break;
        default:
          console.error(chalk.red(`Unknown action: ${action}`));
          console.log(chalk.yellow('Available actions: list, create, merge, show'));
          process.exit(1);
      }

    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

async function listPRs(owner: string, repo: string, spinner: ora.Ora) {
  spinner.start('Fetching pull requests...');
  
  try {
    const prs = await githubService.getPullRequests(owner, repo, 'open');
    spinner.succeed(chalk.green('Pull requests fetched'));

    if (prs.length === 0) {
      console.log(chalk.yellow('No open pull requests found'));
      return;
    }

    console.log(chalk.blue.bold(`\n🔀 Open Pull Requests (${prs.length})\n`));

    const tableData = [
      ['#', 'Title', 'Author', 'Head → Base', 'Lines', 'Updated'],
    ];

    prs.forEach(pr => {
      const lines = pr.additions !== undefined && pr.deletions !== undefined 
        ? `+${pr.additions} -${pr.deletions}` 
        : 'N/A';
      
      tableData.push([
        pr.number.toString(),
        pr.title.substring(0, 50) + (pr.title.length > 50 ? '...' : ''),
        pr.author,
        `${pr.head} → ${pr.base}`,
        lines,
        new Date(pr.updatedAt).toLocaleDateString(),
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
    spinner.fail(chalk.red(`Failed to fetch PRs: ${error.message}`));
    process.exit(1);
  }
}

async function createPR(owner: string, repo: string, options: any, spinner: ora.Ora) {
  // Get current branch
  const currentBranch = await gitService.getCurrentBranch();
  const baseBranch = options.base || 'main';

  if (currentBranch === baseBranch) {
    console.error(chalk.red('Cannot create PR from the base branch'));
    process.exit(1);
  }

  // Get PR details
  let title = options.title;
  let body = options.body;

  if (!title) {
    const { inputTitle } = await inquirer.prompt([
      {
        type: 'input',
        name: 'inputTitle',
        message: 'PR title:',
        validate: (input) => input.trim() !== '' || 'PR title is required',
      },
    ]);
    title = inputTitle.trim();
  }

  if (!body && options.ai) {
    spinner.start('Generating AI PR description...');
    try {
      const diff = await gitService.getDiff();
      const aiResponse = await aiService.generatePRDescription(title, diff);
      body = aiResponse.content;
      spinner.succeed(chalk.green('AI PR description generated'));
      
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `Use this AI-generated description?\n\n${chalk.cyan(body)}\n`,
          default: true,
        },
      ]);

      if (!confirmed) {
        const { customBody } = await inquirer.prompt([
          {
            type: 'editor',
            name: 'customBody',
            message: 'Edit PR description:',
            default: body,
          },
        ]);
        body = customBody;
      }
    } catch (error: any) {
      spinner.fail(chalk.red(`Failed to generate AI description: ${error.message}`));
    }
  }

  if (!body) {
    const { inputBody } = await inquirer.prompt([
      {
        type: 'input',
        name: 'inputBody',
        message: 'PR description:',
      },
    ]);
    body = inputBody.trim();
  }

  // Create PR
  spinner.start('Creating pull request...');
  
  try {
    const pr = await githubService.createPullRequest(owner, repo, {
      title,
      body,
      head: currentBranch,
      base: baseBranch,
      draft: options.draft,
    });

    spinner.succeed(chalk.green('Pull request created successfully'));

    console.log(chalk.blue('\n📋 Pull Request Details:'));
    console.log(chalk.gray(`Number: #${pr.number}`));
    console.log(chalk.gray(`Title: ${pr.title}`));
    console.log(chalk.gray(`State: ${pr.state}`));
    console.log(chalk.gray(`URL: ${pr.url}`));

    // Open in browser if requested
    const shouldOpen = options.open || configManager.get('autoOpenPr');
    if (shouldOpen) {
      await open(pr.url);
      console.log(chalk.green('Opened in browser'));
    }

  } catch (error: any) {
    spinner.fail(chalk.red(`Failed to create PR: ${error.message}`));
    process.exit(1);
  }
}

async function mergePR(owner: string, repo: string, spinner: ora.Ora) {
  spinner.start('Fetching open pull requests...');
  
  try {
    const prs = await githubService.getPullRequests(owner, repo, 'open');
    spinner.succeed(chalk.green('Pull requests fetched'));

    if (prs.length === 0) {
      console.log(chalk.yellow('No open pull requests to merge'));
      return;
    }

    const { selectedPR } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedPR',
        message: 'Select PR to merge:',
        choices: prs.map(pr => ({
          name: `#${pr.number} - ${pr.title} (${pr.author})`,
          value: pr,
        })),
      },
    ]);

    const { mergeMethod } = await inquirer.prompt([
      {
        type: 'list',
        name: 'mergeMethod',
        message: 'Merge method:',
        choices: [
          { name: 'Merge commit', value: 'merge' },
          { name: 'Squash and merge', value: 'squash' },
          { name: 'Rebase and merge', value: 'rebase' },
        ],
      },
    ]);

    spinner.start(`Merging PR #${selectedPR.number}...`);
    
    // Note: This would require implementing the merge functionality in GitHubService
    // For now, we'll just open the PR in browser
    await open(selectedPR.url);
    spinner.succeed(chalk.green(`Opened PR #${selectedPR.number} in browser for manual merge`));

  } catch (error: any) {
    spinner.fail(chalk.red(`Failed to merge PR: ${error.message}`));
    process.exit(1);
  }
}

async function showPR(owner: string, repo: string, spinner: ora.Ora) {
  spinner.start('Fetching pull requests...');
  
  try {
    const prs = await githubService.getPullRequests(owner, repo, 'open');
    spinner.succeed(chalk.green('Pull requests fetched'));

    if (prs.length === 0) {
      console.log(chalk.yellow('No open pull requests found'));
      return;
    }

    const { selectedPR } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedPR',
        message: 'Select PR to view:',
        choices: prs.map(pr => ({
          name: `#${pr.number} - ${pr.title} (${pr.author})`,
          value: pr,
        })),
      },
    ]);

    console.log(chalk.blue.bold(`\n📋 Pull Request #${selectedPR.number}\n`));
    console.log(chalk.cyan(`Title: ${selectedPR.title}`));
    console.log(chalk.gray(`Author: ${selectedPR.author}`));
    console.log(chalk.gray(`State: ${selectedPR.state}`));
    console.log(chalk.gray(`Base: ${selectedPR.base}`));
    console.log(chalk.gray(`Head: ${selectedPR.head}`));
    console.log(chalk.gray(`Created: ${new Date(selectedPR.createdAt).toLocaleString()}`));
    console.log(chalk.gray(`Updated: ${new Date(selectedPR.updatedAt).toLocaleString()}`));
    
    if (selectedPR.additions !== undefined && selectedPR.deletions !== undefined) {
      console.log(chalk.gray(`Changes: +${selectedPR.additions} -${selectedPR.deletions}`));
    }
    
    console.log(chalk.blue(`\n📝 Description:\n${selectedPR.body}`));
    console.log(chalk.blue(`\n🔗 URL: ${selectedPR.url}`));

    const { openInBrowser } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'openInBrowser',
        message: 'Open in browser?',
        default: false,
      },
    ]);

    if (openInBrowser) {
      await open(selectedPR.url);
    }

  } catch (error: any) {
    spinner.fail(chalk.red(`Failed to fetch PR: ${error.message}`));
    process.exit(1);
  }
}