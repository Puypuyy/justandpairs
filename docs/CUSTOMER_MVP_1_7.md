# Customer MVP 1.7 - Static delivery readiness

This milestone improves how the completed customer website loads when served as a static single-page application. It does not add APIs or external services.

## Loading performance

- Catalog, product detail, RFQ, supporting and public information pages load as separate route chunks.
- The homepage and shared application shell remain in the initial bundle.
- A semantic loading state appears while a route chunk is fetched.
- Off-screen catalog, portfolio, option and RFQ images use native lazy loading.
- Images use asynchronous decoding to reduce main-thread interruption.

The production build no longer reports an oversized chunk warning. The initial application JavaScript is smaller, while larger customer workflows are downloaded only when visited.

## Static hosting

- `.openai/hosting.json` already identifies `dist` as the static output.
- Unknown server paths use single-page-application fallback handling.
- The existing React 404 route handles unknown customer paths after the application loads.
- No publication or deployment was performed in this local-first phase.

## Verification

- TypeScript and the Vite production build pass.
- All 26 automated logic and API tests pass.
- `git diff --check` passes.
- Browser visual QA remains outstanding until a controllable browser is available.

