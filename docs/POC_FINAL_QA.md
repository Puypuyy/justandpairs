# Static POC final QA

Reviewed: 1 October 2026

## Automated checks

- TypeScript production build passes.
- Vite production bundle builds successfully.
- All existing API, catalog, pricing, validation, cancellation and RFQ tests pass.
- Hosting configuration uses SPA fallback for direct route access.
- Customer and admin areas are route-level lazy-loaded.

## Viewport review

- Admin overview reviewed at a 1440 × 1100 desktop viewport.
- Customer tracking reviewed at a 390 × 844 phone viewport.
- Navigation, cards, forms and primary actions remain usable at both sizes.
- Dark-background heading contrast defects found during review were corrected.

## Accessibility review

- Main customer shell retains skip navigation and semantic `main` content.
- Admin navigation has an accessible label.
- Icon-only close, print and edit controls have accessible names.
- Search and workflow status controls have explicit labels.
- Dialogs use Material UI focus management and keyboard dismissal.
- Status is communicated with text as well as color.

## Static limitations

- Data is device/browser-local and is not synchronized.
- Customer acceptance and design approval are previews and are not transmitted.
- Payment information is intentionally non-transactional.
- Authentication, secure uploads, notifications and audit history require the backend.
- Business contact details, final prices/specifications, testimonials and completed-project images must be verified by the business before publication.
