import { configManager } from './config';
import { AIResponse } from '../types';
import axios from 'axios';

export class AIService {
  private getApiKey(): string {
    const config = configManager.getConfig();
    if (!config.aiApiKey) {
      throw new Error('AI API key not configured. Run "gitflow config set aiApiKey <key>"');
    }
    return config.aiApiKey;
  }

  private getProvider(): string {
    return configManager.getConfig().aiProvider || 'openai';
  }

  async generateCommitMessage(diff: string): Promise<AIResponse> {
    const provider = this.getProvider();
    
    switch (provider) {
      case 'openai':
        return this.generateWithOpenAI(diff, 'commit');
      case 'anthropic':
        return this.generateWithAnthropic(diff, 'commit');
      default:
        throw new Error(`AI provider ${provider} not supported`);
    }
  }

  async generatePRDescription(title: string, diff: string): Promise<AIResponse> {
    const provider = this.getProvider();
    
    switch (provider) {
      case 'openai':
        return this.generateWithOpenAI(diff, 'pr', { title });
      case 'anthropic':
        return this.generateWithAnthropic(diff, 'pr', { title });
      default:
        throw new Error(`AI provider ${provider} not supported`);
    }
  }

  async reviewCode(diff: string): Promise<AIResponse> {
    const provider = this.getProvider();
    
    switch (provider) {
      case 'openai':
        return this.generateWithOpenAI(diff, 'review');
      case 'anthropic':
        return this.generateWithAnthropic(diff, 'review');
      default:
        throw new Error(`AI provider ${provider} not supported`);
    }
  }

  async generateIssueTitle(description: string): Promise<AIResponse> {
    const provider = this.getProvider();
    
    switch (provider) {
      case 'openai':
        return this.generateWithOpenAI(description, 'issue');
      case 'anthropic':
        return this.generateWithAnthropic(description, 'issue');
      default:
        throw new Error(`AI provider ${provider} not supported`);
    }
  }

  private async generateWithOpenAI(input: string, type: string, context?: any): Promise<AIResponse> {
    const apiKey = this.getApiKey();
    const prompt = this.buildPrompt(input, type, context);

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(type)
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const content = response.data.choices[0]?.message?.content || '';
      return this.parseResponse(content, type);
    } catch (error: any) {
      throw new Error(`OpenAI API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  private async generateWithAnthropic(input: string, type: string, context?: any): Promise<AIResponse> {
    const apiKey = this.getApiKey();
    const prompt = this.buildPrompt(input, type, context);

    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-sonnet-20240229',
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: `${this.getSystemPrompt(type)}\n\n${prompt}`
            }
          ],
        },
        {
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
          },
        }
      );

      const content = response.data.content[0]?.text || '';
      return this.parseResponse(content, type);
    } catch (error: any) {
      throw new Error(`Anthropic API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  private getSystemPrompt(type: string): string {
    switch (type) {
      case 'commit':
        return 'You are an expert developer writing clear, concise git commit messages following conventional commit format. Always use the format: type(scope): description. Keep descriptions under 72 characters.';
      case 'pr':
        return 'You are an expert developer writing clear, professional pull request descriptions. Include a summary, changes made, and any testing notes.';
      case 'review':
        return 'You are an expert code reviewer. Provide constructive feedback on code quality, potential bugs, improvements, and best practices. Be specific and helpful.';
      case 'issue':
        return 'You are an expert developer creating clear, concise GitHub issue titles. Summarize the core problem or feature request in under 60 characters.';
      default:
        return 'You are an expert developer assistant.';
    }
  }

  private buildPrompt(input: string, type: string, context?: any): string {
    switch (type) {
      case 'commit':
        return `Based on this git diff, generate an appropriate commit message:\n\n${input}`;
      case 'pr':
        return `Based on this pull request title and diff, generate a professional PR description:\n\nTitle: ${context?.title}\n\nDiff:\n${input}`;
      case 'review':
        return `Review this code diff and provide constructive feedback:\n\n${input}`;
      case 'issue':
        return `Based on this description, generate a clear, concise GitHub issue title:\n\n${input}`;
      default:
        return input;
    }
  }

  private parseResponse(content: string, type: string): AIResponse {
    const cleaned = content.trim();
    
    switch (type) {
      case 'commit':
        // Extract the first line for commit message
        const firstLine = cleaned.split('\n')[0];
        return {
          content: firstLine,
          confidence: 0.8,
        };
      case 'pr':
        return {
          content: cleaned,
          confidence: 0.85,
        };
      case 'review':
        // Parse review points
        const suggestions = cleaned.split('\n')
          .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
          .map(line => line.replace(/^[-*]\s*/, '').trim());
        
        return {
          content: cleaned,
          confidence: 0.75,
          suggestions: suggestions.length > 0 ? suggestions : undefined,
        };
      case 'issue':
        return {
          content: cleaned.split('\n')[0].replace(/^["']|["']$/g, ''),
          confidence: 0.8,
        };
      default:
        return {
          content: cleaned,
          confidence: 0.7,
        };
    }
  }
}

export const aiService = new AIService();