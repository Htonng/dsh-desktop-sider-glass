window.__ModuleLoader__.load({
  id: 'dsh-desktop-sider-glass',
  factory() {
    const GLASS_CSS = `
/* Frosted glass chrome: translucent sidebar column and window top bar.
   Selectors use the shell's stable module-class suffixes, not hashed names. */

html:not([data-platform='darwin']) body {
  --glass-fill: rgba(250, 251, 253, .75);
  --glass-line: rgba(16, 24, 40, .12);
  --glass-glow-a: rgba(96, 142, 255, .42);
  --glass-glow-b: rgba(178, 120, 255, .30);

  /* The shell paints its own opaque fill on the column, the sidebar root and
     the caption strip. Blank it so the frame stays the single tint layer. */
  --dsw-specific-sidebar-fill: transparent !important;

  background-color: var(--dsw-alias-bg-base);
  background-image:
    radial-gradient(52rem 40rem at 0% 0%, var(--glass-glow-a), transparent 64%),
    radial-gradient(48rem 36rem at 100% 100%, var(--glass-glow-b), transparent 62%);
  background-repeat: no-repeat;
  background-attachment: fixed;
}

html:not([data-platform='darwin']) body[data-ds-dark-theme] {
  --glass-fill: rgba(14, 15, 20, .75);
  --glass-line: rgba(255, 255, 255, .12);
  --glass-glow-a: rgba(96, 142, 255, .30);
  --glass-glow-b: rgba(120, 96, 255, .24);
}

/* One tint on the frame feeds both surfaces: the caption strip is the frame's
   own top padding, and the sidebar column is transparent on top of it. */
html:not([data-platform='darwin']) [class$='_frame']:has(> [class$='_sidebarCol']) {
  background: var(--glass-fill) !important;
}

html:not([data-platform='darwin']) [class$='_sidebarCol'] {
  position: relative;
  isolation: isolate;
  background: transparent !important;
  border-right-color: var(--glass-line) !important;
}
html:not([data-platform='darwin']) [class$='_sidebarCol']::before {
  display: none !important;
}

/* The shell's caption strip keeps its own background and lets the native
   overlay tint it; blank both so only the frame tint shows. */
html[data-windows-titlebar]:not([data-platform='darwin']) [class$='_frame']:has(> [class$='_sidebarCol'])::before {
  background: transparent !important;
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
}

/* Native acrylic shell: the window is transparent and the OS blurs the desktop
   behind it, so the page drops its synthetic backdrop. */
html[data-window-material='acrylic']:not([data-platform='darwin']),
html[data-window-material='acrylic']:not([data-platform='darwin']) body {
  background: transparent !important;
}
html[data-window-material='acrylic']:not([data-platform='darwin']) body {
  background-image: none !important;
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
