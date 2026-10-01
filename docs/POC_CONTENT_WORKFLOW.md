# POC content and workflow refinement

## Working static flow

1. A customer browses the catalog and creates a quotation request.
2. The local request appears in `/admin` under **Quote requests**.
3. Admin moves it through `New`, `Reviewing`, `Quoted`, `Won` or `Declined`.
4. Moving a request to `Won` creates one order in `Awaiting artwork`.
5. Orders progress through artwork, approval, production, ready and completed stages.
6. Notification copy is prepared for the important transitions, but no message is sent in the static POC.

## Content workflow

- Product and homepage edits are saved under `localStorage['jp_admin_poc_v1']`.
- A storefront reload reads those local overrides.
- New products receive a generated stable id and slug.
- Unconfirmed prices, materials, sizes and finishes remain unknown rather than being invented.
- Customer RFQs remain in `localStorage['jp_rfq_state_v1']`.

## Backend handoff

The backend should replace local storage behind the existing API boundary. It must add authentication, roles, validation, durable quote/order history, file storage, notifications, audit logs and concurrency controls. Static POC labels must not be interpreted as real delivery, payment or production actions.
