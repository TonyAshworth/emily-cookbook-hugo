const fs = require('fs-extra');
const path = require('path');
const RecipeManager = require('../../src/recipeManager');
const { 
  sampleRecipeMarkdown, 
  sampleRecipeParsed, 
  sampleRecipeList,
  invalidRecipeMarkdown,
  sampleFormData 
} = require('../fixtures/sampleRecipes');

// Mock fs-extra
jest.mock('fs-extra');
jest.mock('path');

describe('RecipeManager', () => {
  let recipeManager;
  const mockLocalPath = '/mock/cookbook/path';

  beforeEach(() => {
    jest.clearAllMocks();
    recipeManager = new RecipeManager(mockLocalPath);
  });

  describe('constructor', () => {
    test('should initialize with correct paths', () => {
      expect(recipeManager.localPath).toBe(mockLocalPath);
      expect(path.join).toHaveBeenCalledWith(mockLocalPath, 'content', 'recipes');
      expect(path.join).toHaveBeenCalledWith(mockLocalPath, 'archetypes', 'recipes.md');
    });
  });

  describe('parseFrontmatter', () => {
    test('should parse valid TOML frontmatter correctly', () => {
      const result = recipeManager.parseFrontmatter(sampleRecipeMarkdown);
      
      expect(result.frontmatter.title).toBe('Chocolate Chip Cookies');
      expect(result.frontmatter.date).toBe('2024-01-15');
      expect(result.frontmatter.tags).toEqual(['dessert', 'cookies', 'easy']);
      expect(result.frontmatter.draft).toBe(false);
      expect(result.content).toContain('## Ingredients');
    });

    test('should handle content without frontmatter', () => {
      const contentWithoutFrontmatter = 'Just plain content without frontmatter';
      const result = recipeManager.parseFrontmatter(contentWithoutFrontmatter);
      
      expect(result.frontmatter).toEqual({});
      expect(result.content).toBe(contentWithoutFrontmatter);
    });

    test('should handle malformed TOML frontmatter', () => {
      // The simple TOML parser is lenient and doesn't throw errors for malformed TOML
      // It just returns what it can parse
      const result = recipeManager.parseFrontmatter(invalidRecipeMarkdown);
      
      expect(result.frontmatter).toBeDefined();
      expect(result.content).toContain('This is a recipe with invalid frontmatter');
    });
  });

  describe('parseTomlFrontmatter', () => {
    test('should parse simple TOML values', () => {
      const toml = `title = "Test Recipe"
date = "2024-01-01"
draft = false
servings = 4`;
      
      const result = recipeManager.parseTomlFrontmatter(toml);
      
      expect(result.title).toBe('Test Recipe');
      expect(result.date).toBe('2024-01-01');
      expect(result.draft).toBe(false);
      expect(result.servings).toBe(4);
    });

    test('should parse array values', () => {
      const toml = `tags = ["dessert", "cookies", "easy"]`;
      const result = recipeManager.parseTomlFrontmatter(toml);
      
      expect(result.tags).toEqual(['dessert', 'cookies', 'easy']);
    });

    test('should skip comments and empty lines', () => {
      const toml = `# This is a comment
title = "Test Recipe"

# Another comment
date = "2024-01-01"`;
      
      const result = recipeManager.parseTomlFrontmatter(toml);
      
      expect(result.title).toBe('Test Recipe');
      expect(result.date).toBe('2024-01-01');
    });
  });

  describe('parseTomlValue', () => {
    test('should parse string values', () => {
      expect(recipeManager.parseTomlValue('"test string"')).toBe('test string');
      expect(recipeManager.parseTomlValue("'test string'")).toBe('test string');
    });

    test('should parse boolean values', () => {
      expect(recipeManager.parseTomlValue('true')).toBe(true);
      expect(recipeManager.parseTomlValue('false')).toBe(false);
    });

    test('should parse number values', () => {
      expect(recipeManager.parseTomlValue('42')).toBe(42);
      expect(recipeManager.parseTomlValue('3.14')).toBe(3.14);
    });

    test('should parse array values', () => {
      expect(recipeManager.parseTomlValue('["a", "b", "c"]')).toEqual(['a', 'b', 'c']);
      expect(recipeManager.parseTomlValue('[]')).toEqual([]);
    });

    test('should return string for unrecognized values', () => {
      expect(recipeManager.parseTomlValue('unquoted_string')).toBe('unquoted_string');
    });
  });

  describe('tomlStringify', () => {
    test('should convert object to TOML string', () => {
      const obj = {
        title: 'Test Recipe',
        tags: ['test', 'recipe'],
        draft: false,
        servings: 4
      };
      
      const result = recipeManager.tomlStringify(obj);
      
      expect(result).toContain('title = "Test Recipe"');
      expect(result).toContain('tags = ["test", "recipe"]');
      expect(result).toContain('draft = false');
      expect(result).toContain('servings = 4');
    });

    test('should skip null and undefined values', () => {
      const obj = {
        title: 'Test Recipe',
        nullValue: null,
        undefinedValue: undefined,
        emptyString: ''
      };
      
      const result = recipeManager.tomlStringify(obj);
      
      expect(result).toContain('title = "Test Recipe"');
      expect(result).not.toContain('nullValue');
      expect(result).not.toContain('undefinedValue');
      expect(result).toContain('emptyString = ""');
    });
  });

  describe('createMarkdownContent', () => {
    test('should create properly formatted markdown with frontmatter', () => {
      const frontmatter = { title: 'Test Recipe', tags: ['test'] };
      const content = '## Test Content';
      
      const result = recipeManager.createMarkdownContent(frontmatter, content);
      
      expect(result).toMatch(/^\+\+\+\n.*\n\+\+\+\n\n## Test Content$/s);
      expect(result).toContain('title = "Test Recipe"');
      expect(result).toContain('tags = ["test"]');
    });
  });

  describe('getRecipeList', () => {
    test('should return list of recipes', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readdir.mockResolvedValue(['recipe1.md', 'recipe2.md', '_index.md', 'not-md.txt']);
      fs.stat.mockResolvedValue({ mtime: new Date('2024-01-01') });
      fs.readFile.mockResolvedValue(sampleRecipeMarkdown);
      
      const result = await recipeManager.getRecipeList();
      
      expect(result).toHaveLength(2); // Only .md files, excluding _index.md
      expect(result[0]).toHaveProperty('filename');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('tags');
    });

    test('should throw error if recipes directory does not exist', async () => {
      fs.pathExists.mockResolvedValue(false);
      
      await expect(recipeManager.getRecipeList()).rejects.toThrow('Failed to get recipe list');
    });

    test('should handle recipe files with errors', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readdir.mockResolvedValue(['good.md', 'bad.md']);
      fs.stat.mockResolvedValue({ mtime: new Date('2024-01-01') });
      
      // Mock the file reads - first one succeeds, second one fails
      fs.readFile
        .mockImplementationOnce(() => Promise.resolve(sampleRecipeMarkdown))
        .mockImplementationOnce(() => Promise.reject(new Error('File read error')));
      
      const result = await recipeManager.getRecipeList();
      
      expect(result).toHaveLength(2);
      
      // Find the recipes by their characteristics
      const goodRecipe = result.find(r => r.title === 'Chocolate Chip Cookies');
      const badRecipe = result.find(r => r.error);
      
      // Check that the good recipe loaded normally
      expect(goodRecipe).toBeDefined();
      expect(goodRecipe.title).toBe('Chocolate Chip Cookies');
      
      // Check that the bad recipe has error properties
      expect(badRecipe).toBeDefined();
      expect(badRecipe).toHaveProperty('error', 'File read error');
      expect(badRecipe.description).toBe('Error reading file');
    });

    test('should sort recipes by date and title', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readdir.mockResolvedValue(['recipe1.md', 'recipe2.md']);
      fs.stat.mockResolvedValue({ mtime: new Date('2024-01-01') });
      
      const recipe1 = sampleRecipeMarkdown.replace('2024-01-15', '2024-01-10');
      const recipe2 = sampleRecipeMarkdown.replace('Chocolate Chip Cookies', 'Apple Pie');
      
      fs.readFile
        .mockResolvedValueOnce(recipe1)
        .mockResolvedValueOnce(recipe2);
      
      const result = await recipeManager.getRecipeList();
      
      // Should be sorted by date (newer first)
      expect(result[0].date).toBe('2024-01-15');
      expect(result[1].date).toBe('2024-01-10');
    });
  });

  describe('getRecipe', () => {
    test('should return recipe details', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readFile.mockResolvedValue(sampleRecipeMarkdown);
      fs.stat.mockResolvedValue({ 
        mtime: new Date('2024-01-01'),
        size: 1000
      });
      
      const result = await recipeManager.getRecipe('test.md');
      
      expect(result.filename).toBe('test.md');
      expect(result.frontmatter.title).toBe('Chocolate Chip Cookies');
      expect(result.content).toContain('## Ingredients');
      expect(result.modified).toEqual(new Date('2024-01-01'));
      expect(result.size).toBe(1000);
    });

    test('should throw error if recipe file does not exist', async () => {
      fs.pathExists.mockResolvedValue(false);
      
      await expect(recipeManager.getRecipe('nonexistent.md')).rejects.toThrow('Failed to read recipe');
    });
  });

  describe('createRecipe', () => {
    test('should create new recipe successfully', async () => {
      fs.pathExists.mockResolvedValue(false); // File doesn't exist
      fs.writeFile.mockResolvedValue();
      
      const result = await recipeManager.createRecipe(sampleFormData);
      
      expect(result.success).toBe(true);
      expect(result.filename).toBe('test-recipe.md');
      expect(fs.writeFile).toHaveBeenCalled();
    });

    test('should throw error if recipe title is missing', async () => {
      const dataWithoutTitle = { ...sampleFormData, title: '' };
      
      await expect(recipeManager.createRecipe(dataWithoutTitle)).rejects.toThrow('Recipe title is required');
    });

    test('should throw error if recipe already exists', async () => {
      fs.pathExists.mockResolvedValue(true);
      
      await expect(recipeManager.createRecipe(sampleFormData)).rejects.toThrow('A recipe with this title already exists');
    });

    test('should generate filename from title', async () => {
      fs.pathExists.mockResolvedValue(false);
      fs.writeFile.mockResolvedValue();
      
      const testData = { title: 'My Test Recipe!@#$' };
      const result = await recipeManager.createRecipe(testData);
      
      expect(result.filename).toBe('my-test-recipe.md');
    });
  });

  describe('updateRecipe', () => {
    test('should update existing recipe', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.writeFile.mockResolvedValue();
      
      const recipeData = {
        frontmatter: { title: 'Updated Recipe', tags: ['updated'] },
        content: 'Updated content'
      };
      
      const result = await recipeManager.updateRecipe('test.md', recipeData);
      
      expect(result.success).toBe(true);
      expect(result.filename).toBe('test.md');
      expect(fs.writeFile).toHaveBeenCalled();
    });

    test('should throw error if recipe does not exist', async () => {
      fs.pathExists.mockResolvedValue(false);
      
      const recipeData = { frontmatter: { title: 'Test' }, content: 'Content' };
      await expect(recipeManager.updateRecipe('nonexistent.md', recipeData)).rejects.toThrow('Recipe file not found');
    });

    test('should ensure recipes category is included', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.writeFile.mockResolvedValue();
      
      const recipeData = {
        frontmatter: { title: 'Test Recipe', categories: ['other'] },
        content: 'Content'
      };
      
      await recipeManager.updateRecipe('test.md', recipeData);
      
      const writeCall = fs.writeFile.mock.calls[0][1];
      expect(writeCall).toContain('categories = ["other", "recipes"]');
    });
  });

  describe('deleteRecipe', () => {
    test('should delete recipe successfully', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.remove.mockResolvedValue();
      
      const result = await recipeManager.deleteRecipe('test.md');
      
      expect(result.success).toBe(true);
      expect(result.deleted).toBe(true);
      expect(fs.remove).toHaveBeenCalled();
    });

    test('should throw error if recipe does not exist', async () => {
      fs.pathExists.mockResolvedValue(false);
      
      await expect(recipeManager.deleteRecipe('nonexistent.md')).rejects.toThrow('Recipe file not found');
    });
  });

  describe('generateFilename', () => {
    test('should generate valid filename from title', () => {
      expect(recipeManager.generateFilename('Chocolate Chip Cookies')).toBe('chocolate-chip-cookies.md');
      expect(recipeManager.generateFilename('Test Recipe!@#$%')).toBe('test-recipe.md');
      expect(recipeManager.generateFilename('Multiple   Spaces')).toBe('multiple-spaces.md');
      expect(recipeManager.generateFilename('-Leading-Trailing-')).toBe('leading-trailing.md');
    });
  });

  describe('getDefaultRecipeContent', () => {
    test('should return default recipe template', () => {
      const defaultContent = recipeManager.getDefaultRecipeContent();
      
      expect(defaultContent).toContain('## Ingredients');
      expect(defaultContent).toContain('## Instructions');
      expect(defaultContent).toContain('## Notes');
    });
  });

  describe('getAllTags', () => {
    test('should return unique tags from all recipes', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readdir.mockResolvedValue(['recipe1.md', 'recipe2.md']);
      fs.stat.mockResolvedValue({ mtime: new Date('2024-01-01') });
      
      const recipe1 = sampleRecipeMarkdown;
      const recipe2 = sampleRecipeMarkdown.replace(
        'tags = ["dessert", "cookies", "easy"]',
        'tags = ["dinner", "pasta", "easy"]'
      );
      
      fs.readFile
        .mockResolvedValueOnce(recipe1)
        .mockResolvedValueOnce(recipe2);
      
      const result = await recipeManager.getAllTags();
      
      expect(result).toEqual(['cookies', 'dessert', 'dinner', 'easy', 'pasta']);
    });

    test('should handle recipes without tags', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readdir.mockResolvedValue(['recipe1.md']);
      fs.stat.mockResolvedValue({ mtime: new Date('2024-01-01') });
      fs.readFile.mockResolvedValue(sampleRecipeMarkdown.replace('tags = ["dessert", "cookies", "easy"]', ''));
      
      const result = await recipeManager.getAllTags();
      
      expect(result).toEqual([]);
    });
  });

  describe('searchRecipes', () => {
    test('should search recipes by title, description, and tags', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readdir.mockResolvedValue(['recipe1.md', 'recipe2.md']);
      fs.stat.mockResolvedValue({ mtime: new Date('2024-01-01') });
      fs.readFile.mockResolvedValue(sampleRecipeMarkdown);
      
      const result = await recipeManager.searchRecipes('chocolate');
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].title).toContain('Chocolate');
    });

    test('should return empty array for no matches', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readdir.mockResolvedValue(['recipe1.md']);
      fs.stat.mockResolvedValue({ mtime: new Date('2024-01-01') });
      fs.readFile.mockResolvedValue(sampleRecipeMarkdown);
      
      const result = await recipeManager.searchRecipes('nonexistent');
      
      expect(result).toEqual([]);
    });
  });

  describe('validateRecipe', () => {
    test('should return no errors for valid recipe', () => {
      const validRecipe = {
        frontmatter: {
          title: 'Valid Recipe',
          tags: ['test']
        },
        content: '## Ingredients\n\nTest\n\n## Instructions\n\n1. Test'
      };
      
      const errors = recipeManager.validateRecipe(validRecipe);
      
      expect(errors).toEqual([]);
    });

    test('should return errors for invalid recipe', () => {
      const invalidRecipe = {
        frontmatter: {
          title: '',
          tags: 'not-an-array'
        },
        content: 'Missing required sections'
      };
      
      const errors = recipeManager.validateRecipe(invalidRecipe);
      
      expect(errors).toContain('Title is required');
      expect(errors).toContain('Tags must be an array');
      expect(errors).toContain('Recipe should include an Ingredients section');
      expect(errors).toContain('Recipe should include an Instructions section');
    });

    test('should return error for missing frontmatter', () => {
      const recipeWithoutFrontmatter = {
        content: 'Just content'
      };
      
      const errors = recipeManager.validateRecipe(recipeWithoutFrontmatter);
      
      expect(errors).toContain('Frontmatter is required');
    });
  });
});
