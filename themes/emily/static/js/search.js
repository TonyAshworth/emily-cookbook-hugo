class RecipeSearch {
  constructor() {
    this.searchIndex = [];
    this.searchInput = document.getElementById('search-input');
    this.searchResults = document.getElementById('search-results');
    this.isLoading = false;
    
    this.initSearch();
  }
  
  async initSearch() {
    try {
      // Load the search index from Hugo's JSON output
      const response = await fetch('/emily-cookbook-hugo/index.json');
      this.searchIndex = await response.json();
      this.setupEventListeners();
    } catch (error) {
      console.log('Search index not found, search functionality disabled');
    }
  }
  
  setupEventListeners() {
    let searchTimeout;
    
    this.searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value.trim();
      
      if (query.length < 2) {
        this.hideResults();
        return;
      }
      
      searchTimeout = setTimeout(() => {
        this.performSearch(query);
      }, 300);
    });
    
    // Hide results when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-box')) {
        this.hideResults();
      }
    });
    
    // Handle keyboard navigation
    this.searchInput.addEventListener('keydown', (e) => {
      const results = this.searchResults.querySelectorAll('.search-result');
      const activeResult = this.searchResults.querySelector('.search-result.active');
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.navigateResults(results, activeResult, 'next');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.navigateResults(results, activeResult, 'prev');
      } else if (e.key === 'Enter' && activeResult) {
        e.preventDefault();
        activeResult.querySelector('a').click();
      } else if (e.key === 'Escape') {
        this.hideResults();
        this.searchInput.blur();
      }
    });
  }
  
  navigateResults(results, activeResult, direction) {
    if (results.length === 0) return;
    
    // Remove active class from current result
    if (activeResult) {
      activeResult.classList.remove('active');
    }
    
    let nextIndex = 0;
    if (activeResult) {
      const currentIndex = Array.from(results).indexOf(activeResult);
      nextIndex = direction === 'next' 
        ? (currentIndex + 1) % results.length
        : (currentIndex - 1 + results.length) % results.length;
    }
    
    results[nextIndex].classList.add('active');
  }
  
  performSearch(query) {
    if (!this.searchIndex.length) return;
    
    const results = this.fuzzySearch(query, this.searchIndex);
    this.displayResults(results, query);
  }
  
  fuzzySearch(query, items) {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return items
      .map(item => {
        let score = 0;
        const titleLower = item.title.toLowerCase();
        const summaryLower = (item.summary || '').toLowerCase();
        const contentLower = (item.content || '').toLowerCase();
        const tagsLower = (item.tags || []).join(' ').toLowerCase();
        
        searchTerms.forEach(term => {
          // Title matches get highest score
          if (titleLower.includes(term)) {
            score += titleLower.indexOf(term) === 0 ? 10 : 5;
          }
          
          // Summary matches
          if (summaryLower.includes(term)) {
            score += 3;
          }
          
          // Tag matches (important for recipes)
          if (tagsLower.includes(term)) {
            score += 4;
          }
          
          // Content matches
          if (contentLower.includes(term)) {
            score += 1;
          }
        });
        
        return { ...item, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6); // Limit to 6 results
  }
  
  displayResults(results, query) {
    if (results.length === 0) {
      this.searchResults.innerHTML = `
        <div class="search-no-results">
          <p>No recipes found for "${query}"</p>
          <small>Try different keywords or browse all recipes</small>
        </div>
      `;
    } else {
      this.searchResults.innerHTML = results
        .map(result => `
          <div class="search-result">
            <a href="${result.permalink}">
              <div class="search-result-title">${this.highlightMatch(result.title, query)}</div>
            </a>
          </div>
        `).join('');
    }
    
    this.showResults();
  }
  
  highlightMatch(text, query) {
    if (!text) return '';
    
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    let highlightedText = text;
    
    searchTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });
    
    return highlightedText;
  }
  
  showResults() {
    this.searchResults.style.display = 'block';
    this.searchResults.classList.add('visible');
  }
  
  hideResults() {
    this.searchResults.style.display = 'none';
    this.searchResults.classList.remove('visible');
    
    // Remove active states
    const activeResults = this.searchResults.querySelectorAll('.search-result.active');
    activeResults.forEach(result => result.classList.remove('active'));
  }
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new RecipeSearch();
});
