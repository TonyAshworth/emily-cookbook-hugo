# Emily's Cookbook - Hugo Edition 🍴

A beautiful, fast, and modern recipe website built with Hugo and a custom Emily theme. Features over 100 delicious gluten-free recipes tested and perfected in our home kitchen.

![Hugo](https://img.shields.io/badge/Hugo-FF4088?style=flat&logo=hugo&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-327FC7.svg?style=flat&logo=github&logoColor=white)
![Custom Theme](https://img.shields.io/badge/Theme-Emily-pink)

## 🌟 Features

- **📱 Fully Responsive**: Works perfectly on desktop, tablet, and mobile devices
- **⚡ Lightning Fast**: Built with Hugo for optimal performance
- **🔍 Search Functionality**: Find recipes quickly with built-in search
- **🏷️ Tag System**: Browse recipes by ingredients, cuisine type, or meal category
- **🌓 Dark/Light Mode**: Automatic theme switching with manual toggle
- **📖 Reading Time**: Shows estimated reading/cooking time for each recipe
- **📱 Share Buttons**: Easy social media sharing for favorite recipes
- **🗺️ Breadcrumb Navigation**: Always know where you are on the site
- **📄 Print Friendly**: Clean printing layouts for recipe cards
- **🔗 SEO Optimized**: Proper meta tags and structured data for search engines

## 🚀 Quick Start

### Prerequisites

- [Hugo Extended](https://gohugo.io/installation/) (v0.128.0 or later)
- [Git](https://git-scm.com/)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/TonyAshworth/emily-cookbook-hugo.git
   cd emily-cookbook-hugo
   ```

2. **Verify theme is present**
   ```bash
   # The custom Emily theme should be included in the repository
   ls themes/emily/
   ```

3. **Start local development server**
   ```bash
   hugo server -D
   ```

4. **Open in browser**
   Navigate to `http://localhost:1313`

### Build for Production

```bash
hugo --minify
```

The built site will be in the `public/` directory.

## 📁 Project Structure

```
emily-cookbook-hugo/
├── .github/
│   └── workflows/
│       └── hugo.yml                 # GitHub Actions deployment
├── content/
│   ├── _index.md                   # Homepage content
│   ├── about.md                    # About page
│   └── recipes/                    # Recipe collection (100+ recipes)
│       ├── _index.md              # Recipe list page
│       ├── chocolate-chip-cookies.md
│       ├── chicken-pot-pie.md
│       └── ...
├── themes/
│   └── emily/                      # Custom Emily theme
├── archetypes/
│   └── recipes.md                  # Template for new recipes
├── hugo.toml                       # Site configuration
└── README.md                       # This file
```

## ✍️ Adding New Recipes

### Using Hugo CLI

```bash
hugo new recipes/my-new-recipe.md
```

### Manual Creation

Create a new `.md` file in the `content/recipes/` directory:

```yaml
+++
title = "My Amazing Recipe"
date = "2024-01-15"
draft = false
tags = ["dinner", "chicken", "easy"]
categories = ["recipes"]
description = "A delicious and easy weeknight dinner"
+++

## Ingredients

- 2 cups flour
- 1 tsp salt
- 1 lb chicken breast

## Instructions

1. Preheat oven to 350°F
2. Season chicken with salt and pepper
3. Bake for 25 minutes

## Notes

This recipe serves 4 people and takes about 30 minutes total.
```

## 🎨 Theme Customization

The site uses a custom "Emily" theme designed specifically for this cookbook. Key features in `hugo.toml`:

- **Clean Design**: Portrait-style recipe cards with beautiful imagery
- **Search Functionality**: Fast, client-side search across all recipes
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile
- **Recipe Focus**: Optimized specifically for recipe display and browsing

## 🚀 Deployment

### Automatic Deployment (Recommended)

The site automatically deploys to GitHub Pages when changes are pushed to the `main` branch:

1. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Select "GitHub Actions" as the source

2. **Push changes**
   ```bash
   git add .
   git commit -m "Add new recipes"
   git push origin main
   ```

3. **View your site**
   - Site will be available at: `https://TonyAshworth.github.io/emily-cookbook-hugo/`
   - Deployment status: Actions tab in GitHub

### Manual Deployment

You can also deploy to any static hosting service:

```bash
hugo --minify
# Upload contents of public/ directory to your web server
```

## 📊 Site Analytics

The site includes:
- **Performance**: Optimized images, minified assets, fast loading
- **SEO**: Structured data, meta tags, sitemap, RSS feed
- **Accessibility**: Semantic HTML, proper heading structure, alt texts

## 🛠️ Development Workflow

### For Recipe Contributors (Emily)

1. **Desktop Application**: Use Emily's Cookbook Manager desktop app
   - Recipe-only sync (ignores build files and development artifacts)
   - GitHub authentication using personal access tokens
   - Comprehensive recipe editing with TOML frontmatter support
2. **Automatic Sync**: The app handles git commits and pushes automatically
3. **Live Updates**: Site updates automatically via GitHub Actions

### For Developers

1. **Local Development**
   ```bash
   hugo server -D --navigateToChanged
   ```

2. **Theme Updates**
   ```bash
   # Theme is custom and included in the repository
   # No submodule updates needed
   ```

3. **Content Validation**
   ```bash
   hugo --gc --minify --cleanDestinationDir
   ```

## 📧 Recipe Migration

This site was migrated from Eleventy to Hugo using custom conversion scripts:

- **Source**: 101 recipes from original Eleventy site
- **Preserved**: All content, tags, descriptions, and metadata
- **Enhanced**: Better categorization and search capabilities
- **Scripts**: Available in repository for future migrations

## 🤝 Contributing

### Recipe Contributions

1. Fork the repository
2. Add your recipe using the template above
3. Test locally with `hugo server`
4. Submit a pull request

### Technical Contributions

1. Follow Hugo best practices
2. Test changes locally
3. Update documentation as needed
4. Submit pull request with clear description

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

### Common Issues

**Theme not loading?**
```bash
# Verify the Emily theme is present
ls themes/emily/
# Theme should be included in the repository, no submodules needed
```

**Build failing?**
- Check Hugo version (requires v0.128.0+)
- Validate frontmatter syntax in recipe files

**Local server not starting?**
```bash
hugo server --bind 0.0.0.0 --port 1313 -D
```

### Getting Help

- 📖 [Hugo Documentation](https://gohugo.io/documentation/)
- 📱 [Desktop App Guide](https://github.com/TonyAshworth/emily-cookbook-hugo/tree/main/cookbook-manager)
- 🐛 [Report Issues](https://github.com/TonyAshworth/emily-cookbook-hugo/issues)

## 🏆 Credits

- **Recipes**: Created and tested by Emily Ashworth
- **Development**: Migrated and enhanced by Tony Ashworth
- **Theme**: Custom "Emily" theme designed for recipe websites
- **Generator**: [Hugo](https://gohugo.io/) - The world's fastest framework for building websites
- **Desktop App**: Emily's Cookbook Manager for recipe editing and GitHub sync

---

**Enjoy cooking! 👩‍🍳👨‍🍳**

*Made with ❤️ and Hugo*
