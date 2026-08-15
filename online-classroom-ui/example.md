@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

/* Dark-only: html.dark activates all shadcn dark: variants */
@custom-variant dark (&:is(.dark *));


@theme inline {
  /* Font stacks */
  --font-heading: var(--font-geist-sans);
  --font-sans:    var(--font-geist-sans);
  --font-mono:    var(--font-geist-mono);

  /* Background layers */
  --color-bg-base:     var(--bg-base);
  --color-bg-surface:  var(--bg-surface);
  --color-bg-elevated: var(--bg-elevated);
  --color-bg-subtle:   var(--bg-subtle);

  /* Borders */
  --color-border-default: var(--border-default);
  --color-border-subtle:  var(--border-subtle);

  /* Text */
  --color-text-primary:   var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-muted:     var(--text-muted);
  --color-text-faint:     var(--text-faint);

  /* Accents */
  --color-accent-primary:     var(--accent-primary);
  --color-accent-primary-dim: var(--accent-primary-dim);
  --color-accent-ai:          var(--accent-ai);
  --color-accent-ai-text:     var(--accent-ai-text);

  /* State */
  --color-state-error:   var(--state-error);
  --color-state-success: var(--state-success);
  --color-state-warning: var(--state-warning);

  /* ── shadcn semantic aliases (mapped to Ghost AI tokens) ─────────────────── */
  --color-background:         var(--bg-base);
  --color-foreground:         var(--text-primary);
  --color-card:               var(--bg-surface);
  --color-card-foreground:    var(--text-primary);
  --color-popover:            var(--bg-elevated);
  --color-popover-foreground: var(--text-primary);
  --color-primary:            var(--accent-primary);
  --color-primary-foreground: var(--bg-base);
  --color-secondary:          var(--bg-subtle);
  --color-secondary-foreground: var(--text-secondary);
  --color-muted:              var(--bg-elevated);
  --color-muted-foreground:   var(--text-muted);
  --color-accent:             var(--accent-primary-dim);
  --color-accent-foreground:  var(--accent-primary);
  --color-destructive:        var(--state-error);
  --color-border:             var(--border-default);
  --color-input:              var(--border-subtle);
  --color-ring:               var(--accent-primary);

  /* Radius scale */
  --radius-sm:  0.5rem;   /* inline / small UI  → rounded-xl equivalent */
  --radius-md:  0.75rem;
  --radius-lg:  1rem;     /* cards / panels     → rounded-2xl */
  --radius-xl:  1.25rem;
  --radius-2xl: 1.5rem;
  --radius-3xl: 2rem;     /* modals / overlays  → rounded-3xl */

  /* Sidebar (reuse surface tokens) */
  --color-sidebar:                    var(--bg-surface);
  --color-sidebar-foreground:         var(--text-primary);
  --color-sidebar-primary:            var(--accent-primary);
  --color-sidebar-primary-foreground: var(--bg-base);
  --color-sidebar-accent:             var(--accent-primary-dim);
  --color-sidebar-accent-foreground:  var(--accent-primary);
  --color-sidebar-border:             var(--border-default);
  --color-sidebar-ring:               var(--accent-primary);

  /* ── Ghost AI utility aliases (used in feature specs) ───────────────────── */
  --color-base: var(--bg-base);
  --color-surface: var(--bg-surface);
  --color-elevated: var(--bg-elevated);
  --color-subtle: var(--bg-subtle);

  --color-surface-border: var(--border-default);

  --color-primary-text: var(--text-primary);
  --color-muted-text: var(--text-muted);
  --color-copy-primary: var(--text-primary);

  --color-brand: var(--accent-primary);
  --color-brand-dim: var(--accent-primary-dim);

  --color-accent-text: var(--accent-ai-text);
}

/* ─── CSS custom properties (dark-only palette) ───────────────────────────── */
:root {
  color-scheme: dark;

  /* Backgrounds */
  --bg-base:     #080809;
  --bg-surface:  #111114;
  --bg-elevated: #18181c;
  --bg-subtle:   #1e1e23;

  /* Borders */
  --border-default: #2a2a30;
  --border-subtle:  #3a3a42;

  /* Text */
  --text-primary:   #f0f0f4;
  --text-secondary: #c0c0cc;
  --text-muted:     #808090;
  --text-faint:     #505060;

  /* Accents */
  --accent-primary:     #00c8d4;
  --accent-primary-dim: rgba(0, 200, 212, 0.12);
  --accent-ai:          #6457f9;
  --accent-ai-text:     #8b82ff;

  /* State */
  --state-error:   #ff4d4f;
  --state-success: #34d399;
  --state-warning: #fbbf24;
}

/* ─── Base layer ──────────────────────────────────────────────────────────── */
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground font-sans antialiased;
  }
  html {
    @apply font-sans;
  }
}