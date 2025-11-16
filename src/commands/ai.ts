import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import { gitService } from '../services/git';
import { aiService } from '../services/ai';

export const aiCommand = new Command('ai')
  .description('AI-powered features')
  .argument('[action]', 'action to perform (commit, review, summary)')
  .option('-f, --file <file>', 'specific file to analyze')
  .option('--diff', 'analyze current diff')
  .action(async (action = 'commit', options) => {
    try {
      if (!(await gitService.isRepository())) {
        console.error(chalk.red('Not a git repository'));
        process.exit(1);
      }

      const spinner = ora();

      switch (action) {
        case 'commit':
          await generateCommitMessage(spinner);
          break;
        case 'review':
          await reviewCode(options, spinner);
          break;
        case 'summary':
          await generateSummary(spinner);
          break;
        default:
          console.error(chalk.red(`Unknown action: ${action}`));
          console.log(chalk.yellow('Available actions: commit, review, summary'));
          process.exit(1);
      }
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

async function generateCommitMessage(spinner: ora.Ora) {
  spinner.start('Analyzing changes...');
  
  try {
    const diff = await gitService.getDiff();
    if (!diff.trim()) {
      spinner.warn(chalk.yellow('No changes to analyze'));
      return;
    }

    spinner.text = 'Generating AI commit message...';
    const aiResponse = await aiService.generateCommitMessage(diff);
    
    spinner.succeed(chalk.green('AI commit message generated'));
    
    console.log(chalk.blue('\n🤖 AI-Generated Commit Message:'));
    console.log(chalk.cyan(`\n${aiResponse.content}\n`));
    
    const { useMessage } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useMessage',
        message: 'Use this commit message?',
        default: true,
      },
    ]);

    if (useMessage) {
      spinner.start('Staging changes and creating commit...');
      await gitService.add('.');
      const commitHash = await gitService.commit(aiResponse.content);
      spinner.succeed(chalk.green('Commit created successfully'));
      console.log(chalk.blue(`Commit: ${commitHash}`));
    } else {
      console.log(chalk.yellow('Commit cancelled'));
    }

  } catch (error: any) {
    spinner.fail(chalk.red(`Failed to generate commit message: ${error.message}`));
    process.exit(1);
  }
}

async function reviewCode(options: any, spinner: ora.Ora) {
  spinner.start('Analyzing code...');
  
  try {
    let diff = '';
    
    if (options.file) {
      // Get diff for specific file
      diff = await gitService.getDiff([options.file]);
    } else if (options.diff) {
      // Get current diff
      diff = await gitService.getDiff();
    } else {
      // Get diff for staged changes
      const status = await gitService.status();
      if (status.staged.length === 0) {
        spinner.warn(chalk.yellow('No staged changes to review'));
        return;
      }
      diff = await gitService.getDiff(status.staged);
    }

    if (!diff.trim()) {
      spinner.warn(chalk.yellow('No code changes to review'));
      return;
    }

    spinner.text = 'Performing AI code review...';
    const aiResponse = await aiService.reviewCode(diff);
    
    spinner.succeed(chalk.green('Code review completed'));
    
    console.log(chalk.blue.bold('\n🔍 AI Code Review\n'));
    console.log(chalk.white(aiResponse.content));
    
    if (aiResponse.suggestions && aiResponse.suggestions.length > 0) {
      console.log(chalk.blue('\n💡 Key Suggestions:'));
      aiResponse.suggestions.forEach((suggestion, index) => {
        console.log(chalk.cyan(`  ${index + 1}. ${suggestion}`));
      });
    }

    // Ask if user wants to apply suggestions
    const { applySuggestions } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'applySuggestions',
        message: 'Would you like to implement these suggestions?',
        default: false,
      },
    ]);

    if (applySuggestions) {
      console.log(chalk.yellow('\n📝 Please review the suggestions above and implement them manually.'));
      console.log(chalk.gray('You can use "gitflow add" and "gitflow commit" when ready.'));
    }

  } catch (error: any) {
    spinner.fail(chalk.red(`Failed to review code: ${error.message}`));
    process.exit(1);
  }
}

async function generateSummary(spinner: ora.Ora) {
  spinner.start('Analyzing repository...');
  
  try {
    // Get recent commits
    const commits = await gitService.getCommits({ limit: 10 });
    const status = await gitService.status();
    const branches = await gitService.getBranches();
    
    spinner.succeed(chalk.green('Repository analyzed'));
    
    console.log(chalk.blue.bold('\n📊 Repository Summary\n'));
    
    // Branch information
    console.log(chalk.yellow('🌿 Branch Information:'));
    console.log(chalk.gray(`Current: ${status.current}`));
    console.log(chalk.gray(`Total branches: ${branches.length}`));
    console.log(chalk.gray(`Tracking: ${status.tracking || 'None'}`));
    console.log(chalk.gray(`Ahead: ${status.ahead} commits`));
    console.log(chalk.gray(`Behind: ${status.behind} commits`));
    
    // Recent activity
    console.log(chalk.yellow('\n📝 Recent Activity:'));
    commits.slice(0, 5).forEach((commit, index) => {
      const date = new Date(commit.date).toLocaleDateString();
      console.log(chalk.gray(`  ${index + 1}. ${commit.message.substring(0, 60)}... (${date})`));
    });
    
    // Current changes
    const totalChanges = status.staged.length + status.changed.length + status.conflicts.length;
    if (totalChanges > 0) {
      console.log(chalk.yellow('\n🔄 Current Changes:'));
      if (status.staged.length > 0) {
        console.log(chalk.green(`  Staged: ${status.staged.length} files`));
      }
      if (status.changed.length > 0) {
        console.log(chalk.red(`  Modified: ${status.changed.length} files`));
      }
      if (status.conflicts.length > 0) {
        console.log(chalk.magenta(`  Conflicts: ${status.conflicts.length} files`));
      }
    } else {
      console.log(chalk.green('\n✨ Working tree is clean'));
    }

    // AI-powered insights
    if (commits.length > 0) {
      spinner.start('Generating AI insights...');
      try {
        const commitMessages = commits.map(c => c.message).join('\n');
        const aiResponse = await aiService.generateCommitMessage(
          `Repository commits:\n${commitMessages}\n\nProvide a brief summary of this repository's recent activity.`
        );
        
        spinner.succeed(chalk.green('AI insights generated'));
        console.log(chalk.blue('\n🤖 AI Insights:'));
        console.log(chalk.white(aiResponse.content));
        
      } catch (error) {
        spinner.warn(chalk.yellow('Could not generate AI insights'));
      }
    }

  } catch (error: any) {
    spinner.fail(chalk.red(`Failed to generate summary: ${error.message}`));
    process.exit(1);
  }
}