(() => {
  const terms = document.querySelectorAll('a[data-term-title]');
  if (!terms.length) return;
  const zh = document.documentElement.lang === 'zh-CN';
  const card = document.createElement('aside');
  card.className = 'term-preview';
  card.hidden = true;
  card.id = 'term-preview';
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-labelledby', 'term-preview-title');
  card.setAttribute('aria-describedby', 'term-preview-summary');
  const title = document.createElement('strong');
  title.className = 'term-preview-title';
  title.id = 'term-preview-title';
  const summary = document.createElement('p');
  summary.id = 'term-preview-summary';
  const full = document.createElement('a');
  full.textContent = zh ? '查看本站词条 →' : 'Read the glossary entry →';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'term-preview-close';
  close.setAttribute('aria-label', zh ? '关闭术语解释' : 'Close definition');
  close.textContent = '×';
  card.append(title, summary, full, close);
  document.body.append(card);
  let active = null;
  let timer;
  let pinned = false;
  let restoring = false;

  function position() {
    if (!active || card.hidden) return;
    const rect = active.getBoundingClientRect();
    const box = card.getBoundingClientRect();
    const width = document.documentElement.clientWidth;
    const height = window.innerHeight;
    const below = rect.bottom + 8;
    const top = below + box.height <= height - 12 ? below : rect.top - box.height - 8;
    card.style.left = `${Math.max(12, Math.min(rect.left, width - box.width - 12))}px`;
    card.style.top = `${Math.max(12, Math.min(top, height - box.height - 12))}px`;
  }
  function hide(restore = false) {
    clearTimeout(timer);
    const origin = active;
    if (origin) {
      origin.removeAttribute('aria-describedby');
      origin.setAttribute('aria-expanded', 'false');
    }
    active = null;
    pinned = false;
    card.hidden = true;
    if (restore && origin) {
      restoring = true;
      origin.focus({ preventScroll: true });
      restoring = false;
    }
  }
  function show(term, pin = false) {
    clearTimeout(timer);
    if (active !== term) hide();
    active = term;
    pinned = pinned || pin;
    title.textContent = term.dataset.termTitle;
    summary.textContent = term.dataset.termSummary;
    full.href = term.dataset.termHref || term.href;
    term.setAttribute('aria-describedby', summary.id);
    term.setAttribute('aria-expanded', 'true');
    card.hidden = false;
    position();
  }
  function scheduleHide() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!pinned && !card.matches(':hover') && !card.contains(document.activeElement) &&
          active !== document.activeElement && !active?.matches(':hover')) hide();
    }, 180);
  }
  for (const term of terms) {
    let pointerType = '';
    term.setAttribute('aria-controls', card.id);
    term.setAttribute('aria-expanded', 'false');
    term.setAttribute('aria-keyshortcuts', 'ArrowDown');
    term.addEventListener('pointerdown', event => { pointerType = event.pointerType; });
    term.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse' || pinned) return;
      clearTimeout(timer);
      timer = setTimeout(() => show(term), 160);
    });
    term.addEventListener('pointerleave', scheduleHide);
    term.addEventListener('focus', () => { if (!restoring) show(term); });
    term.addEventListener('blur', scheduleHide);
    term.addEventListener('click', event => {
      // Keyboard activation and modified clicks keep normal link navigation.
      const input = event.pointerType || (event.detail > 0 ? pointerType : '');
      const touch = input === 'touch' || input === 'pen' ||
        (event.detail > 0 && window.matchMedia('(hover: none)').matches);
      pointerType = '';
      // Authored links retain their destination on every click, including touch.
      if (term.classList.contains('term-link') && touch &&
          !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        show(term, true);
        full.focus({ preventScroll: true });
      }
    });
    term.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        show(term, true);
        full.focus({ preventScroll: true });
      }
    });
  }
  close.addEventListener('click', () => hide(true));
  card.addEventListener('pointerenter', () => clearTimeout(timer));
  card.addEventListener('pointerleave', scheduleHide);
  card.addEventListener('focusout', event => {
    if (!card.contains(event.relatedTarget) && event.relatedTarget !== active) hide();
  });
  document.addEventListener('pointerdown', event => {
    if (!card.contains(event.target) && !event.target.closest('a[data-term-title]')) hide();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && active) {
      event.preventDefault();
      hide(card.contains(document.activeElement));
    }
  });
  window.addEventListener('resize', position);
  document.addEventListener('scroll', event => {
    if (event.target === card) return;
    if (card.contains(document.activeElement)) position();
    else hide();
  }, true);
})();
