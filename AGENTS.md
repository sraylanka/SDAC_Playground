# Repository Guidelines

## Project Structure & Module Organization

Flight Controls Design Explorer is a static browser application for continuous-time, single-input/single-output controls coursework. Source and assets live in `public/`: `math.mjs` implements numerical analysis, `app.mjs` connects inputs and charts, `topics.mjs` defines the topic catalog, and `navigation.mjs` manages navigation and responsive menus. `index.html`, `style.css`, and `favicon.svg` provide the interface and styling.

Tests live in `tests/`. `build.mjs` copies `public/` into generated, Git-ignored `dist/`; edit source files rather than deployment output.

## Build, Test, and Development Commands

- `npm start`: serve `public/` at `http://localhost:4173` using Python's HTTP server; requires Python.
- `npm test`: run numerical and navigation tests with Node's built-in test runner. Use a Node version supporting `--test-isolation=none`.
- `npm run build`: replace `dist/` with a fresh copy of `public/`.
- `node tests/browser.mjs`: run Playwright interaction checks against the running local server. Requires Playwright and its Chromium browser to be available separately; they are not declared in `package.json`. Screenshots are saved under `/tmp/`.

## Coding Style & Naming Conventions

Use native JavaScript ES modules (`.mjs`) and explicit relative imports. Match nearby formatting: existing code is compact, with one-space indentation in many multiline function bodies. Use `const` by default, `let` for reassignment, camelCase for functions and variables, and kebab-case for topic IDs and HTML IDs. Keep numerical logic independent of the DOM in `math.mjs`. No formatter or linter is configured; avoid unrelated reformatting.

## Testing Guidelines

Use `node:test` and `node:assert/strict`; name unit test files `*.test.mjs` and describe expected behavior in test names. Add regression cases for numerical changes, including tolerances and boundary inputs. Cover navigation, hash URLs, and persistence when changing topic behavior. No coverage threshold is configured. Run `npm test` before submitting; run browser checks for UI changes and inspect desktop/mobile screenshots.

## Commit & Pull Request Guidelines

Existing commits use short, imperative subjects such as “Organize controls explorer into topic playgrounds.” Follow that style. Pull requests should explain the behavior change, relevant numerical assumptions, and verification performed. Link related issues when applicable and include desktop/mobile screenshots for visible changes.

## Privacy & Deployment

Preserve localStorage-only persistence and the absence of external scripts or analytics. Preserve owner-only access on deployments; authentication is supplied by Sites rather than the static application.
