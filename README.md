# FiSMP Website

A Vite landing page for the FiSMP Minecraft server, built with Tailwind CSS 4 and Three.js. Its interactive hero loads `guardian-reimagined-by-lolochee.schem` and renders the Sponge schematic with instanced block geometry, orbit, and zoom controls. Transparent renders from selected schematics are blended into the world, features, and join sections as atmospheric background art. The Join button copies `fismp.run.place`.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Create a production build with `npm run build`, then preview it with `npm run preview`.
