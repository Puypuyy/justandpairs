# Customer MVP 1.5 — Guided local RFQ

Implemented scope ends at a local demo receipt. No customer account, admin workflow, authentication, payment, production workflow or real backend was added.

## Routes and entry points

- `/request-quote`: Product → Specifications → Quantity → Artwork → Deadline → Delivery & Contact → Review → local submission.
- `/request-quote?product=<slug>&variant=<id>`: product and visual-option handoff; router state carries existing configuration.
- `/request-quote?mode=custom`: Something Custom entry.
- `/request-quote?mode=bulk`: organization-oriented introduction using the same form.
- `/request-quote/confirmation/:id`: persisted local receipt, reloadable in the same browser/origin.
- `/quote-preview`: retained original configuration preview, with a link into the new flow. Product/variant query parameters and configuration router state remain supported.

Existing homepage, catalog, product-detail and help routes remain. Homepage and product CTAs now enter the guided request. Configurable product-detail validation remains unchanged.

## API contracts

The existing catalog methods remain on `CustomerApi`. A nested `rfq: RfqApi` keeps the new workflow separate:

| Method | Result / behavior |
| --- | --- |
| `getPolicy(options?)` | Local file count, size and type limits |
| `openDraft(entry?, options?)` | Restore or create a draft; apply a new product handoff once |
| `saveDraft(draft, options?)` | Save incomplete progress and increment its revision |
| `discardDraft(options?)` | Remove the current draft, retaining submitted receipts |
| `submit(draft, options?)` | Validate, create one local demo record and clear the draft |
| `getRecord(id, options?)` | Read a persisted local receipt |

All methods return Promises, honor AbortSignal before mutation and return independent copies. `ApiError` now also supports `VALIDATION_ERROR`, `CONFLICT` and `fieldErrors`. Existing error codes remain unchanged.

Models: `RfqDraft`, `RfqEntry`, `RfqFile`, `RfqPolicy`, `RfqRecord`, `RfqApi`. `quantityBreakdown` reserves a typed extension for later merchandise variants; this MVP uses one quantity.

Pages access `useApi()` / `useRequest()` / `usePriceEstimate()` and never import static records or touch RFQ persistence directly. `src/domain/rfq.ts` centralizes handoff, product changes, validation and progression.

## Local state

`localStorage['jp_rfq_state_v1']` contains a versioned envelope with one active draft and submitted receipts. Using one envelope lets the mock adapter write the receipt and remove the draft in one storage operation.

- Draft ID is the submission idempotency key. Retrying returns the same receipt.
- Draft revisions detect stale writes; autosaves are serialized and debounced by 450 ms.
- Drafts include contact details, progress, specifications, artwork preview data and local file metadata.
- Receipts include a product snapshot, requirements, optional illustrative estimate and reference `JP-RFQ-YYYYMM-XXXXXX`.
- Receipt status is `LOCAL_DEMO`, never an assertion that the business received the request.
- Preview bytes are removed after submission. Original filenames and metadata remain in the receipt.
- Catalog seed records are never mutated. Existing product sessionStorage behavior remains.
- Failed storage writes do not show success or discard the draft. The UI exposes retry and storage guidance.

## Files added

- `src/api/rfq-types.ts`: public RFQ models and interface.
- `src/api/mock/rfq.ts`: asynchronous mock operations, local persistence and file policy.
- `src/api/useRfqAutosave.ts`: serialized draft autosave hook.
- `src/domain/rfq.ts`: progression, handoff and validation rules.
- `src/pages/Rfq.tsx`: guided form, pricing state and local confirmation.
- `src/pages/rfq.css`: responsive form, step navigation, files and review layouts.
- `src/components/RfqSummary.tsx`: shared editable review / immutable receipt summary.
- `tests/rfq.test.ts`: ten RFQ domain and mock API tests.
- `tests/fixtures/products.ts`: isolated copies of original demo products for existing API contract tests.
- `docs/CUSTOMER_MVP_1_5.md`: this implementation report.

## Files updated

- `src/api/contracts.ts`, `src/api/index.ts`: expose the nested API and RFQ types.
- `src/api/errors.ts`: typed validation/conflict errors and field errors.
- `src/api/mock/adapter.ts`: compose RFQ operations; injectable product fixtures/storage for deterministic tests.
- `src/api/react.tsx`: expose shared client access and request hook.
- `src/main.tsx`: guided request, confirmation and retained preview routes.
- `src/pages/ProductDetail.tsx`: carry configuration and visual option into RFQ with a distinct entry identity.
- `src/pages/Home.tsx`: custom and bulk entry parameters.
- `src/pages/Supporting.tsx`: keep original preview, clarify local mode and link to guided request.
- `tests/api.test.ts`, `tests/catalog.test.ts`: preserve original assertions using dedicated fixtures rather than requiring demo products in the live catalog.
- `README.md`, `src/api/README.md`: current workflow and API documentation.

The pre-existing local edits in `src/api/mock/data.ts` and `src/api/mock/data/demo-products.ts` disable demo catalog products. They were preserved. The original three DOCX references were not edited.

## Verification

The baseline had 10 passing and 5 failing tests: the five failures assumed disabled demo records were still active. All original 15 tests are retained. Fixture injection preserves their original pricing, filtering, isolation and naming assertions without re-enabling demo products for customers.

Ten new tests cover:

1. Step progression and review revalidation.
2. Full product configuration handoff without overwriting resumed edits.
3. Product changes and removal of unsupported options.
4. Contact, conditional courier fields, dates, artwork and file limits.
5. Persistence across adapter recreation, including step and file preview.
6. Validated, idempotent submission, snapshot, estimate and receipt persistence.
7. Custom/bespoke requests without fabricated prices or specifications.
8. Storage failure and successful retry without false confirmation.
9. Stale revision rejection and cancellation without mutation.
10. Missing receipts/products and corrupt stored data errors.

Required commands: `npm test` and `npm run build`. Browser visual/interaction QA has not been performed for this change; responsive behavior is implemented through layout breakpoints and accessible semantic/MUI controls, not claimed as visually verified.

## Assumptions and limitations

- One active RFQ draft per browser origin. There is no cross-device synchronization or secure multi-user isolation.
- LocalStorage may be unavailable, full or cleared. Wait for “Saved on this browser” before closing/reloading; abrupt closure before autosave can lose the most recent edit.
- Files are local previews only: up to three JPG/PNG/PDF files, maximum 2 MB each and 2 MB combined. Limits are editable in `src/api/mock/rfq.ts` and delivered through `getPolicy()`.
- Browser-native PDF preview support varies; the selected filename remains visible when preview is unavailable.
- The existing demo products stay disabled as found. Current supplied products remain bespoke, so their RFQs show pricing to be confirmed. Configurable pricing and handoff are covered with fixtures.
- Preferred dimensions/finishes on unconfirmed products are requests, not promises of availability. The existing configurable price engine still supports square sizes only.
- Generic merchandise requests use descriptive fields; a shirt-size quantity matrix is outside MVP 1.5.
- `discardDraft` is available through the API; no broad admin/reset interface was introduced.
- Corrupt storage is reported rather than silently overwritten. Clearing this site's browser storage removes local drafts and receipts.
- References and confirmations are local demonstrations. Nothing is uploaded, emailed, delivered to staff, reserved, charged or sent to AWS.
