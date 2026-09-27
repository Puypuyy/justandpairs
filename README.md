# Just and Pairs — Customer MVP 1

Vite + React + TypeScript + Material UI + React Router. Built from the supplied Brand Direction, Customer Website Shell and Product Catalog System documents.

## Run locally

```sh
npm install
npm run dev
```

Open the URL printed by Vite. `npm run build` type-checks and creates `dist/`. `npm test` checks pricing, validation and catalog behavior. Node 22.13 or newer is recommended for the test runner. Scripts call Node directly to support the ampersand in this Windows workspace path.

## Scope

- Responsive homepage, product and occasion discovery, shared navigation and footer.
- Catalog search, filters, sorting and empty states.
- Configurable glass award pages with sizes, finishes, quantity, personalization, local file preview, deadline, delivery choice and estimate.
- Quote placeholder preserves selections in sessionStorage. No requests are transmitted.
- Help, concept portfolio and clear placeholders for future account, tracking and policy pages.
- No authentication, backend, payment, upload service or production workflows.

## Structure

- `src/theme/`: centralized MUI brand tokens and control styles.
- `src/data/catalog.ts`: mock categories, occasions, products, options, portfolio and process copy.
- `src/utils/`: replaceable pricing service, filtering and configuration validation/persistence.
- `src/components/`: reusable shell, product cards, actions and estimate.
- `src/pages/`: customer routes.

Pricing is illustrative. The two generated concept images in `public/images/` are placeholders, not actual products or customer work. Gallery angles are explicitly marked as future photography. Replace image paths and mock data before production. JPG/PNG/PDF local previews are limited to 2 MB to fit browser session storage. Files and choices clear with the session; no backend storage exists.

The hosted version is a static SPA; the host must serve `index.html` for unknown app paths. `.openai/hosting.json` declares `dist` as the static output. Google Fonts supplies Manrope and Inter with local fallback stacks.

No browser visual or interaction QA was performed; in-app preview was unavailable. Build and pure logic tests are the validation baseline.

An optional, feature-detected WebMCP `browse_product_catalog` tool opens the same filtered catalog as the UI. No supported WebMCP validation context was available, so that optional integration is unverified.
