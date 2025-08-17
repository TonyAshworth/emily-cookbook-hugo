# GitHub Pages Deployment Guide

This guide will help you set up automated deployment of Emily's Cookbook to GitHub Pages.

## 🚀 Quick Setup (5 minutes)

### Step 1: Create GitHub Repository

1. **Go to GitHub** and create a new repository:
   - Repository name: `emily-cookbook-hugo`
   - Description: "Emily's delicious gluten-free recipe collection built with Hugo"
   - Public repository (required for GitHub Pages on free tier)
   - Don't initialize with README (we already have one)

### Step 2: Push Local Repository

```bash
cd D:\Development\emily-cookbook-hugo

# Initialize git repository
git init
git branch -M main

# Add all files
git add .
git commit -m "Initial commit: Hugo recipe site with 101 recipes"

# Add remote and push
git remote add origin https://github.com/TonyAshworth/emily-cookbook-hugo.git
git push -u origin main
```

### Step 3: Configure GitHub Pages

1. **Go to repository Settings**
   - Navigate to your new repository on GitHub
   - Click "Settings" tab

2. **Configure Pages**
   - In the left sidebar, click "Pages"
   - Under "Source", select **"GitHub Actions"**
   - That's it! The workflow is already configured

### Step 4: Wait for Deployment

1. **Monitor the deployment**
   - Go to "Actions" tab in your repository
   - You should see "Deploy Hugo site to Pages" workflow running
   - Wait for it to complete (usually 1-2 minutes)

2. **Access your site**
   - Once complete, your site will be available at:
   - `https://TonyAshworth.github.io/emily-cookbook-hugo/`

## 🔧 Workflow Details

The GitHub Actions workflow (`.github/workflows/hugo.yml`) automatically:

1. **Triggers on**:
   - Every push to the `main` branch
   - Manual workflow runs (via GitHub Actions tab)

2. **Build process**:
   - Installs Hugo Extended v0.128.0
   - Installs Dart Sass for styling
   - Checks out code with theme submodules
   - Builds the site with minification
   - Uploads to GitHub Pages

3. **Deployment**:
   - Uses GitHub's official Pages action
   - Automatically configures custom domain if set
   - Provides deployment URL in Actions output

## 📝 Making Updates

### Adding New Recipes

1. **Create new recipe file**:
   ```bash
   hugo new recipes/my-new-recipe.md
   ```

2. **Edit the recipe**:
   - Add ingredients, instructions, tags
   - Set `draft = false` when ready to publish

3. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add new recipe: My New Recipe"
   git push origin main
   ```

4. **Automatic deployment**:
   - Site rebuilds automatically
   - New recipe appears within 2-3 minutes

### Bulk Recipe Updates

1. **Make multiple changes locally**
2. **Test with Hugo server**:
   ```bash
   hugo server -D
   ```
3. **Commit and push all at once**:
   ```bash
   git add .
   git commit -m "Update multiple recipes and fix tags"
   git push origin main
   ```

## 🛠️ Troubleshooting

### Build Failures

1. **Check the Actions tab** for error messages
2. **Common issues**:
   - Invalid frontmatter in recipe files
   - Missing theme submodule
   - Hugo version compatibility

### Theme Issues

If the theme isn't loading:
```bash
git submodule update --init --recursive
git add .
git commit -m "Update theme submodule"
git push origin main
```

### Custom Domain Setup

1. **Add CNAME file**:
   ```bash
   echo "your-domain.com" > static/CNAME
   git add static/CNAME
   git commit -m "Add custom domain"
   git push origin main
   ```

2. **Update baseURL in hugo.toml**:
   ```toml
   baseURL = 'https://your-domain.com/'
   ```

3. **Configure DNS** (with your domain provider):
   - Add CNAME record pointing to `TonyAshworth.github.io`

## 🔒 Security & Access

### Repository Permissions

- **Public repository**: Required for GitHub Pages on free tier
- **Private alternative**: GitHub Pro/Team required for private Pages

### Workflow Permissions

The workflow uses:
- `contents: read` - To access repository files
- `pages: write` - To deploy to GitHub Pages  
- `id-token: write` - For secure deployment authentication

### Branch Protection

Consider enabling branch protection:
1. Go to Settings → Branches
2. Add rule for `main` branch
3. Require pull request reviews for important changes

## 📊 Monitoring & Analytics

### GitHub Actions Monitoring

- **Actions tab**: View all deployments and their status
- **Email notifications**: Configure in GitHub settings
- **Deployment history**: Track all site updates

### Site Analytics

Consider adding:
- **Google Analytics**: Add tracking ID to hugo.toml
- **GitHub Pages insights**: Basic traffic statistics
- **Lighthouse CI**: Automated performance monitoring

## ⚡ Performance Optimization

The current setup includes:

1. **Build optimizations**:
   - Asset minification
   - Image processing
   - CSS/JS bundling

2. **Hosting optimizations**:
   - GitHub CDN
   - Gzip compression
   - Cache headers

3. **Theme optimizations**:
   - Responsive images
   - Lazy loading
   - Minimal JavaScript

## 🚀 Advanced Features

### Automated Recipe Testing

Add validation workflow:
```yaml
# .github/workflows/validate.yml
name: Validate Recipes
on: [pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Test Hugo Build
        run: |
          hugo --gc --minify --cleanDestinationDir
          # Add custom validation scripts here
```

### Staging Environment

Set up preview deployments:
1. Create `staging` branch
2. Deploy to separate Pages site
3. Test changes before merging to `main`

## 🆘 Support

If you encounter issues:

1. **Check the Actions tab** for detailed error logs
2. **Verify hugo.toml** configuration
3. **Test locally** with `hugo server`
4. **Compare with working commit** if changes broke something

**Need help?** Open an issue in the repository with:
- Description of the problem
- Error messages from GitHub Actions
- Steps to reproduce the issue

---

**Happy cooking and deploying! 🍳🚀**
