const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Config management
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  
  // File system operations
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  selectFile: (options) => ipcRenderer.invoke('select-file', options),
  
  // Dialog operations
  showMessage: (options) => ipcRenderer.invoke('show-message', options),
  
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  
  // Recipe management
  recipeGetList: () => ipcRenderer.invoke('recipe-get-list'),
  recipeGetDetails: (filename) => ipcRenderer.invoke('recipe-get-details', filename),
  recipeCreate: (recipeData) => ipcRenderer.invoke('recipe-create', recipeData),
  recipeUpdate: (filename, recipeData) => ipcRenderer.invoke('recipe-update', filename, recipeData),
  recipeDelete: (filename) => ipcRenderer.invoke('recipe-delete', filename),
  recipeSearch: (query) => ipcRenderer.invoke('recipe-search', query),
  recipeGetTags: () => ipcRenderer.invoke('recipe-get-tags'),
  
  // GitHub sync
  githubTestConnection: () => ipcRenderer.invoke('github-test-connection'),
  githubValidateRepository: () => ipcRenderer.invoke('github-validate-repository'),
  githubCloneRepository: (targetPath) => ipcRenderer.invoke('github-clone-repository', targetPath),
  githubSync: (commitMessage) => ipcRenderer.invoke('github-sync', commitMessage),
  githubGetStatus: () => ipcRenderer.invoke('github-get-status'),
  githubGetRecipeStatus: () => ipcRenderer.invoke('github-get-recipe-status'),
  githubGetCommitHistory: (limit) => ipcRenderer.invoke('github-get-commit-history', limit),
  
  // Menu event listeners
  onMenuEvent: (callback) => {
    ipcRenderer.on('menu-new-recipe', () => callback('menu-new-recipe'));
    ipcRenderer.on('menu-open-recipe', () => callback('menu-open-recipe'));
    ipcRenderer.on('menu-save-recipe', () => callback('menu-save-recipe'));
    ipcRenderer.on('menu-sync-github', () => callback('menu-sync-github'));
    ipcRenderer.on('menu-settings', () => callback('menu-settings'));
    ipcRenderer.on('menu-preview-website', () => callback('menu-preview-website'));
  },
  
  // Remove menu event listeners
  removeMenuListeners: () => {
    ipcRenderer.removeAllListeners('menu-new-recipe');
    ipcRenderer.removeAllListeners('menu-open-recipe');
    ipcRenderer.removeAllListeners('menu-save-recipe');
    ipcRenderer.removeAllListeners('menu-sync-github');
    ipcRenderer.removeAllListeners('menu-settings');
    ipcRenderer.removeAllListeners('menu-preview-website');
  }
});
