// Canonical URL Redirect Enforcement for GitHub Pages / Static Hosting
(function enforceCanonicalUrl() {
  if (typeof window === 'undefined' || !window.location) return;
  const path = window.location.pathname;
  if (path.endsWith('/index.html') || path === '/index.html') {
    const cleanPath = path.slice(0, -10);
    const newUrl = (cleanPath === '' ? '/' : cleanPath) + window.location.search + window.location.hash;
    window.location.replace(newUrl);
  }
})();

// Synchronously initialize theme from localStorage or default to 'light'
(function() {
  let savedTheme = 'light';
  try {
    savedTheme = localStorage.getItem('niyogi-theme') || 'light';
  } catch (e) {
    console.warn('Storage access blocked, defaulting to light theme.');
  }
  document.documentElement.setAttribute('data-theme', savedTheme);
})();

document.addEventListener('DOMContentLoaded', () => {
  // Mobile menu toggle click handling
  const mobileToggle = document.getElementById('mobile-nav-btn');
  const navMenu = document.getElementById('nav-menu-list');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const spans = mobileToggle.querySelectorAll('span');
      if (navMenu.classList.contains('open')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });
  }
  // Dropdown toggle for mobile
  const dropdownToggle = document.getElementById('nav-link-tools');
  const dropdownParent = document.getElementById('nav-dropdown-tools');
  if (dropdownToggle && dropdownParent) {
    dropdownToggle.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        dropdownParent.classList.toggle('active-mobile');
      }
    });
  }

  // Theme toggle click listener
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      try {
        localStorage.setItem('niyogi-theme', newTheme);
      } catch (e) {
        console.warn('Failed to persist theme state in storage:', e);
      }
    });
  }
});
