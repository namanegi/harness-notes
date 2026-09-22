/* Static appendix links remain usable without dialog support or JavaScript. */
(() => {
  const dialog = document.querySelector('.case-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const content = dialog.querySelector('.case-dialog-content');
  const permalink = dialog.querySelector('.case-permalink');
  let opener;
  document.querySelectorAll('a[data-case-id]').forEach(link => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const template = document.getElementById(`case-template-${link.dataset.caseId}`);
      if (!template) return;
      content.replaceChildren(template.content.cloneNode(true));
      dialog.setAttribute('aria-labelledby', content.querySelector('h3').id);
      permalink.href = link.href;
      opener = link;
      dialog.showModal();
      event.preventDefault();
      document.documentElement.classList.add('case-open');
      dialog.scrollTop = 0;
    });
  });
  dialog.querySelector('.case-close').addEventListener('click', () => dialog.close());
  // Require both press and release outside, so dragging a selection does not close it.
  const outside = event => {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom;
  };
  let pressedOutside = false;
  dialog.addEventListener('pointerdown', event => { pressedOutside = outside(event); });
  dialog.addEventListener('click', event => {
    if (event.target === dialog && pressedOutside && outside(event)) dialog.close();
    pressedOutside = false;
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('case-open');
    opener?.focus({ preventScroll: true });
  });
})();
