// Progressive enhancement only: every page is complete without this script.
for (const box of document.querySelectorAll('[data-tabs]')) {
  const tabs = [...box.querySelectorAll('[role=tab]')];
  const panels = [...box.querySelectorAll('[role=tabpanel]')];
  const select = (chosen, focus) =>
    tabs.forEach((tab, index) => {
      const selected = index === chosen;
      tab.setAttribute('aria-selected', selected);
      tab.tabIndex = selected ? 0 : -1;
      panels[index].hidden = !selected;
      if (selected && focus) tab.focus();
    });
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('keydown', (event) => {
      const last = tabs.length - 1;
      const target = {
        ArrowRight: index === last ? 0 : index + 1,
        ArrowLeft: index === 0 ? last : index - 1,
        Home: 0,
        End: last,
      }[event.key];
      if (target === undefined) return;
      event.preventDefault();
      select(target, true);
    });
  });
  box.querySelector('[role=tablist]').hidden = false;
  select(0);
  box.dataset.ready = '';
}
for (const pre of document.querySelectorAll('pre[data-copy], .docs article pre')) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'copy';
  button.textContent = 'Copy';
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(pre.querySelector('code').textContent.trim());
      button.textContent = 'Copied';
    } catch {
      button.textContent = 'Copy failed';
    }
    setTimeout(() => (button.textContent = 'Copy'), 1500);
  });
  const block = document.createElement('div');
  block.className = 'code-block';
  pre.replaceWith(block);
  block.append(pre, button);
}
const docsNav = document.querySelector('.docs-nav');
if (docsNav && matchMedia('(max-width: 900px)').matches) docsNav.open = false;
