import chalk from 'chalk';
import { Command } from 'commander';
import { table } from 'table';
import { gitService } from '../services/git';

export const statusCommand = new Command('status')
  .description('Show working tree status')
  .option('-s, --short', 'show short format')
  .option('-b, --branch', 'show branch information')
  .option('--porcelain', 'machine-readable format')
  .action(async (options) => {
    try {
      if (!(await gitService.isRepository())) {
        console.error(chalk.red('Not a git repository'));
        process.exit(1);
      }

      const status = await gitService.status();

      if (options.porcelain) {
        // Porcelain format for scripting
        status.staged.forEach(file => console.log(`A  ${file}`));
        status.changed.forEach(file => console.log(` M ${file}`));
        status.conflicts.forEach(file => console.log(`UU ${file}`));
        return;
      }

      if (options.short) {
        // Short format
        console.log(chalk.blue(`## ${status.current}${status.tracking ? `...${status.tracking}` : ''}`));
        
        if (status.ahead > 0) console.log(chalk.green(`Your branch is ahead by ${status.ahead} commit${status.ahead > 1 ? 's' : ''}`));
        if (status.behind > 0) console.log(chalk.red(`Your branch is behind by ${status.behind} commit${status.behind > 1 ? 's' : ''}`));

        if (status.staged.length > 0) {
          console.log(chalk.green('\nChanges to be committed:'));
          status.staged.forEach(file => console.log(`  ${chalk.green('new file:')} ${file}`));
        }

        if (status.changed.length > 0) {
          console.log(chalk.red('\nChanges not staged for commit:'));
          status.changed.forEach(file => console.log(`  ${chalk.red('modified:')} ${file}`));
        }

        if (status.conflicts.length > 0) {
          console.log(chalk.magenta('\nUnmerged paths:'));
          status.conflicts.forEach(file => console.log(`  ${chalk.magenta('both modified:')} ${file}`));
        }

        if (status.staged.length === 0 && status.changed.length === 0 && status.conflicts.length === 0) {
          console.log(chalk.green('Working tree clean'));
        }

        return;
      }

      // Default detailed format
      console.log(chalk.blue.bold('📊 Repository Status\n'));

      // Branch information
      const branchData = [
        ['Branch', status.current],
        ['Tracking', status.tracking || 'None'],
        ['Ahead', status.ahead.toString()],
        ['Behind', status.behind.toString()],
      ];

      console.log(chalk.yellow('Branch Information:'));
      console.log(table(branchData, {
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

      // Staged changes
      if (status.staged.length > 0) {
        console.log(chalk.green('\n✅ Staged Changes:'));
        status.staged.forEach(file => console.log(`  ${chalk.green('●')} ${file}`));
      }

      // Modified files
      if (status.changed.length > 0) {
        console.log(chalk.red('\n📝 Modified Files:'));
        status.changed.forEach(file => console.log(`  ${chalk.red('●')} ${file}`));
      }

      // Conflicts
      if (status.conflicts.length > 0) {
        console.log(chalk.magenta('\n⚠️  Conflicts:'));
        status.conflicts.forEach(file => console.log(`  ${chalk.magenta('●')} ${file}`));
      }

      // Summary
      const totalChanges = status.staged.length + status.changed.length + status.conflicts.length;
      if (totalChanges === 0) {
        console.log(chalk.green('\n✨ Working tree clean'));
      } else {
        console.log(chalk.blue(`\n📈 Summary: ${totalChanges} change${totalChanges > 1 ? 's' : ''}`));
      }

    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });