# AI Concepts Visualizer

An interactive, browser-only app for visualizing core AI concepts: tokenization, RAG (retrieval-augmented generation), and agent workflows.

Live: [https://subrahmanyam-pampana.github.io/ai-visualizer/](https://subrahmanyam-pampana.github.io/ai-visualizer/)

---

## Local Development

```bash
npm install
npm run dev
```

---

## Deployment (GitHub Pages)

The app is a fully static Vite + React build — no backend required.

### Automatic deployment (CI)

Every push to `main` triggers the [deploy workflow](.github/workflows/deploy.yml), which builds and publishes to GitHub Pages automatically.

**One-time setup** (do this once per repo):

1. Go to **Settings → Pages** in the GitHub repository.
2. Under **Source**, select **GitHub Actions**.
3. Save. The next push to `main` will deploy.

### Manual deployment

```bash
npm run build        # outputs to dist/
```

Then upload the `dist/` folder contents to any static host (GitHub Pages, Netlify, Vercel, S3, etc.).

> The `base` in `vite.config.ts` is set to `/ai-visualizer/` to match the GitHub Pages subpath. If you host at a different path or domain root, update `base` accordingly.

---

## Tech Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite 6](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [React Flow (@xyflow/react)](https://reactflow.dev/)
- [Framer Motion](https://www.framer.com/motion/)
- [react-router-dom v7](https://reactrouter.com/) (HashRouter — no server config needed)
