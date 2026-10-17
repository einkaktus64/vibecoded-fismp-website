# Repository Guidelines

## Project Structure & Module Organization

This repository is currently an empty starting point: it has no application source, tests, or assets yet. As the project takes shape, keep implementation code in a clearly named source directory (such as `src/`), tests in `tests/` or alongside the modules they cover, and static assets in a dedicated directory such as `public/`. Keep related features together and avoid committing generated build output or local environment files.

## Build, Test, and Development Commands

No build, test, or development commands are configured yet. When adding a framework or toolchain, document its prerequisites and canonical commands in the project README and here. Prefer standard package scripts (for example, `npm run dev`, `npm run build`, and `npm test`) so contributors can discover and run checks consistently. Run relevant checks before opening a pull request.

## Coding Style & Naming Conventions

There is no formatter or linter configured. Follow the conventions of the chosen language and framework, use consistent indentation, and favor descriptive names over abbreviations. Use `PascalCase` for component/type names and `camelCase` for functions and variables where those conventions apply. Add formatter and lint configuration with the first application code, and avoid unrelated formatting changes.

## Testing Guidelines

No test framework or coverage target is configured. Add tests with new behavior, name test files clearly (for example, `feature.test.ts` or `test_feature.py`), and keep them near the code or in the established test directory. Document the command contributors should run and any required test fixtures.

## Commit & Pull Request Guidelines

There is no Git commit history from which to infer a commit convention. Write concise, imperative commit subjects that describe one change (for example, `Add landing page layout`). Pull requests should explain the change and how it was checked; include screenshots for visible UI changes and link any related issue when applicable.

## Security & Configuration

Keep credentials and machine-specific configuration out of version control. Provide safe example configuration with placeholder values when setup requires environment variables, and document required variables without including secrets.

# Project: FiSMP Minecraft Server Website
- **Theme:** Minecraft SMP server themed around water, ocean monuments, and lots of fish ("Fi(sh)SMP").
- **Tech Stack:** HTML5, Tailwind CSS, Vite, and Three.js (for high-performance 3D animations).
- **Vibe:** Epic, modern, immersive 3D scrolling animations. 
- **Core Features:** Interactive hero section with a swimming 3D fish, parallax Minecraft renders, server features grid, and a "Copy IP" button.
