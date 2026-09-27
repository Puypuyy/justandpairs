# Just and Pairs — Customer MVP 1

Vite + React + TypeScript + Material UI + React Router. Built from the supplied Brand Direction, Customer Website Shell and Product Catalog System documents.

## Run locally

```sh
npm install
npm run dev
```

Open the URL printed by Vite. `npm run build` type-checks and creates `dist/`. `npm test` checks pricing, validation, API contracts, cancellation, response isolation and API import boundaries. Node 22.13 or newer is recommended for the test runner. Scripts call Node directly to support the ampersand in this Windows workspace path.

## Scope

- Responsive homepage, product and occasion discovery, shared navigation and footer.
- Catalog search, filters, sorting and empty states.
- Configurable glass award pages with sizes, finishes, quantity, personalization, local file preview, deadline, delivery choice and estimate.
- Quote placeholder preserves selections in sessionStorage. No requests are transmitted.
- Help, concept portfolio and clear placeholders for future account, tracking and policy pages.
- No authentication, backend, payment, upload service or production workflows.

## Structure

- `src/theme/`: centralized MUI brand tokens and control styles.
- `src/api/`: centralized asynchronous data API, static mock adapter, models and React hooks. See [API usage and AWS migration](src/api/README.md).
- `src/utils/`: display formatting and local configuration validation/persistence. Pricing and filtering live behind the API.
- `src/components/`: reusable shell, product cards, actions and estimate.
- `src/pages/`: customer routes.

Your supplied images are in `public/images/products/`: 29 unique images represent 28 products (clear and blue geometric panels share one product). Names describe visible designs; dimensions, construction, supported finishes and prices remain unconfirmed and use the quote preview. Original demo products and their illustrative pricing are separate.

**Edit your products:** [products.ts](src/api/mock/data/products.ts). Follow the [catalog editing guide](src/api/mock/data/EDITING-GUIDE.md) for names, image paths, variants, prices and options. The [image source map](src/api/mock/data/IMAGE-SOURCES.md) tracks all 32 originals and the three duplicates.

The original two generated concept images are still used for demo records and marketing examples, not completed customer work. JPG/PNG/PDF local previews are limited to 2 MB to fit browser session storage. Files and choices clear with the session; no backend storage exists.

The hosted version is a static SPA; the host must serve `index.html` for unknown app paths. `.openai/hosting.json` declares `dist` as the static output. Google Fonts supplies Manrope and Inter with local fallback stacks.

No browser visual or interaction QA was performed; in-app preview was unavailable. Build and pure logic tests are the validation baseline.

An optional, feature-detected WebMCP `browse_product_catalog` tool opens the same filtered catalog as the UI. No supported WebMCP validation context was available, so that optional integration is unverified.
