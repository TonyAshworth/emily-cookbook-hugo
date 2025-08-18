const { Octokit } = require('@octokit/rest');
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs-extra');

class GitHubManager {
  constructor(config) {
    this.config = config;
    this.octokit = null;
    this.git = null;
    
    if (config.github.token) {
      this.octokit = new Octokit({
        auth: config.github.token
      });
    }
    
    if (config.github.localPath) {
      this.git = simpleGit(config.github.localPath);
    }
  }

  // Initialize GitHub API with token
  setToken(token) {
    this.config.github.token = token;
    this.octokit = new Octokit({ auth: token });
  }

  // Set local repository path
  setLocalPath(localPath) {
    this.config.github.localPath = localPath;
    this.git = simpleGit(localPath);
  }

  // Test GitHub connection
  async testConnection() {
    if (!this.octokit) {
      throw new Error('GitHub token not configured');
    }

    try {
      const { data: user } = await this.octokit.rest.users.getAuthenticated();
      const { data: repo } = await this.octokit.rest.repos.get({
        owner: this.config.github.owner,
        repo: this.config.github.repo
      });

      return {
        success: true,
        user: user.login,
        repo: repo.name,
        permissions: repo.permissions
      };
    } catch (error) {
      throw new Error(`GitHub connection failed: ${error.message}`);
    }
  }

  // Clone repository to local path
  async cloneRepository(targetPath) {
    if (!this.octokit) {
      throw new Error('GitHub token not configured');
    }

    try {
      // Ensure target directory exists and is empty
      await fs.ensureDir(targetPath);
      const files = await fs.readdir(targetPath);
      if (files.length > 0) {
        throw new Error('Target directory is not empty');
      }

      const repoUrl = `https://github.com/${this.config.github.owner}/${this.config.github.repo}.git`;
      
      // Clone with authentication
      const git = simpleGit();
      await git.clone(`https://${this.config.github.token}@github.com/${this.config.github.owner}/${this.config.github.repo}.git`, targetPath);
      
      this.setLocalPath(targetPath);
      
      return { success: true, path: targetPath };
    } catch (error) {
      throw new Error(`Failed to clone repository: ${error.message}`);
    }
  }

  // Pull latest changes from GitHub
  async pullChanges() {
    if (!this.git) {
      throw new Error('Local repository not configured');
    }

    try {
      console.log('Starting pull operation...');
      
      // Configure git credentials
      await this.git.addConfig('user.name', 'Emily\'s Cookbook Manager');
      await this.git.addConfig('user.email', 'cookbook@emilyashworth.com');
      
      // Set up authentication for HTTPS
      const repoUrl = `https://${this.config.github.token}@github.com/${this.config.github.owner}/${this.config.github.repo}.git`;
      
      try {
        // Check if origin remote exists and update it with token
        const remotes = await this.git.getRemotes(true);
        const origin = remotes.find(r => r.name === 'origin');
        
        if (origin) {
          await this.git.removeRemote('origin');
        }
        await this.git.addRemote('origin', repoUrl);
        console.log('Remote origin configured with authentication');
      } catch (remoteError) {
        console.warn('Remote setup warning:', remoteError.message);
      }
      
      // Pull changes with timeout
      console.log('Executing git pull...');
      const result = await Promise.race([
        this.git.pull('origin', 'main'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Pull operation timed out after 30 seconds')), 30000)
        )
      ]);
      
      console.log('Pull completed successfully');
      
      return {
        success: true,
        summary: result.summary,
        files: result.files || []
      };
    } catch (error) {
      console.error('Pull operation failed:', error.message);
      throw new Error(`Failed to pull changes: ${error.message}`);
    }
  }

  // Push changes to GitHub
  async pushChanges(commitMessage = 'Update recipes via Cookbook Manager') {
    if (!this.git) {
      throw new Error('Local repository not configured');
    }

    try {
      console.log('Starting push operation...');
      
      // Check if there are any changes
      console.log('Checking git status...');
      const status = await this.git.status();
      
      if (status.files.length === 0) {
        console.log('No changes to commit');
        return { success: true, message: 'No changes to commit' };
      }
      
      console.log(`Found ${status.files.length} changed files`);

      // Configure git credentials
      await this.git.addConfig('user.name', 'Emily\'s Cookbook Manager');
      await this.git.addConfig('user.email', 'cookbook@emilyashworth.com');

      // Set up authentication for HTTPS
      const repoUrl = `https://${this.config.github.token}@github.com/${this.config.github.owner}/${this.config.github.repo}.git`;
      
      try {
        // Check if origin remote exists and update it with token
        const remotes = await this.git.getRemotes(true);
        const origin = remotes.find(r => r.name === 'origin');
        
        if (origin) {
          await this.git.removeRemote('origin');
        }
        await this.git.addRemote('origin', repoUrl);
        console.log('Remote origin configured with authentication');
      } catch (remoteError) {
        console.warn('Remote setup warning:', remoteError.message);
      }

      // Add all changes
      console.log('Adding files to git...');
      await this.git.add('.');
      
      // Commit changes
      console.log('Committing changes...');
      const commit = await this.git.commit(commitMessage);
      
      // Push to GitHub with timeout
      console.log('Pushing to GitHub...');
      const pushResult = await Promise.race([
        this.git.push('origin', 'main'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Push operation timed out after 45 seconds')), 45000)
        )
      ]);
      
      console.log('Push completed successfully');
      
      return {
        success: true,
        commit: commit.commit,
        files: status.files.map(f => ({ file: f.path, status: f.index })),
        pushed: true
      };
    } catch (error) {
      console.error('Push operation failed:', error.message);
      throw new Error(`Failed to push changes: ${error.message}`);
    }
  }

  // Check repository status
  async getStatus() {
    if (!this.git) {
      throw new Error('Local repository not configured');
    }

    try {
      const status = await this.git.status();
      const branches = await this.git.branch();
      
      return {
        current: branches.current,
        ahead: status.ahead,
        behind: status.behind,
        modified: status.modified,
        created: status.created,
        deleted: status.deleted,
        files: status.files
      };
    } catch (error) {
      throw new Error(`Failed to get repository status: ${error.message}`);
    }
  }

  // Check for recipe-specific changes only
  async getRecipeStatus() {
    if (!this.git) {
      throw new Error('Local repository not configured');
    }

    try {
      const status = await this.git.status();
      const branches = await this.git.branch();
      
      // Filter to only recipe files (content/recipes/*.md)
      const recipeFiles = status.files.filter(file => {
        const filePath = file.path.toLowerCase();
        return filePath.includes('content/recipes/') && filePath.endsWith('.md');
      });
      
      // Separate recipe files by status
      const modifiedRecipes = recipeFiles.filter(f => f.working_dir === 'M' || f.index === 'M');
      const createdRecipes = recipeFiles.filter(f => f.working_dir === '?' || f.index === 'A');
      const deletedRecipes = recipeFiles.filter(f => f.working_dir === 'D' || f.index === 'D');
      
      return {
        current: branches.current,
        ahead: status.ahead,
        behind: status.behind,
        recipeFiles: recipeFiles,
        modifiedRecipes: modifiedRecipes.map(f => f.path),
        createdRecipes: createdRecipes.map(f => f.path),
        deletedRecipes: deletedRecipes.map(f => f.path),
        hasRecipeChanges: recipeFiles.length > 0
      };
    } catch (error) {
      throw new Error(`Failed to get recipe status: ${error.message}`);
    }
  }

  // Get commit history
  async getCommitHistory(limit = 10) {
    if (!this.git) {
      throw new Error('Local repository not configured');
    }

    try {
      const log = await this.git.log({ maxCount: limit });
      
      return log.all.map(commit => ({
        hash: commit.hash,
        date: commit.date,
        message: commit.message,
        author: commit.author_name
      }));
    } catch (error) {
      throw new Error(`Failed to get commit history: ${error.message}`);
    }
  }

  // Check if local repository exists and is valid
  async validateLocalRepository(localPath) {
    try {
      if (!await fs.pathExists(localPath)) {
        return { valid: false, reason: 'Path does not exist' };
      }

      const git = simpleGit(localPath);
      const isRepo = await git.checkIsRepo();
      
      if (!isRepo) {
        return { valid: false, reason: 'Not a git repository' };
      }

      // Check if it's the correct repository
      const remotes = await git.getRemotes(true);
      const origin = remotes.find(remote => remote.name === 'origin');
      
      if (!origin) {
        return { valid: false, reason: 'No origin remote found' };
      }

      const expectedUrl = `https://github.com/${this.config.github.owner}/${this.config.github.repo}.git`;
      const actualUrl = origin.refs.fetch.replace(/^https:\/\/[^@]+@/, 'https://');
      
      if (!actualUrl.includes(`${this.config.github.owner}/${this.config.github.repo}`)) {
        return { 
          valid: false, 
          reason: `Wrong repository: expected ${this.config.github.owner}/${this.config.github.repo}` 
        };
      }

      // Check for Hugo files
      const hugoConfig = path.join(localPath, 'hugo.toml');
      const recipesDir = path.join(localPath, 'content', 'recipes');
      
      if (!await fs.pathExists(hugoConfig)) {
        return { valid: false, reason: 'Hugo configuration file not found' };
      }

      if (!await fs.pathExists(recipesDir)) {
        return { valid: false, reason: 'Recipes directory not found' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, reason: error.message };
    }
  }

  // Sync method - only commits recipe file changes with simplified authentication
  async sync(commitMessage) {
    try {
      console.log('Starting GitHub sync operation (recipes only)...');
      
      // Check for changes specifically in the recipes directory
      console.log('Checking for recipe changes to sync...');
      const status = await this.git.status();
      
      // Filter to only recipe files (content/recipes/*.md)
      const recipeFiles = status.files.filter(file => {
        const filePath = file.path.toLowerCase();
        return filePath.includes('content/recipes/') && filePath.endsWith('.md');
      });
      
      if (recipeFiles.length === 0) {
        console.log('No recipe changes to sync');
        return {
          success: true,
          message: 'No recipe changes to sync',
          pulled: false,
          pushed: false
        };
      }
      
      console.log(`Found ${recipeFiles.length} recipe files to sync:`);
      recipeFiles.forEach(file => {
        console.log(`  ${file.index || file.working_dir || '?'} ${file.path}`);
      });
      
      // Configure Git credentials - only set if not already configured
      console.log('Ensuring Git credentials are configured...');
      try {
        await this.git.addConfig('user.name', 'Emily\'s Cookbook Manager', false, 'local');
        await this.git.addConfig('user.email', 'cookbook@emilyashworth.com', false, 'local');
      } catch (configError) {
        console.log('Git config already set or failed to set:', configError.message);
      }
      
      // Add only recipe files to staging
      console.log('Staging recipe changes...');
      for (const file of recipeFiles) {
        await this.git.add(file.path);
        console.log(`  Staged: ${file.path}`);
      }
      
      // Commit recipe changes only
      console.log('Committing recipe changes...');
      const commit = await this.git.commit(commitMessage || `Update ${recipeFiles.length} recipe(s) via Cookbook Manager`);
      console.log(`Created commit: ${commit.commit}`);
      
      // First, let's check what remotes exist
      console.log('Checking existing remotes...');
      const remotes = await this.git.getRemotes(true);
      console.log('Current remotes:', remotes.map(r => `${r.name}: ${r.refs.push}`));
      
      // Try push with existing remote first (should have token already)
      console.log('Attempting push with existing remote configuration...');
      try {
        const pushResult = await Promise.race([
          this.git.push('origin', 'main'),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Push timed out after 25 seconds')), 25000)
          )
        ]);
        
        console.log('Recipe sync completed successfully with existing remote');
        
        return {
          success: true,
          message: `Successfully synced ${recipeFiles.length} recipe file(s)`,
          pulled: false,
          pushed: true,
          commit: commit.commit,
          files: recipeFiles.map(f => ({ file: f.path, status: f.index || f.working_dir }))
        };
        
      } catch (pushError) {
        console.error('Push failed with existing remote:', pushError.message);
        
        // If it's a timeout, just throw the error
        if (pushError.message.includes('timed out')) {
          throw pushError;
        }
        
        // Try updating the remote with current token
        console.log('Attempting to update remote with current token...');
        const authenticatedUrl = `https://${this.config.github.token}@github.com/${this.config.github.owner}/${this.config.github.repo}.git`;
        
        try {
          // Update the remote URL
          await this.git.remote(['set-url', 'origin', authenticatedUrl]);
          console.log('Remote URL updated with token');
          
          // Try push again
          const retryPushResult = await Promise.race([
            this.git.push('origin', 'main'),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Retry push timed out after 20 seconds')), 20000)
            )
          ]);
          
          console.log('Recipe sync completed successfully after remote update');
          
          return {
            success: true,
            message: `Successfully synced ${recipeFiles.length} recipe file(s)`,
            pulled: false,
            pushed: true,
            commit: commit.commit,
            files: recipeFiles.map(f => ({ file: f.path, status: f.index || f.working_dir }))
          };
          
        } catch (retryError) {
          console.error('Retry push also failed:', retryError.message);
          throw retryError;
        }
      }
      
    } catch (error) {
      console.error('Recipe sync operation failed:', error.message);
      
      // Provide helpful error messages based on common issues
      if (error.message.includes('timeout') || error.message.includes('timed out')) {
        throw new Error('Recipe sync timed out. This might be due to network issues or authentication problems. Please check your internet connection and GitHub token.');
      } else if (error.message.includes('nothing to commit')) {
        return {
          success: true,
          message: 'No recipe changes to sync',
          pulled: false,
          pushed: false
        };
      } else if (error.message.includes('authentication') || error.message.includes('403') || error.message.includes('401')) {
        throw new Error('Authentication failed. Please verify your GitHub token has write access to the repository.');
      } else if (error.message.includes('not found') || error.message.includes('404')) {
        throw new Error('Repository not found. Please check your GitHub repository settings.');
      } else if (error.message.includes('non-fast-forward')) {
        throw new Error('Push rejected due to conflicts. The remote repository has changes that conflict with your local recipes.');
      } else {
        throw new Error(`Recipe sync failed: ${error.message}`);
      }
    }
  }
}

module.exports = GitHubManager;
