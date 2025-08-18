const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const log = require('electron-log');
const RecipeManager = require('./recipeManager');
const GitHubManager = require('./github');

// Configure logging
log.transports.file.level = 'debug';
log.transports.console.level = 'debug';
log.transports.file.maxSize = 5 * 1024 * 1024; // 5MB
log.transports.file.format = '{y}-{m}-{d} {h}:{i}:{s}.{ms} [{level}] {text}';

// Log startup information
log.info('=== Emily\'s Cookbook Manager Starting ===');
log.info(`App Version: ${app.getVersion()}`);
log.info(`Electron Version: ${process.versions.electron}`);
log.info(`Node Version: ${process.versions.node}`);
log.info(`Chrome Version: ${process.versions.chrome}`);
log.info(`Platform: ${process.platform}`);
log.info(`Architecture: ${process.arch}`);
log.info(`Working Directory: ${process.cwd()}`);

// Global error handlers
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
  log.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Keep a global reference of the window object
let mainWindow;
let configPath;

function createWindow() {
  try {
    log.info('Creating main window...');
    
    const preloadPath = path.join(__dirname, 'preload.js');
    const rendererPath = path.join(__dirname, 'renderer/index.html');
    
    log.debug(`Preload path: ${preloadPath}`);
    log.debug(`Renderer path: ${rendererPath}`);
    
    // Check if required files exist
    if (!fs.existsSync(preloadPath)) {
      log.error(`Preload file not found: ${preloadPath}`);
      throw new Error(`Preload file not found: ${preloadPath}`);
    }
    
    if (!fs.existsSync(rendererPath)) {
      log.error(`Renderer file not found: ${rendererPath}`);
      throw new Error(`Renderer file not found: ${rendererPath}`);
    }
    
    // Create the browser window
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 900,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: preloadPath
      },
      show: false, // Don't show until ready
      title: 'Emily\'s Cookbook Manager'
    });
    
    log.info('Main window created successfully');

    // Load the app
    mainWindow.loadFile(rendererPath).catch(error => {
      log.error('Failed to load renderer:', error);
      dialog.showErrorBox('Startup Error', `Failed to load application: ${error.message}`);
    });

    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
      log.info('Window ready to show');
      mainWindow.show();
    });
    
    // Handle page load errors
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      log.error(`Failed to load ${validatedURL}: ${errorCode} - ${errorDescription}`);
    });
    
    // Handle renderer process crashes
    mainWindow.webContents.on('render-process-gone', (event, details) => {
      log.error('Renderer process crashed:', details);
    });

    // Open external links in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      log.debug(`Opening external URL: ${url}`);
      shell.openExternal(url);
      return { action: 'deny' };
    });

    // Emitted when the window is closed
    mainWindow.on('closed', () => {
      log.info('Main window closed');
      mainWindow = null;
    });

    // Development tools
    if (process.argv.includes('--dev')) {
      log.info('Opening developer tools');
      mainWindow.webContents.openDevTools();
    }
    
  } catch (error) {
    log.error('Failed to create window:', error);
    dialog.showErrorBox('Startup Error', `Failed to create window: ${error.message}`);
    app.quit();
  }
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Recipe',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-recipe');
          }
        },
        {
          label: 'Open Recipe',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu-open-recipe');
          }
        },
        { type: 'separator' },
        {
          label: 'Save Recipe',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save-recipe');
          }
        },
        { type: 'separator' },
        {
          label: 'Sync with GitHub',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            mainWindow.webContents.send('menu-sync-github');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('menu-settings');
          }
        },
        {
          label: 'Preview Website',
          click: () => {
            mainWindow.webContents.send('menu-preview-website');
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Emily\'s Cookbook Manager',
              message: 'Emily\'s Cookbook Manager',
              detail: 'Version 1.0.0\nA desktop app for managing cookbook recipes\nBuilt with Electron'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Initialize config directory
function initializeConfig() {
  try {
    log.info('Initializing configuration...');
    
    const userDataPath = app.getPath('userData');
    configPath = path.join(userDataPath, 'config.json');
    
    log.debug(`User data path: ${userDataPath}`);
    log.debug(`Config path: ${configPath}`);
    
    // Ensure config directory exists
    fs.ensureDirSync(path.dirname(configPath));
    log.debug('Config directory ensured');
    
    // Create default config if it doesn't exist
    if (!fs.existsSync(configPath)) {
      log.info('Creating default configuration file');
      
      const defaultConfig = {
        github: {
          owner: 'TonyAshworth',
          repo: 'emily-cookbook-hugo',
          token: '',
          localPath: ''
        },
        app: {
          theme: 'light',
          autoSync: false,
          lastUsed: new Date().toISOString()
        }
      };
      
      fs.writeJsonSync(configPath, defaultConfig, { spaces: 2 });
      log.info('Default configuration created successfully');
    } else {
      log.info('Configuration file already exists');
    }
    
  } catch (error) {
    log.error('Failed to initialize configuration:', error);
    dialog.showErrorBox('Configuration Error', `Failed to initialize configuration: ${error.message}`);
  }
}

// App event handlers
app.whenReady().then(() => {
  initializeConfig();
  createWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers with comprehensive error handling
ipcMain.handle('get-config', async () => {
  try {
    log.debug('Reading configuration file');
    const config = await fs.readJson(configPath);
    log.debug('Configuration read successfully');
    return config;
  } catch (error) {
    log.error('Error reading config:', error);
    return null;
  }
});

ipcMain.handle('save-config', async (event, config) => {
  try {
    log.debug('Saving configuration file');
    await fs.writeJson(configPath, config, { spaces: 2 });
    log.info('Configuration saved successfully');
    return { success: true };
  } catch (error) {
    log.error('Error saving config:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('select-directory', async () => {
  try {
    log.debug('Opening directory selection dialog');
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Local Repository Directory'
    });
    
    const selectedPath = result.canceled ? null : result.filePaths[0];
    log.debug(`Directory selected: ${selectedPath || 'none'}`);
    return selectedPath;
  } catch (error) {
    log.error('Error selecting directory:', error);
    return null;
  }
});

ipcMain.handle('select-file', async (event, options = {}) => {
  try {
    log.debug('Opening file selection dialog');
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: options.filters || [
        { name: 'Markdown Files', extensions: ['md'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      title: options.title || 'Select File'
    });
    
    const selectedFile = result.canceled ? null : result.filePaths[0];
    log.debug(`File selected: ${selectedFile || 'none'}`);
    return selectedFile;
  } catch (error) {
    log.error('Error selecting file:', error);
    return null;
  }
});

ipcMain.handle('show-message', async (event, options) => {
  try {
    log.debug(`Showing message dialog: ${options.message}`);
    const result = await dialog.showMessageBox(mainWindow, options);
    log.debug(`Message dialog result: ${JSON.stringify(result)}`);
    return result;
  } catch (error) {
    log.error('Error showing message:', error);
    return { response: 0 };
  }
});

ipcMain.handle('get-app-version', () => {
  try {
    const version = app.getVersion();
    log.debug(`App version: ${version}`);
    return version;
  } catch (error) {
    log.error('Error getting app version:', error);
    return '1.0.0';
  }
});

ipcMain.handle('get-platform', () => {
  try {
    const platform = process.platform;
    log.debug(`Platform: ${platform}`);
    return platform;
  } catch (error) {
    log.error('Error getting platform:', error);
    return 'unknown';
  }
});

// Recipe Management IPC Handlers

// Helper function to create RecipeManager instance
function createRecipeManager(localPath) {
  if (!localPath) {
    throw new Error('Local repository path not configured');
  }
  return new RecipeManager(localPath);
}

// Helper function to create GitHubManager instance
function createGitHubManager(config) {
  if (!config?.github) {
    throw new Error('GitHub configuration not found');
  }
  return new GitHubManager(config);
}

ipcMain.handle('recipe-get-list', async () => {
  try {
    log.debug('Getting recipe list');
    const config = await fs.readJson(configPath);
    
    if (!config?.github?.localPath) {
      log.warn('Local path not configured');
      return [];
    }
    
    const recipeManager = createRecipeManager(config.github.localPath);
    const recipes = await recipeManager.getRecipeList();
    log.debug(`Found ${recipes.length} recipes`);
    return recipes;
  } catch (error) {
    log.error('Error getting recipe list:', error);
    return [];
  }
});

ipcMain.handle('recipe-get-details', async (event, filename) => {
  try {
    log.debug(`Getting recipe details for: ${filename}`);
    const config = await fs.readJson(configPath);
    
    if (!config?.github?.localPath) {
      throw new Error('Local path not configured');
    }
    
    const recipeManager = createRecipeManager(config.github.localPath);
    const recipe = await recipeManager.getRecipe(filename);
    log.debug(`Recipe details loaded for: ${filename}`);
    return recipe;
  } catch (error) {
    log.error(`Error getting recipe details for ${filename}:`, error);
    throw error;
  }
});

ipcMain.handle('recipe-create', async (event, recipeData) => {
  try {
    log.debug('Creating new recipe:', recipeData.title);
    const config = await fs.readJson(configPath);
    
    if (!config?.github?.localPath) {
      throw new Error('Local path not configured');
    }
    
    const recipeManager = createRecipeManager(config.github.localPath);
    const result = await recipeManager.createRecipe(recipeData);
    log.info(`Recipe created successfully: ${result.filename}`);
    return result;
  } catch (error) {
    log.error('Error creating recipe:', error);
    throw error;
  }
});

ipcMain.handle('recipe-update', async (event, filename, recipeData) => {
  try {
    log.debug(`Updating recipe: ${filename}`);
    const config = await fs.readJson(configPath);
    
    if (!config?.github?.localPath) {
      throw new Error('Local path not configured');
    }
    
    const recipeManager = createRecipeManager(config.github.localPath);
    const result = await recipeManager.updateRecipe(filename, recipeData);
    log.info(`Recipe updated successfully: ${filename}`);
    return result;
  } catch (error) {
    log.error(`Error updating recipe ${filename}:`, error);
    throw error;
  }
});

ipcMain.handle('recipe-delete', async (event, filename) => {
  try {
    log.debug(`Deleting recipe: ${filename}`);
    const config = await fs.readJson(configPath);
    
    if (!config?.github?.localPath) {
      throw new Error('Local path not configured');
    }
    
    const recipeManager = createRecipeManager(config.github.localPath);
    const result = await recipeManager.deleteRecipe(filename);
    log.info(`Recipe deleted successfully: ${filename}`);
    return result;
  } catch (error) {
    log.error(`Error deleting recipe ${filename}:`, error);
    throw error;
  }
});

ipcMain.handle('recipe-search', async (event, query) => {
  try {
    log.debug(`Searching recipes for: ${query}`);
    const config = await fs.readJson(configPath);
    
    if (!config?.github?.localPath) {
      return [];
    }
    
    const recipeManager = createRecipeManager(config.github.localPath);
    const results = await recipeManager.searchRecipes(query);
    log.debug(`Found ${results.length} search results`);
    return results;
  } catch (error) {
    log.error('Error searching recipes:', error);
    return [];
  }
});

ipcMain.handle('recipe-get-tags', async () => {
  try {
    log.debug('Getting all recipe tags');
    const config = await fs.readJson(configPath);
    
    if (!config?.github?.localPath) {
      return [];
    }
    
    const recipeManager = createRecipeManager(config.github.localPath);
    const tags = await recipeManager.getAllTags();
    log.debug(`Found ${tags.length} unique tags`);
    return tags;
  } catch (error) {
    log.error('Error getting recipe tags:', error);
    return [];
  }
});

// GitHub Sync IPC Handlers

ipcMain.handle('github-test-connection', async () => {
  try {
    log.debug('Testing GitHub connection');
    const config = await fs.readJson(configPath);
    
    const githubManager = createGitHubManager(config);
    const result = await githubManager.testConnection();
    log.info('GitHub connection test successful');
    return result;
  } catch (error) {
    log.error('GitHub connection test failed:', error);
    throw error;
  }
});

ipcMain.handle('github-validate-repository', async () => {
  try {
    log.debug('Validating local repository');
    const config = await fs.readJson(configPath);
    
    if (!config?.github?.localPath) {
      throw new Error('Local path not configured');
    }
    
    const githubManager = createGitHubManager(config);
    const result = await githubManager.validateLocalRepository(config.github.localPath);
    log.debug('Repository validation result:', result);
    return result;
  } catch (error) {
    log.error('Repository validation failed:', error);
    throw error;
  }
});

ipcMain.handle('github-clone-repository', async (event, targetPath) => {
  try {
    log.debug(`Cloning repository to: ${targetPath}`);
    const config = await fs.readJson(configPath);
    
    const githubManager = createGitHubManager(config);
    const result = await githubManager.cloneRepository(targetPath);
    log.info(`Repository cloned successfully to: ${targetPath}`);
    return result;
  } catch (error) {
    log.error('Repository clone failed:', error);
    throw error;
  }
});

ipcMain.handle('github-sync', async (event, commitMessage = 'Update recipes via Cookbook Manager') => {
  try {
    log.debug('Starting GitHub sync');
    const config = await fs.readJson(configPath);
    
    const githubManager = createGitHubManager(config);
    const result = await githubManager.sync(commitMessage);
    log.info('GitHub sync completed successfully:', result);
    return result;
  } catch (error) {
    log.error('GitHub sync failed:', error);
    throw error;
  }
});

ipcMain.handle('github-get-status', async () => {
  try {
    log.debug('Getting repository status');
    const config = await fs.readJson(configPath);
    
    const githubManager = createGitHubManager(config);
    const status = await githubManager.getStatus();
    log.debug('Repository status:', status);
    return status;
  } catch (error) {
    log.error('Failed to get repository status:', error);
    throw error;
  }
});

ipcMain.handle('github-get-commit-history', async (event, limit = 10) => {
  try {
    log.debug(`Getting commit history (limit: ${limit})`);
    const config = await fs.readJson(configPath);
    
    const githubManager = createGitHubManager(config);
    const history = await githubManager.getCommitHistory(limit);
    log.debug(`Retrieved ${history.length} commits`);
    return history;
  } catch (error) {
    log.error('Failed to get commit history:', error);
    throw error;
  }
});

ipcMain.handle('github-get-recipe-status', async () => {
  try {
    log.debug('Getting recipe-specific status');
    const config = await fs.readJson(configPath);
    
    const githubManager = createGitHubManager(config);
    const status = await githubManager.getRecipeStatus();
    log.debug('Recipe status:', status);
    return status;
  } catch (error) {
    log.error('Failed to get recipe status:', error);
    throw error;
  }
});
