document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu toggle
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  
  if (mobileMenuToggle && navMenu) {
    mobileMenuToggle.addEventListener('click', function() {
      mobileMenuToggle.classList.toggle('active');
      navMenu.classList.toggle('mobile-active');
      document.body.classList.toggle('menu-open');
    });
    
    // Close mobile menu when clicking on links
    const navLinks = navMenu.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenuToggle.classList.remove('active');
        navMenu.classList.remove('mobile-active');
        document.body.classList.remove('menu-open');
      });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-container')) {
        mobileMenuToggle.classList.remove('active');
        navMenu.classList.remove('mobile-active');
        document.body.classList.remove('menu-open');
      }
    });
  }
  
  // Ingredient checkboxes
  const ingredientCheckboxes = document.querySelectorAll('.ingredient-checkbox');
  ingredientCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const label = this.nextElementSibling;
      if (this.checked) {
        label.style.textDecoration = 'line-through';
        label.style.opacity = '0.6';
      } else {
        label.style.textDecoration = 'none';
        label.style.opacity = '1';
      }
    });
  });
  
  // Smooth scrolling for anchor links
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
  
  // Lazy loading images enhancement (fallback for older browsers)
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });
    
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => imageObserver.observe(img));
  }
});
