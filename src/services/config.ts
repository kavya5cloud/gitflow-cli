import Conf from 'conf';
import { GitFlowConfig } from '../types';
import { join } from 'path';
import { homedir } from 'os';

class ConfigManager {
  private config: Conf<GitFlowConfig>;

  constructor() {
    this.config = new Conf<GitFlowConfig>({
      projectName: 'gitflow-cli',
      projectVersion: '1.0.0',
      cwd: join(homedir(), '.gitflow'),
      defaults: {
        defaultBranch: 'main',
        aiProvider: 'openai',
        autoOpenPr: false,
      },
    });
  }

  getConfig(): GitFlowConfig {
    return this.config.store;
  }

  set<K extends keyof GitFlowConfig>(key: K, value: GitFlowConfig[K]): void {
    this.config.set(key, value);
  }

  get<K extends keyof GitFlowConfig>(key: K): GitFlowConfig[K] | undefined {
    return this.config.get(key);
  }

  delete<K extends keyof GitFlowConfig>(key: K): void {
    this.config.delete(key);
  }

  clear(): void {
    this.config.clear();
  }

  setConfig(config: Partial<GitFlowConfig>): void {
    Object.entries(config).forEach(([key, value]) => {
      this.set(key as keyof GitFlowConfig, value);
    });
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = this.getConfig();

    if (config.githubToken && !config.githubToken.startsWith('ghp_') && !config.githubToken.startsWith('github_pat_')) {
      errors.push('GitHub token appears to be invalid');
    }

    if (config.aiProvider && !['openai', 'anthropic', 'local'].includes(config.aiProvider)) {
      errors.push('AI provider must be one of: openai, anthropic, local');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  getConfigPath(): string {
    return this.config.path;
  }
}

export const configManager = new ConfigManager();