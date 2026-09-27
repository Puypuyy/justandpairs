# Central data API

All application data access lives in this folder. Components must not import `mock/*`, call `fetch`, or know where data is stored.

```text
React pages/components
    → api/react.tsx (shared data and request hooks)
    → api/client.ts (the active CustomerApi implementation)
    → api/mock/adapter.ts (asynchronous imitation API)
    → api/mock/data/ (editable records), content.ts, pricing.ts
```

## Public usage

For React, import from `src/api/react`:

```tsx
const { categories, occasions, products } = useSiteData();
const result = useProducts({ category: "plaques", sort: "price-low" });
const pricing = usePriceEstimate({
  productId: "double",
  size: 10,
  finish: "Etched",
  quantity: 5,
});
// result and pricing expose data, loading, error, and retry.
```

`ApiProvider` fetches shared site data once per mount and shares it with the shell and pages. Its loading/error/retry state prevents components reading unavailable data. React Strict Mode may start and cancel an extra request during development. Catalog and price requests cancel when inputs change or the component unmounts. Late responses are ignored and outdated prices are never displayed for new selections. All estimate views on a product page share one request.

For non-React code, import the client from `src/api`:

```ts
const products = await api.listProducts({
  query: "glass",
  occasion: "corporate-recognition",
});
const product = await api.getProduct("double-glass-recognition-plaque");
const estimate = await api.estimatePrice({
  productId: product.id,
  size: 8,
  finish: "Etched",
  quantity: 3,
});
```

Every method accepts an optional `{ signal: AbortSignal }`. A missing product rejects with `ApiError` and code `NOT_FOUND`; an incomplete/unsupported price configuration returns `null`. An empty catalog match returns `[]`. Estimates send only the product ID and pricing options, never personalization or design files.

## Static data today

- `mock/data/products.ts`: your product records. Start here. See [the editing guide](mock/data/EDITING-GUIDE.md).
- `mock/data/demo-products.ts`: the original sample products and prices.
- `mock/data/`: separate categories/families, occasions, options and site content files.
- `mock/data.ts`: assembles the records for the API.
- `naming.ts`: dimension formatting and structured internal configuration SKUs.
- `mock/content.ts`: help and informational page content.
- `mock/pricing.ts`: illustrative price rules; never imported by UI.
- `mock/filtering.ts`: simulated server-side filtering and sorting.
- `mock/adapter.ts`: implements the same asynchronous contract a remote service will use. Default latency is 120 ms. Responses are cloned so consumers cannot mutate source fixtures. No HTTP server, network request, AWS resource or credential is needed.
- `types.ts` and `contracts.ts`: shared domain models and adapter interface.

Local configuration persistence and file previews stay in the browser; these are user state, not remote API data. UI labels and presentation copy remain in components. Currency formatting remains a display utility.

## AWS later

1. Implement `CustomerApi` in a new `src/api/aws/adapter.ts` using the actual agreed backend routes. Put HTTP handling, base URL, response validation and error translation inside this folder.
2. Preserve the models in `contracts.ts` (map AWS payloads here if their shapes differ), including cancellation, empty results, missing products and nullable estimates.
3. Change the single adapter selection in `client.ts` from `createMockApi()` to the AWS implementation. Pages and hooks keep their existing imports.
4. Run the same API contract tests against the new adapter with a controlled transport. Configure only a public endpoint in client environment variables; never embed AWS secret keys in the frontend.

No AWS endpoint, auth scheme or infrastructure is assumed or provisioned yet. `getSiteData()` intentionally supplies the whole small MVP catalog; pagination can be added to the contract when the backend/catalog needs it.
