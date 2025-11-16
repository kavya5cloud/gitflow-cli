# GitFlow CLI

🚀 **AI-powered GitHub CLI** - brings GitHub to your terminal with intelligent automation

## Features

### 🤖 AI-Powered Features
- **Smart Commit Messages**: Generate conventional commit messages using AI
- **PR Descriptions**: Automatically create pull request descriptions
- **Code Reviews**: AI-powered code review and suggestions
- **Issue Management**: Generate clear issue titles and descriptions

### 📚 Core Git Operations
- Repository initialization and cloning
- Status monitoring with detailed insights
- Commit management with AI assistance
- Branch operations and management
- Push/pull with conflict resolution

### 🔗 GitHub Integration
- Pull request creation and management
- Issue tracking and management
- Remote repository operations
- Real-time synchronization

### ⚙️ Configuration Management
- Persistent configuration storage
- Multiple AI provider support (OpenAI, Anthropic)
- Customizable settings and preferences
- Easy setup wizard

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/gitflow-cli.git
cd gitflow-cli

# Install dependencies
npm install

# Build the project
npm run build

# Install globally
npm install -g .
```

## Quick Start

### 1. Initial Setup
```bash
# Run the setup wizard
gitflow config setup

# Or configure manually
gitflow config set githubToken your_github_token
gitflow config set aiApiKey your_ai_api_key
```

### 2. Basic Usage

#### Initialize a new repository
```bash
# Local repository only
gitflow init

# Local and remote repository
gitflow init --name my-project --remote

# Private repository
gitflow init --name my-project --private --remote
```

#### Clone a repository
```bash
# Using owner/repo format
gitflow clone username/repository

# Using full URL
gitflow clone https://github.com/username/repository.git

# Clone specific branch
gitflow clone username/repository --branch develop
```

#### Check status
```bash
# Detailed status
gitflow status

# Short format
gitflow status --short

# Branch information
gitflow status --branch
```

#### Make commits with AI
```bash
# AI-powered commit message
gitflow commit --ai

# Traditional commit
gitflow commit -m "feat: add new feature"

# Stage all changes and commit
gitflow commit -a --ai
```

#### Push and pull
```bash
# Push to remote
gitflow push

# Push with upstream tracking
gitflow push --set-upstream

# Pull with rebase
gitflow pull --rebase
```

#### Branch management
```bash
# List branches
gitflow branch

# Create and checkout new branch
gitflow branch -c feature/new-feature

# Delete branch
gitflow branch -d feature/old-feature

# Checkout existing branch
gitflow branch develop
```

### 3. GitHub Operations

#### Pull Requests
```bash
# List open PRs
gitflow pr list

# Create PR with AI description
gitflow pr create --ai

# Create draft PR
gitflow pr create --draft

# View PR details
gitflow pr show
```

#### Issues
```bash
# List issues
gitflow issue list

# Create issue with AI title
gitflow issue create --ai

# Create issue with labels
gitflow issue create --title "Bug report" --labels "bug,urgent"

# View issue details
gitflow issue show
```

### 4. AI Features

#### Generate commit messages
```bash
# Analyze current changes and generate message
gitflow ai commit

# Review staged changes
gitflow ai review --diff

# Get repository summary
gitflow ai summary
```

#### Code review
```bash
# Review current changes
gitflow ai review

# Review specific file
gitflow ai review --file src/app.js

# Review staged changes
gitflow ai review --diff
```

## Configuration

### Setup Wizard
```bash
gitflow config setup
```

### Manual Configuration
```bash
# GitHub token
gitflow config set githubToken ghp_xxxxxxxxxxxxxxxxxxxx

# AI provider (openai, anthropic, local)
gitflow config set aiProvider openai

# AI API key
gitflow config set aiApiKey sk-xxxxxxxxxxxxxxxxxxxx

# Default branch
gitflow config set defaultBranch main

# Auto-open PRs in browser
gitflow config set autoOpenPr true
```

### View Configuration
```bash
# List all settings
gitflow config list

# Get specific setting
gitflow config get githubToken
```

## AI Providers

### OpenAI (GPT)
```bash
gitflow config set aiProvider openai
gitflow config set aiApiKey sk-your-openai-api-key
```

### Anthropic (Claude)
```bash
gitflow config set aiProvider anthropic
gitflow config set aiApiKey your-anthropic-api-key
```

### Local/None
```bash
gitflow config set aiProvider local
```

## Advanced Usage

### Custom Workflows

#### Feature Branch Workflow
```bash
# Create feature branch
gitflow branch -c feature/new-feature

# Work on changes...
gitflow add .
gitflow commit --ai

# Push and create PR
gitflow push --set-upstream
gitflow pr create --ai
```

#### Hotfix Workflow
```bash
# Create hotfix branch
gitflow branch -c hotfix/critical-bug

# Quick fix
gitflow add .
gitflow commit -m "fix: resolve critical bug"

# Merge and push
gitflow checkout main
gitflow merge hotfix/critical-bug
gitflow push
```

### Automation Scripts

#### Daily Standup Script
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

#### Release Preparation
```bash
#!/bin/bash
echo "🚀 Preparing Release"
gitflow checkout main
gitflow pull
gitflow status
echo ""
echo "📝 Recent Commits"
gitflow ai summary
```

## API Integration

### GitHub Token Setup
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token with appropriate scopes:
   - `repo` (for private repositories)
   - `public_repo` (for public repositories)
   - `read:org` (for organization access)

### AI API Setup

#### OpenAI
1. Sign up at OpenAI Platform
2. Create API key
3. Configure with `gitflow config set aiProvider openai`

#### Anthropic
1. Sign up at Anthropic Console
2. Create API key
3. Configure with `gitflow config set aiProvider anthropic`

## Troubleshooting

### Common Issues

#### Authentication Errors
```bash
# Check GitHub token
gitflow config get githubToken

# Reset and reconfigure
gitflow config set githubToken your_new_token
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

#### Git Repository Issues
```bash
# Check if in git repository
git status

# Initialize if needed
gitflow init

# Check remote configuration
git remote -v
```

### Debug Mode
```bash
# Enable verbose output
gitflow --verbose status

# Check configuration
gitflow config list
```

## Contributing

1. Fork the repository
2. Create feature branch: `gitflow branch -c feature/new-feature`
3. Make changes and commit: `gitflow commit --ai`
4. Push and create PR: `gitflow push --set-upstream && gitflow pr create --ai`

## License

MIT License - see LICENSE file for details

## Support

- 📖 Documentation: [Wiki](https://github.com/yourusername/gitflow-cli/wiki)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/gitflow-cli/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/gitflow-cli/discussions)

---

**Built with ❤️ using Node.js, TypeScript, and AI**test change
