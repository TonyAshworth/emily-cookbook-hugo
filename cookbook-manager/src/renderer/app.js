// Main Application Logic
class CookbookApp {
    constructor() {
        this.config = null;
        this.recipes = [];
        this.currentRecipe = null;
        this.editingRecipe = null;
        this.isEditing = false;
        
        // Global error handler for the renderer process
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.showMessage(
                `An unexpected error occurred: ${event.error.message}\n\nPlease restart the application if problems persist.`,
                'error'
            );
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.showMessage(
                `An unexpected error occurred: ${event.reason}\n\nPlease restart the application if problems persist.`,
                'error'
            );
        });
        
        this.init();
    }

    async init() {
        // Load configuration
        await this.loadConfig();
        
        // Initialize UI elements
        this.initializeElements();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Setup menu event listeners
        this.setupMenuListeners();
        
        // Load recipes if repository is configured
        if (this.isConfigured()) {
            await this.loadRecipes();
            this.showRecipeList();
        } else {
            this.showWelcomeScreen();
        }
        
        // Update status display
        this.updateStatusDisplay();
    }

    initializeElements() {
        console.log('Initializing DOM elements...');
        
        // Get DOM elements
        this.elements = {
            // Screens
            welcomeScreen: document.getElementById('welcome-screen'),
            recipeEditor: document.getElementById('recipe-editor'),
            recipeViewer: document.getElementById('recipe-viewer'),
            
            // Recipe list
            recipeList: document.getElementById('recipe-list'),
            searchInput: document.getElementById('search-input'),
            
            // Buttons
            newRecipeBtn: document.getElementById('new-recipe-btn'),
            newRecipeWelcomeBtn: document.getElementById('new-recipe-welcome-btn'),
            setupBtn: document.getElementById('setup-btn'),
            syncBtn: document.getElementById('sync-btn'),
            settingsBtn: document.getElementById('settings-btn'),
            saveBtn: document.getElementById('save-btn'),
            cancelBtn: document.getElementById('cancel-btn'),
            editBtn: document.getElementById('edit-btn'),
            deleteBtn: document.getElementById('delete-btn'),
            previewBtn: document.getElementById('preview-btn'),
            
            // Forms
            recipeForm: document.getElementById('recipe-form'),
            settingsForm: document.getElementById('settings-form'),
            
            // Modal
            settingsModal: document.getElementById('settings-modal'),
            closeSettings: document.getElementById('close-settings'),
            saveSettings: document.getElementById('save-settings'),
            testConnection: document.getElementById('test-connection'),
            browsePathBtn: document.getElementById('browse-path'),
            tokenHelp: document.getElementById('token-help'),
            
            // Status
            repoStatus: document.getElementById('repo-status'),
            lastSync: document.getElementById('last-sync'),
            
            // Editor fields
            editorTitle: document.getElementById('editor-title'),
            viewerTitle: document.getElementById('viewer-title'),
            recipeContentDisplay: document.getElementById('recipe-content-display'),
            
            // Loading
            loadingOverlay: document.getElementById('loading-overlay'),
            loadingText: document.getElementById('loading-text')
        };
        
        // Debug all element availability
        console.log('DOM Elements availability check:');
        Object.keys(this.elements).forEach(key => {
            const element = this.elements[key];
            console.log(`${key}:`, element ? 'found' : 'NOT FOUND', element);
            if (!element) {
                console.warn(`Missing DOM element: ${key}`);
            }
        });
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // New recipe buttons
        this.elements.newRecipeBtn.addEventListener('click', () => {
            console.log('New recipe button clicked');
            this.createNewRecipe();
        });
        this.elements.newRecipeWelcomeBtn.addEventListener('click', () => {
            console.log('Welcome new recipe button clicked');
            this.createNewRecipe();
        });
        
        // Setup button
        this.elements.setupBtn.addEventListener('click', () => {
            console.log('Setup button clicked');
            this.openSettings();
        });
        
        // Sync button
        this.elements.syncBtn.addEventListener('click', () => {
            console.log('Sync button clicked');
            this.syncWithGitHub();
        });
        
        // Settings modal
        this.elements.settingsBtn.addEventListener('click', () => {
            console.log('Settings button clicked');
            this.openSettings();
        });
        this.elements.closeSettings.addEventListener('click', () => this.closeSettings());
        this.elements.saveSettings.addEventListener('click', () => this.saveSettings());
        this.elements.testConnection.addEventListener('click', () => this.testConnection());
        this.elements.browsePathBtn.addEventListener('click', () => this.browsePath());
        this.elements.tokenHelp.addEventListener('click', (e) => {
            e.preventDefault();
            this.showTokenHelp();
        });
        
        // Recipe editor
        this.elements.saveBtn.addEventListener('click', () => this.saveRecipe());
        this.elements.cancelBtn.addEventListener('click', () => this.cancelEdit());
        this.elements.previewBtn.addEventListener('click', () => this.previewRecipe());
        
        // Recipe viewer
        this.elements.editBtn.addEventListener('click', () => this.editCurrentRecipe());
        this.elements.deleteBtn.addEventListener('click', () => this.deleteCurrentRecipe());
        
        // Search
        this.elements.searchInput.addEventListener('input', (e) => {
            this.filterRecipes(e.target.value);
        });
        
        // Form inputs - auto-update date
        const dateInput = document.getElementById('recipe-date');
        if (!dateInput.value) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
        
        // Close modal when clicking outside
        this.elements.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.elements.settingsModal) {
                this.closeSettings();
            }
        });
    }

    setupMenuListeners() {
        if (window.electronAPI) {
            window.electronAPI.onMenuEvent(() => {
                // We'll handle different menu events
            });
        }
    }

    // Configuration Management
    async loadConfig() {
        try {
            this.config = await window.electronAPI.getConfig();
            console.log('Config loaded:', this.config);
        } catch (error) {
            console.error('Error loading config:', error);
            this.config = null;
        }
    }

    async saveConfig() {
        try {
            const result = await window.electronAPI.saveConfig(this.config);
            return result.success;
        } catch (error) {
            console.error('Error saving config:', error);
            return false;
        }
    }

    isConfigured() {
        return this.config && 
               this.config.github.token && 
               this.config.github.localPath;
    }

    // UI State Management
    showWelcomeScreen() {
        this.hideAllScreens();
        this.elements.welcomeScreen.classList.remove('hidden');
    }

    showRecipeList() {
        // Just update the recipe list, don't change main content
        this.renderRecipeList();
    }

    showRecipeEditor(recipe = null) {
        this.hideAllScreens();
        this.elements.recipeEditor.classList.remove('hidden');
        
        if (recipe) {
            this.editingRecipe = recipe.filename;
            this.elements.editorTitle.textContent = `Edit Recipe: ${recipe.frontmatter.title}`;
            this.populateEditorForm(recipe);
            this.isEditing = true;
        } else {
            this.editingRecipe = null;
            this.elements.editorTitle.textContent = 'New Recipe';
            this.resetEditorForm();
            this.isEditing = false;
        }
    }

    showRecipeViewer(recipe) {
        this.hideAllScreens();
        this.elements.recipeViewer.classList.remove('hidden');
        this.currentRecipe = recipe.filename;
        this.elements.viewerTitle.textContent = recipe.frontmatter.title;
        this.renderRecipeContent(recipe);
    }

    hideAllScreens() {
        this.elements.welcomeScreen.classList.add('hidden');
        this.elements.recipeEditor.classList.add('hidden');
        this.elements.recipeViewer.classList.add('hidden');
    }

    // Recipe Management
    async loadRecipes() {
        if (!this.isConfigured()) {
            this.recipes = [];
            return;
        }

        try {
            this.showLoading('Loading recipes...');
            
            // This would normally load from the RecipeManager
            // For now, we'll simulate it
            this.recipes = await this.getRecipesFromRepository();
            
        } catch (error) {
            console.error('Error loading recipes:', error);
            this.showMessage('Error loading recipes: ' + error.message, 'error');
            this.recipes = [];
        } finally {
            this.hideLoading();
        }
    }

    async getRecipesFromRepository() {
        try {
            const recipes = await window.electronAPI.recipeGetList();
            return recipes;
        } catch (error) {
            console.error('Error getting recipes from repository:', error);
            throw error;
        }
    }

    async createNewRecipe() {
        if (!this.isConfigured()) {
            const setup = await this.confirmSetup();
            if (!setup) return;
        }
        
        this.showRecipeEditor();
    }

    async editCurrentRecipe() {
        if (!this.currentRecipe) return;
        
        try {
            this.showLoading('Loading recipe...');
            const recipe = await this.getRecipeDetails(this.currentRecipe);
            this.showRecipeEditor(recipe);
        } catch (error) {
            console.error('Error loading recipe for edit:', error);
            this.showMessage('Error loading recipe: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async getRecipeDetails(filename) {
        try {
            const recipe = await window.electronAPI.recipeGetDetails(filename);
            return recipe;
        } catch (error) {
            console.error('Error getting recipe details:', error);
            throw error;
        }
    }

    async saveRecipe() {
        if (!this.validateRecipeForm()) {
            return;
        }

        try {
            this.showLoading('Saving recipe...');
            
            const formData = this.getRecipeFormData();
            
            if (this.isEditing && this.editingRecipe) {
                await this.updateRecipe(this.editingRecipe, formData);
            } else {
                await this.createRecipe(formData);
            }
            
            await this.loadRecipes();
            this.showRecipeList();
            this.showMessage('Recipe saved successfully!', 'success');
            
            // Auto-sync if enabled
            if (this.config.app.autoSync) {
                await this.syncWithGitHub();
            }
            
        } catch (error) {
            console.error('Error saving recipe:', error);
            this.showMessage('Error saving recipe: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async createRecipe(formData) {
        try {
            const result = await window.electronAPI.recipeCreate(formData);
            return result;
        } catch (error) {
            console.error('Error creating recipe:', error);
            throw error;
        }
    }

    async updateRecipe(filename, formData) {
        try {
            // Convert form data to the format expected by RecipeManager
            const recipeData = {
                frontmatter: {
                    title: formData.title,
                    description: formData.description,
                    date: formData.date,
                    tags: formData.tags,
                    prep_time: formData.prep_time,
                    cook_time: formData.cook_time,
                    total_time: formData.total_time,
                    servings: formData.servings
                },
                content: formData.content
            };
            const result = await window.electronAPI.recipeUpdate(filename, recipeData);
            return result;
        } catch (error) {
            console.error('Error updating recipe:', error);
            throw error;
        }
    }

    async deleteCurrentRecipe() {
        if (!this.currentRecipe) return;
        
        const confirmed = await this.showMessage(
            'Are you sure you want to delete this recipe? This cannot be undone.',
            'confirm'
        );
        
        if (!confirmed.response) return;
        
        try {
            this.showLoading('Deleting recipe...');
            await this.deleteRecipe(this.currentRecipe);
            await this.loadRecipes();
            this.showWelcomeScreen();
            this.showMessage('Recipe deleted successfully!', 'success');
            
            // Auto-sync if enabled
            if (this.config.app.autoSync) {
                await this.syncWithGitHub();
            }
            
        } catch (error) {
            console.error('Error deleting recipe:', error);
            this.showMessage('Error deleting recipe: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async deleteRecipe(filename) {
        try {
            const result = await window.electronAPI.recipeDelete(filename);
            return result;
        } catch (error) {
            console.error('Error deleting recipe:', error);
            throw error;
        }
    }

    cancelEdit() {
        if (this.currentRecipe) {
            // Return to recipe viewer
            this.getRecipeDetails(this.currentRecipe).then(recipe => {
                this.showRecipeViewer(recipe);
            });
        } else {
            this.showWelcomeScreen();
        }
    }

    // Form Management
    validateRecipeForm() {
        const title = document.getElementById('recipe-title').value.trim();
        if (!title) {
            this.showMessage('Recipe title is required.', 'error');
            return false;
        }
        return true;
    }

    getRecipeFormData() {
        const formData = new FormData(this.elements.recipeForm);
        const data = {};
        
        // Get basic form data
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        // Process tags
        if (data.tags) {
            data.tags = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        } else {
            data.tags = [];
        }
        
        return data;
    }

    populateEditorForm(recipe) {
        document.getElementById('recipe-title').value = recipe.frontmatter.title || '';
        document.getElementById('recipe-description').value = recipe.frontmatter.description || '';
        document.getElementById('recipe-date').value = recipe.frontmatter.date || '';
        document.getElementById('recipe-tags').value = (recipe.frontmatter.tags || []).join(', ');
        document.getElementById('prep-time').value = recipe.frontmatter.prep_time || '';
        document.getElementById('cook-time').value = recipe.frontmatter.cook_time || '';
        document.getElementById('total-time').value = recipe.frontmatter.total_time || '';
        document.getElementById('servings').value = recipe.frontmatter.servings || '';
        document.getElementById('recipe-content').value = recipe.content || '';
    }

    resetEditorForm() {
        this.elements.recipeForm.reset();
        document.getElementById('recipe-date').value = new Date().toISOString().split('T')[0];
    }

    // Recipe List Rendering
    renderRecipeList() {
        const list = this.elements.recipeList;
        
        if (this.recipes.length === 0) {
            list.innerHTML = '<div class="loading">No recipes found</div>';
            return;
        }
        
        const html = this.recipes.map(recipe => `
            <div class="recipe-item" data-filename="${recipe.filename}">
                <div class="recipe-title">${recipe.title}</div>
                <div class="recipe-meta">
                    <span>${recipe.date || 'No date'}</span>
                    <span>${recipe.tags.length} tags</span>
                </div>
                <div class="recipe-tags">
                    ${recipe.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
        `).join('');
        
        list.innerHTML = html;
        
        // Add click listeners
        list.querySelectorAll('.recipe-item').forEach(item => {
            item.addEventListener('click', async () => {
                const filename = item.dataset.filename;
                try {
                    this.showLoading('Loading recipe...');
                    const recipe = await this.getRecipeDetails(filename);
                    this.showRecipeViewer(recipe);
                    
                    // Update active state
                    list.querySelectorAll('.recipe-item').forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                } catch (error) {
                    console.error('Error loading recipe:', error);
                    this.showMessage('Error loading recipe: ' + error.message, 'error');
                } finally {
                    this.hideLoading();
                }
            });
        });
    }

    filterRecipes(query) {
        if (!query.trim()) {
            this.renderRecipeList();
            return;
        }
        
        const filtered = this.recipes.filter(recipe => {
            return recipe.title.toLowerCase().includes(query.toLowerCase()) ||
                   recipe.description.toLowerCase().includes(query.toLowerCase()) ||
                   recipe.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
        });
        
        // Render filtered list (similar to renderRecipeList but with filtered data)
        this.renderFilteredRecipeList(filtered);
    }

    renderFilteredRecipeList(recipes) {
        const list = this.elements.recipeList;
        
        if (recipes.length === 0) {
            list.innerHTML = '<div class="loading">No matching recipes found</div>';
            return;
        }
        
        // Same rendering logic as renderRecipeList but with filtered recipes
        const html = recipes.map(recipe => `
            <div class="recipe-item" data-filename="${recipe.filename}">
                <div class="recipe-title">${recipe.title}</div>
                <div class="recipe-meta">
                    <span>${recipe.date || 'No date'}</span>
                    <span>${recipe.tags.length} tags</span>
                </div>
                <div class="recipe-tags">
                    ${recipe.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
        `).join('');
        
        list.innerHTML = html;
        
        // Add click listeners (same as renderRecipeList)
        list.querySelectorAll('.recipe-item').forEach(item => {
            item.addEventListener('click', async () => {
                const filename = item.dataset.filename;
                try {
                    this.showLoading('Loading recipe...');
                    const recipe = await this.getRecipeDetails(filename);
                    this.showRecipeViewer(recipe);
                    
                    list.querySelectorAll('.recipe-item').forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                } catch (error) {
                    console.error('Error loading recipe:', error);
                    this.showMessage('Error loading recipe: ' + error.message, 'error');
                } finally {
                    this.hideLoading();
                }
            });
        });
    }

    renderRecipeContent(recipe) {
        // Simple markdown-to-HTML conversion
        let html = recipe.content;
        
        // Convert headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // Convert lists
        html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
        html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
        
        // Wrap consecutive list items
        html = html.replace(/(<li>.*?<\/li>(?:\s*<li>.*?<\/li>)*)/gim, '<ul>$1</ul>');
        
        // Convert line breaks
        html = html.replace(/\n/g, '<br>');
        
        this.elements.recipeContentDisplay.innerHTML = html;
    }

    // Settings Management
    async openSettings() {
        console.log('openSettings called');
        console.log('settingsModal element:', this.elements.settingsModal);
        
        this.elements.settingsModal.classList.remove('hidden');
        console.log('Settings modal should now be visible');
        
        if (this.config) {
            console.log('Populating settings with config:', this.config);
            document.getElementById('github-token').value = this.config.github.token || '';
            document.getElementById('github-owner').value = this.config.github.owner || 'TonyAshworth';
            document.getElementById('github-repo').value = this.config.github.repo || 'emily-cookbook-hugo';
            document.getElementById('local-path').value = this.config.github.localPath || '';
            document.getElementById('auto-sync').checked = this.config.app.autoSync || false;
        } else {
            console.log('No config found, using defaults');
        }
    }

    closeSettings() {
        this.elements.settingsModal.classList.add('hidden');
    }

    async saveSettings() {
        try {
            this.showLoading('Saving settings...');
            
            const formData = new FormData(this.elements.settingsForm);
            
            this.config = {
                github: {
                    token: formData.get('token'),
                    owner: formData.get('owner'),
                    repo: formData.get('repo'),
                    localPath: formData.get('localPath')
                },
                app: {
                    theme: this.config?.app?.theme || 'light',
                    autoSync: formData.get('autoSync') === 'on',
                    lastUsed: new Date().toISOString()
                }
            };
            
            const saved = await this.saveConfig();
            if (saved) {
                this.closeSettings();
                this.showMessage('Settings saved successfully!', 'success');
                this.updateStatusDisplay();
                
                // Reload recipes if configuration is now complete
                if (this.isConfigured()) {
                    await this.loadRecipes();
                    this.showRecipeList();
                }
            } else {
                throw new Error('Failed to save settings');
            }
            
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showMessage('Error saving settings: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async testConnection() {
        try {
            this.showLoading('Testing connection...');
            
            const token = document.getElementById('github-token').value;
            const owner = document.getElementById('github-owner').value;
            const repo = document.getElementById('github-repo').value;
            
            if (!token || !owner || !repo) {
                throw new Error('Please fill in all GitHub configuration fields');
            }
            
            // Save the config temporarily to test
            const tempConfig = {
                github: {
                    token: token,
                    owner: owner,
                    repo: repo,
                    localPath: this.config?.github?.localPath || ''
                },
                app: this.config?.app || {}
            };
            
            await window.electronAPI.saveConfig(tempConfig);
            
            // Test the connection
            const result = await window.electronAPI.githubTestConnection();
            
            if (result.success) {
                this.showMessage('Connection test successful!', 'success');
            } else {
                throw new Error(result.error || 'Connection test failed');
            }
            
        } catch (error) {
            console.error('Connection test failed:', error);
            this.showMessage('Connection test failed: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async browsePath() {
        try {
            const path = await window.electronAPI.selectDirectory();
            if (path) {
                document.getElementById('local-path').value = path;
            }
        } catch (error) {
            console.error('Error selecting directory:', error);
            this.showMessage('Error selecting directory: ' + error.message, 'error');
        }
    }

    showTokenHelp() {
        const message = `To create a GitHub Personal Access Token:

1. Go to GitHub.com and sign in
2. Click your profile picture → Settings
3. Scroll down and click "Developer settings"
4. Click "Personal access tokens" → "Tokens (classic)"
5. Click "Generate new token" → "Generate new token (classic)"
6. Give it a name like "Emily's Cookbook Manager"
7. Select the following permissions:
   - repo (full control)
8. Click "Generate token"
9. Copy the token (starts with "ghp_") and paste it here

Keep this token secure - treat it like a password!`;
        
        this.showMessage(message, 'info');
    }

    // GitHub Sync
    async syncWithGitHub() {
        if (!this.isConfigured()) {
            this.showMessage('Please configure GitHub settings first.', 'error');
            return;
        }

        try {
            this.showLoading('Syncing with GitHub...');
            
            const commitMessage = 'Update recipes via Emily\'s Cookbook Manager';
            const result = await window.electronAPI.githubSync(commitMessage);
            
            if (result.success) {
                this.config.app.lastSync = new Date().toISOString();
                await this.saveConfig();
                this.updateStatusDisplay();
                this.showMessage('Sync completed successfully!', 'success');
            } else {
                throw new Error(result.error || 'Sync failed');
            }
            
        } catch (error) {
            console.error('Sync failed:', error);
            this.showMessage('Sync failed: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Utility Methods
    updateStatusDisplay() {
        if (this.isConfigured()) {
            this.elements.repoStatus.textContent = `${this.config.github.owner}/${this.config.github.repo}`;
            
            if (this.config.app.lastSync) {
                const lastSync = new Date(this.config.app.lastSync);
                this.elements.lastSync.textContent = lastSync.toLocaleString();
            } else {
                this.elements.lastSync.textContent = 'Never';
            }
        } else {
            this.elements.repoStatus.textContent = 'Not configured';
            this.elements.lastSync.textContent = 'Never';
        }
    }

    showLoading(text = 'Loading...') {
        this.elements.loadingText.textContent = text;
        this.elements.loadingOverlay.classList.remove('hidden');
    }

    hideLoading() {
        this.elements.loadingOverlay.classList.add('hidden');
    }

    async showMessage(message, type = 'info') {
        const options = {
            type: type === 'error' ? 'error' : type === 'confirm' ? 'question' : 'info',
            message: message,
            buttons: type === 'confirm' ? ['Cancel', 'OK'] : ['OK']
        };
        
        if (window.electronAPI) {
            return await window.electronAPI.showMessage(options);
        } else {
            // Fallback for development
            if (type === 'confirm') {
                return { response: confirm(message) };
            } else {
                alert(message);
                return { response: 0 };
            }
        }
    }

    async confirmSetup() {
        const result = await this.showMessage(
            'You need to configure GitHub settings first. Would you like to do that now?',
            'confirm'
        );
        
        if (result.response === 1) { // OK clicked
            this.openSettings();
            return false; // Don't continue with the original action
        }
        
        return false;
    }

    previewRecipe() {
        // This would show a preview of the recipe
        this.showMessage('Preview functionality coming soon!', 'info');
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CookbookApp();
});
