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

class NiyogiHeader extends HTMLElement {
  connectedCallback() {
    // Detect folder depth prefix dynamically
    let prefix = "";
    const scriptEl = document.currentScript;
    if (scriptEl) {
      const src = scriptEl.getAttribute('src');
      if (src && src.includes('navigation.js')) {
        prefix = src.replace('navigation.js', '');
      }
    } else {
      const path = window.location.pathname.toLowerCase();
      if (
        path.includes('/butler') || 
        path.includes('/rostramind') || 
        path.includes('/dutyremind')
      ) {
        prefix = "../";
      }
    }

    const activePage = this.getAttribute('active') || '';

    this.innerHTML = `
      <header>
        <div class="container nav-container">
          <a href="${prefix}index.html" class="logo-link" id="nav-logo" style="display: flex; align-items: center; gap: 8px;">
            <img src="${prefix}imgs/niyogi_labs_logo.png" alt="Niyogi Labs Logo" style="width: 24px; height: 24px; object-fit: contain;">
            Niyogi Labs
          </a>
          <button class="mobile-toggle" aria-label="Toggle menu" id="mobile-nav-btn">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <ul class="nav-menu" id="nav-menu-list">
            <li><a href="${prefix}index.html" class="nav-link ${activePage === 'home' ? 'active' : ''}" id="nav-link-home">Home</a></li>
            <li><a href="${prefix}butler/index.html" class="nav-link ${activePage === 'butler' ? 'active' : ''}" id="nav-link-butler">Butler Platform</a></li>
            <li><a href="${prefix}RostraMind/index.html" class="nav-link ${activePage === 'rostramind' || activePage === 'dutyremind' ? 'active' : ''}" id="nav-link-rostramind">RostraMind</a></li>
            <li style="display: flex; align-items: center;">
              <button class="theme-toggle" aria-label="Toggle light/dark theme" id="theme-toggle-btn" style="background: none; border: none; cursor: pointer; color: var(--text-main); display: flex; align-items: center; justify-content: center; padding: 4px; transition: var(--transition-smooth);">
                <svg class="sun-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                <svg class="moon-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              </button>
            </li>
          </ul>
        </div>
      </header>
    `;

    // Mobile menu toggle click handling
    const mobileToggle = this.querySelector('.mobile-toggle');
    const navMenu = this.querySelector('.nav-menu');
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

    // Theme toggle click listener
    const themeToggleBtn = this.querySelector('#theme-toggle-btn');
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
  }
}

class NiyogiFooter extends HTMLElement {
  connectedCallback() {
    let prefix = "";
    const scriptEl = document.querySelector('script[src*="navigation.js"]');
    if (scriptEl) {
      const src = scriptEl.getAttribute('src');
      if (src && src.includes('navigation.js')) {
        prefix = src.replace('navigation.js', '');
      }
    } else {
      const path = window.location.pathname.toLowerCase();
      if (
        path.includes('/butler') || 
        path.includes('/rostramind') || 
        path.includes('/dutyremind')
      ) {
        prefix = "../";
      }
    }

    this.innerHTML = `
      <footer>
        <div class="container">
          <div class="footer-grid">
            <div class="footer-brand">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <img src="${prefix}imgs/niyogi_labs_logo.png" alt="Niyogi Labs Logo" style="width: 32px; height: 32px; object-fit: contain;">
                <h3 id="footer-logo" style="margin-bottom: 0;">Niyogi Labs</h3>
              </div>
              <p style="font-size: 0.9rem; margin-bottom: 0;">Simplifying life through automation.</p>
            </div>
            <div>
              <h4 class="footer-links-title">Butler Platform</h4>
              <ul class="footer-links-list">
                <li><a href="${prefix}butler/index.html" id="footer-link-butler-about">Platform Overview</a></li>
                <li><a href="https://github.com/niyogilabs/Butler" target="_blank" rel="noopener" id="footer-link-butler-git">Butler (Device Firmware)</a></li>
                <li><a href="https://github.com/niyogilabs/ButlerManager" target="_blank" rel="noopener" id="footer-link-butlermgr-git">ButlerManager (Android App)</a></li>
              </ul>
            </div>
            <div>
              <h4 class="footer-links-title">RostraMind</h4>
              <ul class="footer-links-list">
                <li><a href="${prefix}RostraMind/index.html" id="footer-link-rostramind-about">Product Details</a></li>
                <li><a href="${prefix}RostraMind/support.html" id="footer-link-rostramind-support">Setup &amp; Support</a></li>
                <li><a href="${prefix}RostraMind/terms.html" id="footer-link-rostramind-terms">Terms of Service</a></li>
                <li><a href="${prefix}RostraMind/privacy.html" id="footer-link-rostramind-privacy">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <p style="font-size: 0.85rem; margin-bottom: 0;" id="copyright-text">&copy; 2026 Niyogi Labs. All rights reserved.</p>
            <p style="font-size: 0.85rem; margin-bottom: 0;">Hosted on GitHub Pages</p>
          </div>
        </div>
      </footer>
    `;
  }
}

customElements.define('niyogi-header', NiyogiHeader);
customElements.define('niyogi-footer', NiyogiFooter);
