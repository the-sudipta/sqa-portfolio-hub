// Light / dark theme toggle. Follows the system setting until the visitor chooses; the choice is remembered.
(function () {
  const root = document.documentElement;
  const button = document.querySelector('[data-theme-toggle]');
  const stored = (() => {
    try {
      return localStorage.getItem('theme');
    } catch {
      return null;
    }
  })();

  const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
  const current = () => root.getAttribute('data-theme') || (systemDark() ? 'dark' : 'light');

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    if (button) {
      button.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
      button.setAttribute('aria-pressed', String(theme === 'dark'));
    }
  }

  if (stored === 'light' || stored === 'dark') apply(stored);
  else if (button) apply(current());

  if (button) {
    button.addEventListener('click', () => {
      const next = current() === 'dark' ? 'light' : 'dark';
      apply(next);
      try {
        localStorage.setItem('theme', next);
      } catch {
        /* storage blocked: the choice lasts for this page view only */
      }
    });
  }
})();
