export interface GitFlowConfig {
  githubToken?: string;
  defaultBranch?: string;
  aiProvider?: 'openai' | 'anthropic' | 'local';
  aiApiKey?: string;
  editor?: string;
  autoOpenPr?: boolean;
}

export interface Repository {
  name: string;
  owner: string;
  url: string;
  private: boolean;
  description?: string;
  language?: string;
  stars: number;
  forks: number;
}

export interface PullRequest {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed' | 'merged';
  author: string;
  base: string;
  head: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  mergeable?: boolean;
  additions?: number;
  deletions?: number;
}

export interface Issue {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  author: string;
  assignees: string[];
  labels: string[];
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
  files?: string[];
  additions?: number;
  deletions?: number;
}

export interface Branch {
  name: string;
  protected: boolean;
  default: boolean;
  lastCommit?: string;
  ahead?: number;
  behind?: number;
}

export interface AIResponse {
  content: string;
  confidence?: number;
  suggestions?: string[];
}

export interface CommandOptions {
  global?: boolean;
  force?: boolean;
  quiet?: boolean;
  verbose?: boolean;
}