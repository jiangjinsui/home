# Quiet Room — Procedural 3D Bedroom

Vite + React + TypeScript + Three.js procedural 3D bedroom. No external 3D models are required.

## GitHub Pages

1. Push the whole project to the `main` branch.
2. Open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` builds `dist` and deploys it automatically.
4. Do not use `Deploy from a branch` with the source project files.

The workflow intentionally fails when `npm run build` fails, so a broken build cannot be published as a blank site.

## Local

```bash
npm install
npm run build
npm run dev
```
