# 🚀 GitFlow CLI - Installation & Setup Guide

## 📋 Overview

**GitFlow CLI** is a powerful, AI-powered GitHub command-line interface that brings intelligent automation to your terminal. It combines traditional Git operations with advanced AI capabilities to streamline your development workflow.

### ✨ Key Features

- 🤖 **AI-Powered**: Smart commit messages, PR descriptions, and code reviews
- 🔄 **Git Operations**: Complete Git workflow management
- 🔗 **GitHub Integration**: Native GitHub API integration
- ⚙️ **Smart Configuration**: Persistent settings and preferences
- 📊 **Rich Output**: Beautiful tables and status displays
- 🎯 **Interactive**: Intuitive prompts and confirmations

## 🛠️ Installation

### Prerequisites

- Node.js 16.0.0 or higher
- npm or yarn package manager
- Git installed and configured

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/gitflow-cli.git
cd gitflow-cli
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Build the Project

```bash
npm run build
```

### Step 4: Install Globally (Optional)

```bash
npm install -g .
```

### Step 5: Verify Installation

```bash
gitflow --version
gitflow --help
```

## ⚙️ Initial Setup

### 1. Run Setup Wizard

```bash
gitflow config setup
```

This will guide you through:
- GitHub Personal Access Token configuration
- AI provider selection (OpenAI, Anthropic, or Local)
- Default preferences and settings

### 2. Manual Configuration

Alternatively, configure manually:

```bash
# Set GitHub token
gitflow config set githubToken ghp_your_github_token

# Set AI provider
gitflow config set aiProvider openai

# Set AI API key
gitflow config set aiApiKey sk-your-openai-api-key

# Set default branch
gitflow config set defaultBranch main
```

### 3. GitHub Token Setup

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Click "Generate new token"
3. Select scopes:
   - `repo` (for private repositories)
   - `public_repo` (for public repositories only)
4. Copy the token and configure it with GitFlow

### 4. AI Provider Setup

#### OpenAI (Recommended)
```bash
gitflow config set aiProvider openai
gitflow config set aiApiKey sk-your-openai-api-key
```

#### Anthropic Claude
```bash
gitflow config set aiProvider anthropic
gitflow config set aiApiKey your-anthropic-api-key
```

#### Local/None
```bash
gitflow config set aiProvider local
```

## 🚀 Quick Start Examples

### Initialize New Repository

```bash
# Local repository only
gitflow init

# Local and remote repository
gitflow init --name my-project --remote

# Private repository with description
gitflow init --name my-project --private --description "My awesome project" --remote
```

### Clone Repository

```bash
# Using owner/repo format
gitflow clone username/repository

# Using full URL
gitflow clone https://github.com/username/repository.git

# Clone specific branch
gitflow clone username/repository --branch develop
```

### Daily Workflow

```bash
# Check status
gitflow status

# Stage and commit with AI
gitflow add .
gitflow commit --ai

# Push to remote
gitflow push --set-upstream

# Create pull request with AI
gitflow pr create --ai
```

### Branch Management

```bash
# List branches
gitflow branch

# Create new feature branch
gitflow branch -c feature/new-feature

# Switch to branch
gitflow branch develop

# Delete branch
gitflow branch -d feature/old-feature
```

### AI-Powered Features

```bash
# Generate commit message
gitflow ai commit

# Review code changes
gitflow ai review

# Get repository summary
gitflow ai summary
```

## 📚 Command Reference

### Core Commands

| Command | Description | Example |
|---------|-------------|---------|
| `init` | Initialize repository | `gitflow init --remote` |
| `clone` | Clone repository | `gitflow clone user/repo` |
| `status` | Show status | `gitflow status --short` |
| `commit` | Create commit | `gitflow commit --ai` |
| `push` | Push changes | `gitflow push --set-upstream` |
| `pull` | Pull changes | `gitflow pull --rebase` |
| `branch` | Manage branches | `gitflow branch -c feature` |

### GitHub Commands

| Command | Description | Example |
|---------|-------------|---------|
| `pr list` | List pull requests | `gitflow pr list` |
| `pr create` | Create PR | `gitflow pr create --ai` |
| `pr show` | Show PR details | `gitflow pr show` |
| `issue list` | List issues | `gitflow issue list` |
| `issue create` | Create issue | `gitflow issue create --ai` |

### AI Commands

| Command | Description | Example |
|---------|-------------|---------|
| `ai commit` | Generate commit message | `gitflow ai commit` |
| `ai review` | Review code | `gitflow ai review` |
| `ai summary` | Repository summary | `gitflow ai summary` |

### Configuration Commands

| Command | Description | Example |
|---------|-------------|---------|
| `config setup` | Run setup wizard | `gitflow config setup` |
| `config list` | Show configuration | `gitflow config list` |
| `config get` | Get setting | `gitflow config get githubToken` |
| `config set` | Set setting | `gitflow config set aiProvider openai` |

## 🎯 Workflows

### Feature Branch Workflow

```bash
# 1. Create feature branch
gitflow branch -c feature/user-authentication

# 2. Work on feature
gitflow add .
gitflow commit --ai

# 3. Push and create PR
gitflow push --set-upstream
gitflow pr create --ai

# 4. After review and merge
gitflow checkout main
gitflow pull
gitflow branch -d feature/user-authentication
```

### Hotfix Workflow

```bash
# 1. Create hotfix branch
gitflow branch -c hotfix/critical-bug

# 2. Fix the issue
gitflow add .
gitflow commit -m "fix: resolve critical security issue"

# 3. Merge to main
gitflow checkout main
gitflow merge hotfix/critical-bug
gitflow push

# 4. Clean up
gitflow branch -d hotfix/critical-bug
```

### Daily Standup Script

```bash
#!/bin/bash
echo "📊 Daily Repository Status"
gitflow ai summary
echo ""
echo "🔀 Open Pull Requests"
gitflow pr list
echo ""
echo "🐛 Open Issues"
gitflow issue list
```

## 🔧 Advanced Configuration

### Environment Variables

```bash
# GitHub token
export GITHUB_TOKEN=ghp_your_token

# AI API key
export OPENAI_API_KEY=sk_your_key

# Default editor
export EDITOR=code
```

### Configuration File

Configuration is stored in `~/.gitflow/config.json`:

```json
{
  "githubToken": "ghp_your_token",
  "defaultBranch": "main",
  "aiProvider": "openai",
  "aiApiKey": "sk_your_key",
  "editor": "code",
  "autoOpenPr": false
}
```

### Custom Aliases

Add to your `.bashrc` or `.zshrc`:

```bash
# GitFlow aliases
alias gf='gitflow'
alias gfs='gitflow status'
alias gfc='gitflow commit --ai'
alias gfp='gitflow push'
alias gfr='gitflow ai review'
alias gfpr='gitflow pr create --ai'
```

## 🐛 Troubleshooting

### Common Issues

#### Authentication Errors
```bash
# Check GitHub token
gitflow config get githubToken

# Reset token
gitflow config set githubToken your_new_token

# Test authentication
gitflow pr list
```

#### AI Service Errors
```bash
# Check AI provider
gitflow config get aiProvider

# Check API key
gitflow config get aiApiKey

# Test AI functionality
gitflow ai commit
```

#### Build Issues
```bash
# Clean build
rm -rf dist/
npm run build

# Reinstall dependencies
rm -rf node_modules/
npm install
npm run build
```

### Debug Mode

```bash
# Enable verbose output
gitflow --verbose status

# Check configuration
gitflow config list

# Test Git repository
git status
```

## 📖 Additional Resources

- **Documentation**: [Full Documentation](./README.md)
- **GitHub Repository**: [gitflow-cli](https://github.com/yourusername/gitflow-cli)
- **Issues**: [Report Issues](https://github.com/yourusername/gitflow-cli/issues)
- **Discussions**: [Community Forum](https://github.com/yourusername/gitflow-cli/discussions)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `gitflow branch -c feature/new-feature`
3. Make changes and commit: `gitflow commit --ai`
4. Push and create PR: `gitflow push --set-upstream && gitflow pr create --ai`

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

**Built with ❤️ using Node.js, TypeScript, and AI**