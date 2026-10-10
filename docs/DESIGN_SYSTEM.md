# Design system – "midnight command centre"

All styling lives in `src/styles/global.css` (original) + `src/styles/theme.css` (design system, loaded last).

* **Tokens** (`:root` in theme.css): colours, radius, shadows, motion timing, fonts. The *same* variable names the app already used were
  redefined, so every existing page picked up the new look. Dark theme = `html[data-theme="dark"]` (only variables change).
* **Fonts:** Inter (body) and Manrope (headings) from Google Fonts, with system fallbacks. No npm font package.
* **Colour roles:** midnight navy navigation; electric blue/cyan for interaction; violet only for AI-style insight ("Rule-based · explainable");
  green / amber / red only for Low / Medium / High risk and status – and always with text or an icon next to the colour.
* **Contrast:** every text/background pair in both themes was checked against WCAG AA (4.5:1).
* **Motion:** page fade-up (240 ms), sidebar width, KPI entrance, bar/gauge growth, menus and dialogs. `prefers-reduced-motion: reduce`
  switches all of it off (see the last block of theme.css); nothing depends on animation to be understood.
* **Theme + sidebar preference:** `src/context/usePrefs.js` (saved in localStorage as `sih_theme`, `sih_sidebar`; applied before first paint by a tiny script in `index.html`).
* **Shell:** `components/layout/AppShell.jsx` (sidebar, mobile drawer, bottom bar), `Topbar.jsx` (search, notifications, profile, theme).
* **Code splitting:** every page is `React.lazy`-loaded; a skeleton (`components/ui/Skeleton.jsx`) shows while a page loads.
