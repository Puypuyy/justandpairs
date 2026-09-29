# Customer MVP 1.6 - Static website completion

This milestone extends the completed local RFQ with the public information customers need before backend services are connected. All new behavior remains static or browser-local.

## Completed pages

- `/about`: Brand purpose, customer segments, working principles and order journey.
- `/contact`: Clear routes into the local RFQ and help content without publishing unverified contact details.
- `/terms`: Current preview terms covering product information, local requests, artwork and payments.
- `/privacy`: Local storage, selected file behavior, Google Fonts and customer controls.
- Unknown routes: Dedicated customer-facing 404 page.

## Static-site foundations

- Page-specific document titles and meta descriptions for primary routes.
- `robots.txt` permits indexing when the site is deployed publicly.
- Footer links now resolve to complete About, Contact, Terms and Privacy pages.
- Help copy reflects the completed local quotation workflow.
- Responsive layouts are included for the new static pages.

## Source constraints

The supplied Brand Direction and Customer Website Shell guide the language, hierarchy and visual treatment. They do not contain a verified business email, phone number, address, opening hours or formal legal entity details. The website does not invent those facts. They should replace the Contact placeholder notice when supplied.

## Deferred work

- Real enquiry submission and backend APIs.
- Customer accounts, authentication and order tracking.
- Payments, staff administration and production workflow.
- Verified contact channels and formal business legal terms.
- Customer testimonials or completed-project claims without approved source material.

## Verification

- TypeScript compilation passes.
- The Vite production bundle builds successfully with Node 16's experimental global web crypto enabled. Node 22 remains the recommended project runtime.
- All 26 automated logic and API tests pass through an ESBuild compatibility bundle on the installed Node 16 runtime.
- `git diff --check` passes.
- Automated browser visual QA remains outstanding because no controllable browser is available in the current environment.

