(() => {
  const root = document.documentElement;
  let theme = 'dark';
  try {
    const saved = localStorage.getItem('harness-notes-theme');
    if (saved === 'light' || saved === 'dark') theme = saved;
  } catch (_) { /* Dark remains usable when storage is unavailable. */ }
  const apply = () => {
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content =
      theme === 'dark' ? '#12191e' : '#f6f3ec';
  };
  apply();
  document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('.theme-toggle');
    const zh = root.lang === 'zh-CN';
    const render = () => {
      const next = theme === 'dark' ? 'light' : 'dark';
      button.textContent = next === 'light' ? (zh ? '浅色' : 'Light') : (zh ? '深色' : 'Dark');
      button.setAttribute('aria-label', zh
        ? `切换为${next === 'light' ? '浅色' : '深色'}主题`
        : `Switch to ${next} theme`);
    };
    render();
    button.hidden = false;
    button.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      apply();
      render();
      try { localStorage.setItem('harness-notes-theme', theme); } catch (_) {}
    });
  });
})();
