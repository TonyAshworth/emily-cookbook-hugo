const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

class RecipeManager {
  constructor(localPath) {
    this.localPath = localPath;
    this.recipesPath = path.join(localPath, 'content', 'recipes');
    this.archetypePath = path.join(localPath, 'archetypes', 'recipes.md');
  }

  // Parse frontmatter and content from a markdown file
  parseFrontmatter(content) {
    // Remove BOM if present and normalize line endings
    const cleanContent = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
    
    const frontmatterRegex = /^\+\+\+\n([\s\S]*?)\n\+\+\+\n([\s\S]*)$/;
    const match = cleanContent.match(frontmatterRegex);
    
    if (!match) {
      return {
        frontmatter: {},
        content: cleanContent.trim()
      };
    }

    try {
      const frontmatter = this.parseTomlFrontmatter(match[1]);
      return {
        frontmatter,
        content: match[2].trim()
      };
    } catch (error) {
      throw new Error(`Invalid frontmatter: ${error.message}`);
    }
  }

  // Parse TOML frontmatter (simple parser for our use case)
  parseTomlFrontmatter(toml) {
    const result = {};
    const lines = toml.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const match = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        result[key] = this.parseTomlValue(value);
      }
    }
    
    return result;
  }

  // Parse TOML values
  parseTomlValue(value) {
    value = value.trim();
    
    // String values
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
    
    // Array values
    if (value.startsWith('[') && value.endsWith(']')) {
      const arrayContent = value.slice(1, -1);
      if (!arrayContent.trim()) return [];
      
      return arrayContent
        .split(',')
        .map(item => this.parseTomlValue(item.trim()))
        .filter(item => item !== '');
    }
    
    // Boolean values
    if (value === 'true') return true;
    if (value === 'false') return false;
    
    // Number values
    if (/^\d+$/.test(value)) return parseInt(value);
    if (/^\d+\.\d+$/.test(value)) return parseFloat(value);
    
    // Default to string
    return value;
  }

  // Convert frontmatter object to TOML string
  tomlStringify(obj) {
    const lines = [];
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;
      
      if (Array.isArray(value)) {
        const arrayStr = value.map(item => `"${item}"`).join(', ');
        lines.push(`${key} = [${arrayStr}]`);
      } else if (typeof value === 'string') {
        lines.push(`${key} = "${value}"`);
      } else if (typeof value === 'boolean') {
        lines.push(`${key} = ${value}`);
      } else {
        lines.push(`${key} = ${value}`);
      }
    }
    
    return lines.join('\n');
  }

  // Create markdown content with frontmatter
  createMarkdownContent(frontmatter, content) {
    const tomlFrontmatter = this.tomlStringify(frontmatter);
    return `+++\n${tomlFrontmatter}\n+++\n\n${content}`;
  }

  // Get list of all recipes
  async getRecipeList() {
    try {
      if (!await fs.pathExists(this.recipesPath)) {
        throw new Error('Recipes directory not found');
      }

      const files = await fs.readdir(this.recipesPath);
      const recipes = [];

      for (const file of files) {
        if (path.extname(file) === '.md' && file !== '_index.md') {
          const filePath = path.join(this.recipesPath, file);
          const stats = await fs.stat(filePath);
          
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            const { frontmatter } = this.parseFrontmatter(content);
            
            recipes.push({
              filename: file,
              title: frontmatter.title || path.basename(file, '.md'),
              date: frontmatter.date,
              tags: frontmatter.tags || [],
              description: frontmatter.description || '',
              draft: frontmatter.draft || false,
              modified: stats.mtime
            });
          } catch (error) {
            console.warn(`Error reading recipe ${file}:`, error.message);
            recipes.push({
              filename: file,
              title: path.basename(file, '.md'),
              date: null,
              tags: [],
              description: 'Error reading file',
              draft: false,
              modified: stats.mtime,
              error: error.message
            });
          }
        }
      }

      return recipes.sort((a, b) => {
        if (a.date && b.date) {
          return new Date(b.date) - new Date(a.date);
        }
        return a.title.localeCompare(b.title);
      });
    } catch (error) {
      throw new Error(`Failed to get recipe list: ${error.message}`);
    }
  }

  // Read a specific recipe
  async getRecipe(filename) {
    try {
      const filePath = path.join(this.recipesPath, filename);
      
      if (!await fs.pathExists(filePath)) {
        throw new Error('Recipe file not found');
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const { frontmatter, content: body } = this.parseFrontmatter(content);
      const stats = await fs.stat(filePath);

      return {
        filename,
        frontmatter,
        content: body,
        modified: stats.mtime,
        size: stats.size
      };
    } catch (error) {
      throw new Error(`Failed to read recipe: ${error.message}`);
    }
  }

  // Create a new recipe
  async createRecipe(recipeData) {
    try {
      const { title, tags = [], description = '', content = '' } = recipeData;
      
      if (!title) {
        throw new Error('Recipe title is required');
      }

      // Generate filename from title
      const filename = this.generateFilename(title);
      const filePath = path.join(this.recipesPath, filename);
      
      // Check if file already exists
      if (await fs.pathExists(filePath)) {
        throw new Error('A recipe with this title already exists');
      }

      // Create frontmatter
      const frontmatter = {
        title,
        date: new Date().toISOString().split('T')[0],
        draft: false,
        tags: Array.isArray(tags) ? tags : [],
        categories: ['recipes'],
        description,
        ...(recipeData.prep_time && { prep_time: recipeData.prep_time }),
        ...(recipeData.cook_time && { cook_time: recipeData.cook_time }),
        ...(recipeData.total_time && { total_time: recipeData.total_time }),
        ...(recipeData.servings && { servings: recipeData.servings })
      };

      // Create default content structure if content is empty
      const defaultContent = content || this.getDefaultRecipeContent();
      
      // Create the markdown file
      const markdownContent = this.createMarkdownContent(frontmatter, defaultContent);
      await fs.writeFile(filePath, markdownContent, 'utf-8');

      return {
        filename,
        success: true,
        path: filePath
      };
    } catch (error) {
      throw new Error(`Failed to create recipe: ${error.message}`);
    }
  }

  // Update an existing recipe
  async updateRecipe(filename, recipeData) {
    try {
      const filePath = path.join(this.recipesPath, filename);
      
      if (!await fs.pathExists(filePath)) {
        throw new Error('Recipe file not found');
      }

      const { frontmatter: newFrontmatter, content } = recipeData;
      
      // Ensure required fields
      if (!newFrontmatter.title) {
        throw new Error('Recipe title is required');
      }

      // Preserve categories and ensure it includes 'recipes'
      if (!newFrontmatter.categories) {
        newFrontmatter.categories = ['recipes'];
      } else if (!newFrontmatter.categories.includes('recipes')) {
        newFrontmatter.categories.push('recipes');
      }

      // Create the markdown file
      const markdownContent = this.createMarkdownContent(newFrontmatter, content);
      await fs.writeFile(filePath, markdownContent, 'utf-8');

      return {
        filename,
        success: true,
        path: filePath
      };
    } catch (error) {
      throw new Error(`Failed to update recipe: ${error.message}`);
    }
  }

  // Delete a recipe
  async deleteRecipe(filename) {
    try {
      const filePath = path.join(this.recipesPath, filename);
      
      if (!await fs.pathExists(filePath)) {
        throw new Error('Recipe file not found');
      }

      await fs.remove(filePath);

      return {
        filename,
        success: true,
        deleted: true
      };
    } catch (error) {
      throw new Error(`Failed to delete recipe: ${error.message}`);
    }
  }

  // Generate a filename from title
  generateFilename(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      + '.md';
  }

  // Get default recipe content structure
  getDefaultRecipeContent() {
    return `## Ingredients

* 

## Instructions

1. 

## Notes

`;
  }

  // Get all unique tags from recipes
  async getAllTags() {
    try {
      const recipes = await this.getRecipeList();
      const tagSet = new Set();
      
      recipes.forEach(recipe => {
        if (recipe.tags && Array.isArray(recipe.tags)) {
          recipe.tags.forEach(tag => tagSet.add(tag));
        }
      });
      
      return Array.from(tagSet).sort();
    } catch (error) {
      throw new Error(`Failed to get tags: ${error.message}`);
    }
  }

  // Search recipes
  async searchRecipes(query) {
    try {
      const recipes = await this.getRecipeList();
      const searchTerm = query.toLowerCase();
      
      return recipes.filter(recipe => {
        return recipe.title.toLowerCase().includes(searchTerm) ||
               recipe.description.toLowerCase().includes(searchTerm) ||
               (recipe.tags && recipe.tags.some(tag => 
                 tag.toLowerCase().includes(searchTerm)
               ));
      });
    } catch (error) {
      throw new Error(`Failed to search recipes: ${error.message}`);
    }
  }

  // Validate recipe data
  validateRecipe(recipeData) {
    const errors = [];
    
    if (!recipeData.frontmatter) {
      errors.push('Frontmatter is required');
      return errors;
    }

    const { frontmatter, content } = recipeData;
    
    if (!frontmatter.title || frontmatter.title.trim() === '') {
      errors.push('Title is required');
    }
    
    if (frontmatter.tags && !Array.isArray(frontmatter.tags)) {
      errors.push('Tags must be an array');
    }
    
    if (!content || content.trim() === '') {
      errors.push('Recipe content is required');
    }
    
    // Check for required sections in content
    const hasIngredients = content.includes('## Ingredients');
    const hasInstructions = content.includes('## Instructions');
    
    if (!hasIngredients) {
      errors.push('Recipe should include an Ingredients section');
    }
    
    if (!hasInstructions) {
      errors.push('Recipe should include an Instructions section');
    }
    
    return errors;
  }
}

module.exports = RecipeManager;
