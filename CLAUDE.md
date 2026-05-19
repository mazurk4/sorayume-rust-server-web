# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Static informational website for the SORAYU.ME Rust (game) server — vanilla, Solo/Duo/Trio, weekly wipe. Single-page with a night-sky theme, slide-based scroll navigation, and bilingual (JP/EN) content.

## Running locally

No build step. Serve with any static file server:

```sh
python3 -m http.server 8080
# then open http://localhost:8080
```

A static file server is required (not `file://`) because the JSX files are loaded via `<script src>` tags that browsers block under the file protocol.

## Architecture

React 18 via CDN (UMD) with Babel Standalone for in-browser JSX transpilation — no bundler, no `node_modules`.

- `index.html` — HTML shell; loads React, Babel, then the two JSX files via `<script type="text/babel">`
- `content.jsx` — All bilingual text and data as a `CONTENT` constant, exposed on `window`
- `app.jsx` — All React components and the root `App`
- `styles.css` — All styling; CSS custom properties power light/dark theming
- `assets/` — `banner.png` (hero image) and `icon.png` (favicon + nav/footer logo)

## Key patterns

**State persistence**: `useLocalState(key, default)` in `app.jsx` backs `dark` and `lang` to `localStorage` so preferences survive page reloads.

**Dark mode**: `document.documentElement.classList.toggle('dark', dark)`. CSS variables under `:root.dark` override the light defaults.

**Slides**: `SLIDES` array defines 9 slides (Hero → Outro). `goTo(i)` scrolls to `slides[i].offsetTop`. A scroll listener updates `slideIdx` by comparing `offsetTop` values against `window.scrollY + 16`. `scroll-snap-type: y proximity` on `<html>` provides soft snap. URL hash syncs to the active slide, enabling deep links (`#rules`, `#faq`, etc.). Arrow/Page keys also navigate slides.

**Bilingual content**: `pick(v, lang)` resolves `{ jp, en }` objects to the active language string. All content lives in `content.jsx`'s `CONTENT` object — edit there to update copy.

**Wipe countdown**: `useNextWipe()` computes the next Wednesday 12:00 JST (= 03:00 UTC Wednesday) and re-renders every second.

**Starfield**: 160 stars generated once from a seeded PRNG (`makeStars`) so they don't reposition on re-renders. Shooting-star animations run via pure CSS.
