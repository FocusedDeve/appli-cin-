# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"cine appli": a static, framework-free movie search page (French UI). The user types a title, and the page fetches details from the OMDb API (`https://www.omdbapi.com/?t=<title>&apikey=<key>`) and renders them. There is no build step, package manager, linter, or test suite.

## Running / deploying

- Run locally by opening `index.html` in a browser, or serve the folder statically (e.g. `python -m http.server`).
- Deploy via the `Dockerfile` (`nginx:alpine`, copies the whole repo into `/usr/share/nginx/html`): `docker build -t appli-cin . && docker run -p 8080:80 appli-cin`.

## Architecture

- [index.html](index.html) loads, in order, `js/key.js` then `js/index.js` as plain global scripts (no modules). Load order matters because `index.js` reads the global `key` defined in `key.js`.
- `js/key.js` defines the global OMDb API key (`key = "..."`). It is tracked in git and shipped to the browser, so treat it as exposed and don't print or copy its value.
- [js/index.js](js/index.js) holds all behavior:
  - `getMovie()` fetches OMDb and replaces the innerHTML of `#result` with a template string (poster, rating, genres, plot, cast, and hard-coded streaming links). It runs on the search button click and on window `load` (the input is prefilled with "The Words").
  - Theme toggle: switches `--bgColor`/`--textColor` on `document.documentElement` between the `-light` and `-dark` variants defined in `:root`. State is a module-level `darkMode` boolean and is not persisted.
- [js/langue.js](js/langue.js) is an unfinished i18n stub (`translations` + `changeLanguage` over `[data-translate]` elements). It is not included in `index.html` and no element uses `data-translate`.
- CSS: [css/style.css](css/style.css) defines the theme variables and `@import`s per-section files in `css/section/` (`header.css`, `result.css`, `footer.css`).

## Known quirks

- OMDb response fields are injected into `innerHTML` unescaped, and the movie name is not URL-encoded in the request.
- Some template strings have malformed closing tags (`</h3` without `>` in the error/catch branches of `getMovie`), and the poster `<img src=...>` is unquoted.
- The initial theme-button text in HTML ("Mode claire") differs from the JS toggle text ("Mode clair"/"Mode sombre").
