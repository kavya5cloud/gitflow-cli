import simpleGit, { SimpleGit } from 'simple-git';
import { Commit, Branch } from '../types';
import { existsSync } from 'fs';
import { resolve } from 'path';

export class GitService {
  private git: SimpleGit;

  constructor(workingDir?: string) {
    this.git = simpleGit(workingDir);
  }

  async isRepository(): Promise<boolean> {
    try {
      await this.git.revparse('--git-dir');
      return true;
    } catch {
      return false;
    }
  }

  async init(options: { bare?: boolean; initialBranch?: string } = {}): Promise<void> {
    const args: string[] = [];
    if (options.bare) args.push('--bare');
    if (options.initialBranch) args.push('--initial-branch', options.initialBranch);
    
    await this.git.init(args);
  }

  async clone(url: string, targetPath?: string, options: { branch?: string; depth?: number } = {}): Promise<string> {
    if (targetPath && options.branch) {
      await this.git.clone(url, targetPath, ['-b', options.branch]);
    } else if (targetPath) {
      await this.git.clone(url, targetPath);
    } else {
      await this.git.clone(url);
    }

    return targetPath || resolve(url.split('/').pop()?.replace('.git', '') || '');
  }

  async status(): Promise<{
    current: string;
    tracking?: string;
    changed: string[];
    staged: string[];
    conflicts: string[];
    ahead: number;
    behind: number;
  }> {
    const status = await this.git.status();
    
    return {
      current: status.current || 'HEAD',
      tracking: status.tracking || undefined,
      changed: status.modified,
      staged: status.created.concat(status.staged),
      conflicts: status.conflicted,
      ahead: status.ahead || 0,
      behind: status.behind || 0,
    };
  }

  async add(files: string | string[]): Promise<void> {
    const fileList = Array.isArray(files) ? files : [files];
    await this.git.add(fileList);
  }

  async commit(message: string, options: { allowEmpty?: boolean; amend?: boolean } = {}): Promise<string> {
    const args: string[] = [];
    if (options.allowEmpty) args.push('--allow-empty');
    if (options.amend) args.push('--amend');
    
    const result = await this.git.commit(message, args);
    return result.commit || '';
  }

  async push(remote: string = 'origin', branch?: string, options: { force?: boolean; setUpstream?: boolean } = {}): Promise<void> {
    const args: string[] = [];
    if (options.force) args.push('--force');
    if (options.setUpstream) args.push('--set-upstream');
    
    if (branch) {
      await this.git.push(remote, branch, args);
    } else {
      await this.git.push(args);
    }
  }

  async pull(remote: string = 'origin', branch?: string): Promise<void> {
    if (branch) {
      await this.git.pull(remote, branch);
    } else {
      await this.git.pull();
    }
  }

  async fetch(remote?: string, branch?: string): Promise<void> {
    if (remote && branch) {
      await this.git.fetch(remote, branch);
    } else if (remote) {
      await this.git.fetch(remote);
    } else {
      await this.git.fetch();
    }
  }

  async createBranch(name: string, checkout: boolean = true, from?: string): Promise<void> {
    if (checkout) {
      await this.git.checkoutLocalBranch(name);
    } else {
      await this.git.branch([name]);
    }
  }

  async deleteBranch(name: string, force: boolean = false): Promise<void> {
    if (force) {
      await this.git.deleteLocalBranch(name, true);
    } else {
      await this.git.deleteLocalBranch(name);
    }
  }

  async checkout(branch: string): Promise<void> {
    await this.git.checkout(branch);
  }

  async getBranches(): Promise<Branch[]> {
    const branches = await this.git.branch();
    
    return branches.all.map(name => ({
      name,
      protected: false, // Would need additional git command to determine
      default: name === branches.current,
      ahead: 0, // Would need additional git command to determine
      behind: 0, // Would need additional git command to determine
    }));
  }

  async getCurrentBranch(): Promise<string> {
    const branches = await this.git.branch();
    return branches.current || 'HEAD';
  }

  async getCommits(options: { branch?: string; limit?: number; from?: string; to?: string } = {}): Promise<Commit[]> {
    const args: string[] = [];
    
    if (options.limit) args.push(`-${options.limit}`);
    if (options.from && options.to) {
      args.push(`${options.from}..${options.to}`);
    } else if (options.branch) {
      args.push(options.branch);
    }

    const log = await this.git.log(args);
    
    return log.all.map(commit => ({
      sha: commit.hash,
      message: commit.message,
      author: commit.author_name,
      date: commit.date,
    }));
  }

  async getRemoteUrl(remote: string = 'origin'): Promise<string | undefined> {
    try {
      const remotes = await this.git.getRemotes(true);
      const remoteConfig = remotes.find(r => r.name === remote);
      return remoteConfig?.refs.fetch;
    } catch {
      return undefined;
    }
  }

  async addRemote(name: string, url: string): Promise<void> {
    await this.git.addRemote(name, url);
  }

  async removeRemote(name: string): Promise<void> {
    await this.git.removeRemote(name);
  }

  async getDiff(files?: string[]): Promise<string> {
    if (files && files.length > 0) {
      return this.git.diff(files);
    }
    return this.git.diff();
  }

  async merge(branch: string, options: { noCommit?: boolean; squash?: boolean } = {}): Promise<void> {
    const args: string[] = [branch];
    if (options.noCommit) args.push('--no-commit');
    if (options.squash) args.push('--squash');
    
    await this.git.merge(args);
  }

  async abortMerge(): Promise<void> {
    await this.git.merge(['--abort']);
  }

  async continueMerge(): Promise<void> {
    await this.git.merge(['--continue']);
  }

  async stash(message?: string): Promise<string> {
    if (message) {
      const result = await this.git.stash(['save', message]);
      return result;
    }
    const result = await this.git.stash();
    return result;
  }

  async stashPop(): Promise<void> {
    await this.git.stash(['pop']);
  }

  async stashList(): Promise<string[]> {
    const result = await this.git.stashList();
    return result.all.map(stash => stash.message);
  }

  async reset(commit: string, mode: 'soft' | 'mixed' | 'hard' = 'mixed'): Promise<void> {
    await this.git.reset([`--${mode}`, commit]);
  }

  async revert(commit: string): Promise<void> {
    await this.git.revert(commit);
  }
}

export const gitService = new GitService();