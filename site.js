// Progressive enhancement only: every page is complete without this script.

// Color theme switcher (respects OS preference until explicitly toggled).
const themeBtn = document.querySelector('[data-theme-toggle]');
if (themeBtn) {
  themeBtn.hidden = false;
  const currentTheme = () => {
    const explicit = document.documentElement.dataset.theme;
    if (explicit === 'light' || explicit === 'dark') return explicit;
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  const syncLabel = () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    themeBtn.setAttribute('aria-label', `Switch to ${next} theme`);
    themeBtn.title = `Switch to ${next} theme`;
  };
  syncLabel();
  themeBtn.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('ddb-theme', next); } catch {}
    syncLabel();
  });
}

// Close mobile nav menu after tapping an anchor link.
const mobileMenu = document.querySelector('.mobile-menu');
if (mobileMenu) {
  mobileMenu.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => { mobileMenu.open = false; }),
  );
  document.addEventListener('click', (event) => {
    if (mobileMenu.open && !mobileMenu.contains(event.target)) mobileMenu.open = false;
  });
}

// Tabbed code examples + header copy button.
const copyText = async (text, button) => {
  const original = button.textContent;
  try {
    await navigator.clipboard.writeText(text.trim());
    button.textContent = 'Copied';
  } catch {
    button.textContent = 'Copy failed';
  }
  setTimeout(() => (button.textContent = original), 1500);
};

for (const box of document.querySelectorAll('[data-tabs]')) {
  const tabs = [...box.querySelectorAll('[role=tab]')];
  const panels = [...box.querySelectorAll('[role=tabpanel]')];
  let active = 0;
  const select = (chosen, focus) => {
    active = chosen;
    tabs.forEach((tab, index) => {
      const selected = index === chosen;
      tab.setAttribute('aria-selected', selected);
      tab.tabIndex = selected ? 0 : -1;
      panels[index].hidden = !selected;
      if (selected && focus) tab.focus();
    });
  };
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
  const tabCopy = box.querySelector('[data-tab-copy]');
  if (tabCopy) {
    tabCopy.hidden = false;
    tabCopy.addEventListener('click', () => {
      const code = panels[active].querySelector('code');
      if (code) copyText(code.textContent, tabCopy);
    });
  }
  select(0);
  box.dataset.ready = '';
}

// Embedded explainer video: seamless quality switcher + chapter jump bar.
for (const shell of document.querySelectorAll('[data-video-player]')) {
  const video = shell.querySelector('[data-video]');
  const buttons = [...shell.querySelectorAll('[data-quality]')];
  const status = shell.querySelector('[data-video-status]');
  const download = shell.querySelector('[data-download]');
  const chapterBar = shell.querySelector('[data-chapters]');
  const chapters = [...shell.querySelectorAll('[data-seek]')];
  if (!video) continue;

  const switchQuality = (button) => {
    if (button.getAttribute('aria-pressed') === 'true') return;
    const nextSrc = button.dataset.src;
    const label = button.dataset.label;
    const wasPlaying = !video.paused && !video.ended;
    const time = video.currentTime;
    const rate = video.playbackRate;

    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
    if (download) {
      download.href = nextSrc;
      download.setAttribute('download', button.dataset.filename || 'durable-db.mp4');
    }
    if (status) status.textContent = `Switching to ${label}…`;

    const restore = () => {
      if (time > 0 && Number.isFinite(video.duration)) {
        video.currentTime = Math.min(time, Math.max(0, video.duration - 0.5));
      }
      video.playbackRate = rate;
      if (status) status.textContent = label;
      if (wasPlaying) video.play().catch(() => {});
    };
    const onError = () => {
      if (status) status.textContent = 'Stream could not load — try the standalone link below';
    };
    video.addEventListener('loadedmetadata', restore, { once: true });
    video.addEventListener('error', onError, { once: true });
    video.src = nextSrc;
    video.load();
  };

  buttons.forEach((button) => button.addEventListener('click', () => switchQuality(button)));

  if (chapterBar && chapters.length) {
    chapterBar.hidden = false;
    const starts = chapters.map((c) => Number(c.dataset.seek));
    const highlightChapter = (seconds) => {
      let current = 0;
      for (let i = 0; i < starts.length; i++) {
        if (seconds >= starts[i] - 0.5) current = i;
      }
      chapters.forEach((c, i) => {
        if (i === current) c.setAttribute('aria-current', 'true');
        else c.removeAttribute('aria-current');
      });
    };
    chapters.forEach((button) => {
      button.addEventListener('click', () => {
        const target = Number(button.dataset.seek);
        const seekAndPlay = () => {
          video.currentTime = target;
          highlightChapter(target);
          video.play().catch(() => {});
        };
        if (video.readyState >= 1) seekAndPlay();
        else {
          video.addEventListener('loadedmetadata', seekAndPlay, { once: true });
          video.load();
        }
      });
    });
    video.addEventListener('timeupdate', () => highlightChapter(video.currentTime));
  }
}

// Explicit copy buttons (e.g. hero install command bar).
for (const button of document.querySelectorAll('[data-copy-text]')) {
  button.hidden = false;
  button.addEventListener('click', () => copyText(button.dataset.copyText, button));
}

// Copy buttons on standalone code blocks.
for (const pre of document.querySelectorAll('pre[data-copy], .docs article pre')) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'copy';
  button.textContent = 'Copy';
  button.addEventListener('click', () => {
    const code = pre.querySelector('code');
    if (code) copyText(code.textContent, button);
  });
  const block = document.createElement('div');
  block.className = 'code-block';
  pre.replaceWith(block);
  block.append(pre, button);
}

// Collapse mobile docs nav by default.
const docsNav = document.querySelector('.docs-nav');
if (docsNav && matchMedia('(max-width: 900px)').matches) docsNav.open = false;

// Highlight active section in docs TOC while scrolling.
const tocLinks = [...document.querySelectorAll('.toc a[href^="#"]')];
if (tocLinks.length && 'IntersectionObserver' in window) {
  const byId = new Map(tocLinks.map((link) => [decodeURIComponent(link.getAttribute('href').slice(1)), link]));
  const headings = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  const setActive = (id) => {
    tocLinks.forEach((link) => link.classList.toggle('active', link === byId.get(id)));
  };
  if (headings.length) {
    setActive(headings[0].id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: '-84px 0px -70% 0px', threshold: 0 },
    );
    headings.forEach((h) => observer.observe(h));
  }
}
