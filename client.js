window.__ModuleLoader__.load({
  id: 'dsh-desktop-sider-glass',
  factory() {
    const GLASS_CSS = `
/* Frosted glass chrome: translucent sidebar column and window top bar.
   Selectors use the shell's stable module-class suffixes, not hashed names. */

html:not([data-platform='darwin']) body {
  --glass-fill: rgba(252, 253, 255, .55);
  --glass-line: rgba(16, 24, 40, .10);
  --glass-glow-a: rgba(96, 142, 255, .30);
  --glass-glow-b: rgba(178, 120, 255, .22);

  /* Mirrored by the shell into the native caption overlay. */
  --dsw-specific-sidebar-fill: var(--glass-fill) !important;

  background-color: var(--dsw-alias-bg-base);
  background-image:
    radial-gradient(52rem 40rem at 0% 0%, var(--glass-glow-a), transparent 64%),
    radial-gradient(48rem 36rem at 100% 100%, var(--glass-glow-b), transparent 62%);
  background-repeat: no-repeat;
  background-attachment: fixed;
}

html:not([data-platform='darwin']) body[data-ds-dark-theme] {
  --glass-fill: rgba(22, 23, 29, .44);
  --glass-line: rgba(255, 255, 255, .10);
  --glass-glow-a: rgba(96, 142, 255, .30);
  --glass-glow-b: rgba(120, 96, 255, .24);
}

/* Only the glass regions show the backdrop; the conversation stays opaque. */
html:not([data-platform='darwin']) [class$='_frame']:has(> [class$='_sidebarCol']) {
  background: transparent !important;
}

/* Sidebar glass lives on a pseudo-element: a filter on the column itself would
   become the containing block of the sidebar's fixed title-bar controls. */
html:not([data-platform='darwin']) [class$='_sidebarCol'] {
  position: relative;
  isolation: isolate;
  background: transparent !important;
  border-right-color: var(--glass-line) !important;
}
html:not([data-platform='darwin']) [class$='_sidebarCol']::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: var(--glass-fill);
  -webkit-backdrop-filter: blur(28px) saturate(175%);
  backdrop-filter: blur(28px) saturate(175%);
}
html:not([data-platform='darwin']) [class$='_sidebarCol'] > div {
  background: transparent !important;
}

/* Top bar of an opaque window: the shell paints the strip and the native
   overlay tints it, so the page only adds the blur. */
html[data-windows-titlebar]:not([data-platform='darwin']) [class$='_frame']:has(> [class$='_sidebarCol'])::before {
  background: transparent !important;
  -webkit-backdrop-filter: blur(24px) saturate(175%);
  backdrop-filter: blur(24px) saturate(175%);
}

/* Native acrylic shell: the window is transparent and the OS blurs the desktop
   behind it. One tint on the frame feeds both surfaces — the caption strip is
   the frame's own top padding and the sidebar column is transparent — so the
   two read as a single piece of glass. */
html[data-window-material='acrylic']:not([data-platform='darwin']),
html[data-window-material='acrylic']:not([data-platform='darwin']) body {
  background: transparent !important;
}
html[data-window-material='acrylic']:not([data-platform='darwin']) body {
  --glass-fill: rgba(250, 251, 253, .75);
  --glass-line: rgba(16, 24, 40, .12);
  background-image: none !important;
}
html[data-window-material='acrylic']:not([data-platform='darwin']) body[data-ds-dark-theme] {
  --glass-fill: rgba(14, 15, 20, .75);
  --glass-line: rgba(255, 255, 255, .12);
}
/* The caption overlay would add a second tint over the window buttons only;
   keep it transparent so the frame tint is the single colour of the strip. */
html[data-window-material='acrylic']:not([data-platform='darwin']) body,
html[data-window-material='acrylic']:not([data-platform='darwin']) body[data-ds-dark-theme] {
  --dsw-specific-sidebar-fill: transparent !important;
}
html[data-window-material='acrylic'] [class$='_frame']:has(> [class$='_sidebarCol']) {
  background: var(--glass-fill) !important;
}
html[data-window-material='acrylic'] [class$='_sidebarCol']::before {
  background: transparent !important;
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
}
html[data-window-material='acrylic'] [class$='_frame']::before {
  background: transparent !important;
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
}

/* The list's own bottom fade blends into the (formerly opaque) sidebar fill;
   over glass it reads as a stray gradient, so drop it. */
html:not([data-platform='darwin']) [class$='_sidebarCol'] [class$='_fade'] {
  background: none !important;
}
`;

    return {
      apply(ctx) {
        ctx.effect(() => {
          const tag = document.createElement('style');
          tag.dataset.plugin = 'dsh-desktop-sider-glass';
          tag.dataset.pluginCss = '@local/dsh-glass-chrome/glass.css';
          tag.textContent = GLASS_CSS;
          document.head.appendChild(tag);
          return () => {
            tag.remove();
          };
        });
      },
    };
  },
});
