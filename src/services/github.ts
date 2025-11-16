import { Octokit } from '@octokit/rest';
import { Repository, PullRequest, Issue, Commit, Branch } from '../types';
import { configManager } from './config';

export class GitHubService {
  private octokit: Octokit | null = null;

  private getClient(): Octokit {
    if (!this.octokit) {
      const config = configManager.getConfig();
      if (!config.githubToken) {
        throw new Error('GitHub token not configured. Run "gitflow config set githubToken <token>"');
      }
      this.octokit = new Octokit({
        auth: config.githubToken,
      });
    }
    return this.octokit;
  }

  async getAuthenticatedUser(): Promise<string> {
    try {
      const client = this.getClient();
      const { data } = await client.users.getAuthenticated();
      return data.login;
    } catch (error: any) {
      throw new Error(`Failed to authenticate: ${error.message}`);
    }
  }

  async getRepository(owner: string, repo: string): Promise<Repository> {
    try {
      const client = this.getClient();
      const { data } = await client.repos.get({
        owner,
        repo,
      });

      return {
        name: data.name,
        owner: data.owner.login,
        url: data.html_url,
        private: data.private,
        description: data.description || undefined,
        language: data.language || undefined,
        stars: data.stargazers_count,
        forks: data.forks_count,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch repository: ${error.message}`);
    }
  }

  async createRepository(name: string, options: {
    description?: string;
    private?: boolean;
    autoInit?: boolean;
  } = {}): Promise<Repository> {
    try {
      const client = this.getClient();
      const { data } = await client.repos.createForAuthenticatedUser({
        name,
        description: options.description,
        private: options.private || false,
        auto_init: options.autoInit || false,
      });

      return {
        name: data.name,
        owner: data.owner.login,
        url: data.html_url,
        private: data.private,
        description: data.description || undefined,
        language: data.language || undefined,
        stars: data.stargazers_count,
        forks: data.forks_count,
      };
    } catch (error: any) {
      throw new Error(`Failed to create repository: ${error.message}`);
    }
  }

  async getPullRequests(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<PullRequest[]> {
    try {
      const client = this.getClient();
      const { data } = await client.pulls.list({
        owner,
        repo,
        state,
      });

      return data.map(pr => ({
        number: pr.number,
        title: pr.title,
        body: pr.body || '',
        state: pr.state as 'open' | 'closed',
        author: pr.user?.login || 'Unknown',
        base: pr.base.ref,
        head: pr.head.ref,
        url: pr.html_url,
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
        additions: (pr as any).additions || 0,
        deletions: (pr as any).deletions || 0,
      }));
    } catch (error: any) {
      throw new Error(`Failed to fetch pull requests: ${error.message}`);
    }
  }

  async createPullRequest(owner: string, repo: string, options: {
    title: string;
    body: string;
    head: string;
    base: string;
    draft?: boolean;
  }): Promise<PullRequest> {
    try {
      const client = this.getClient();
      const { data } = await client.pulls.create({
        owner,
        repo,
        title: options.title,
        body: options.body,
        head: options.head,
        base: options.base,
        draft: options.draft || false,
      });

      return {
        number: data.number,
        title: data.title,
        body: data.body || '',
        state: data.state as 'open' | 'closed',
        author: data.user?.login || 'Unknown',
        base: data.base.ref,
        head: data.head.ref,
        url: data.html_url,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        additions: data.additions,
        deletions: data.deletions,
      };
    } catch (error: any) {
      throw new Error(`Failed to create pull request: ${error.message}`);
    }
  }

  async getIssues(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<Issue[]> {
    try {
      const client = this.getClient();
      const { data } = await client.issues.listForRepo({
        owner,
        repo,
        state,
      });

      return data.map(issue => ({
        number: issue.number,
        title: issue.title,
        body: issue.body || '',
        state: issue.state as 'open' | 'closed',
        author: issue.user?.login || 'Unknown',
        assignees: issue.assignees?.map((a: any) => a.login) || [],
        labels: issue.labels?.map((l: any) => typeof l === 'string' ? l : l.name) || [],
        url: issue.html_url,
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
      }));
    } catch (error: any) {
      throw new Error(`Failed to fetch issues: ${error.message}`);
    }
  }

  async createIssue(owner: string, repo: string, options: {
    title: string;
    body: string;
    assignees?: string[];
    labels?: string[];
  }): Promise<Issue> {
    try {
      const client = this.getClient();
      const { data } = await client.issues.create({
        owner,
        repo,
        title: options.title,
        body: options.body,
        assignees: options.assignees,
        labels: options.labels,
      });

      return {
        number: data.number,
        title: data.title,
        body: data.body || '',
        state: data.state as 'open' | 'closed',
        author: data.user?.login || 'Unknown',
        assignees: data.assignees?.map((a: any) => a.login) || [],
        labels: data.labels?.map((l: any) => typeof l === 'string' ? l : l.name) || [],
        url: data.html_url,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error: any) {
      throw new Error(`Failed to create issue: ${error.message}`);
    }
  }

  async getBranches(owner: string, repo: string): Promise<Branch[]> {
    try {
      const client = this.getClient();
      const { data } = await client.repos.listBranches({
        owner,
        repo,
      });

      return data.map(branch => ({
        name: branch.name,
        protected: branch.protected || false,
        default: false, // Will be updated separately
        lastCommit: branch.commit.sha,
      }));
    } catch (error: any) {
      throw new Error(`Failed to fetch branches: ${error.message}`);
    }
  }

  async getCommits(owner: string, repo: string, branch: string = 'main'): Promise<Commit[]> {
    try {
      const client = this.getClient();
      const { data } = await client.repos.listCommits({
        owner,
        repo,
        sha: branch,
      });

      return data.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.author?.login || commit.commit.author?.name || 'Unknown',
        date: commit.commit.author?.date || new Date().toISOString(),
        additions: 0, // Would need additional API call for detailed stats
        deletions: 0,
      }));
    } catch (error: any) {
      throw new Error(`Failed to fetch commits: ${error.message}`);
    }
  }
}

export const githubService = new GitHubService();