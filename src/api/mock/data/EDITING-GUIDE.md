# Edit your catalog here

Start with **products.ts**. Each object is one of your supplied product designs. You can change its `name`, `description`, `shortDescription`, `image`, `featured` flag, and confirmed options directly. Save the file and Vite refreshes the local site. A hosted site needs a new build/deployment to show edits.

## Where to change things

| File               | What you edit                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `products.ts`      | Your 28 supplied designs, images, descriptions and design variants                                 |
| `demo-products.ts` | The 8 original MVP examples, including the sample configurable plaques                             |
| `categories.ts`    | Product families and categories; each category belongs to one family                               |
| `options.ts`       | Shared size choices, size guidance and customer-facing finish descriptions                         |
| `occasions.ts`     | Occasion labels used by filters and product tags                                                   |
| `site.ts`          | Portfolio examples, process steps and section images                                               |
| `../pricing.ts`    | Example size/finish surcharges and deposit calculation                                             |
| `../content.ts`    | Help, FAQ and informational page text                                                              |
| `../data.ts`       | Combines these files for the mock API; remove `...demoProducts` here to hide the original examples |
| `IMAGE-SOURCES.md` | Maps every original filename to its renamed catalog image                                          |

Product images live in `public/images/products/`. For example, `/images/products/flame.png` is the browser path for `public/images/products/flame.png`. Replace a file in place to keep the same path, or change the product's `image`. Images were copied unchanged. The 32 source files contain 29 unique images; three exact duplicates are mapped to their existing asset. Clear and blue geometric panels are two options on one product.

## Meaning of the fields

- `id`: stable internal identifier. Do not change it for a simple rename.
- `slug`: stable page URL. Keep it unchanged when renaming unless you also add a redirect for old links.
- `name`: clear product type and distinguishing design, without dimensions, process codes or SKU. Example: `Flame Recognition Award`.
- `category`: a category slug from `categories.ts`. Its family is resolved from that category, so family is not repeated on every product.
- `sku`: internal product code, such as `PLQ-DG` or `AWD-FLM`. This is a product code, not a final size/finish stock variant.
- `type`: `bespoke` uses the quote preview; `configurable` enables the existing size/finish configurator.
- `basePrice`: `null` means no confirmed price. It never means free. Numbers are PHP per piece before example option adjustments.
- `sizes`: supported square sizes in inches, e.g. `[6, 8, 10]`. `[]` means unconfirmed. The current MVP configurator supports square dimensions only; do not put a portrait award into this list based on its photo. Rectangular dimensions require extending the configuration and pricing contract first.
- `finishes`: supported exact names: `Full-Color Print`, `Etched`, `Colored Etching`. `[]` means unconfirmed. Adding a shared finish label does not enable it on every product. Add `Combination` only after confirming it, and add its price rule if estimates are needed.
- `variants`: optional physical design choices. Each has a stable `id`, customer-facing `name`, internal `sku` and its own `image`. Base color/accent is a design option; it does not imply a printing or etching process.
- `material`: currently `null` for supplied images. Confirm construction with your actual product specifications before changing it.
- `occasionTags`: occasion slugs. Reuse the same physical product for corporate, graduation and event occasions instead of making duplicate products.
- `featured`: show on the home page. Keep a small selection (currently six).
- `imageKind`: `reference` for your provided design images, `concept` for the original MVP illustrations.
- `specificationNote`: what still needs confirmation; update it when details are known.

## Example: changing a name or price

Find `id: "flame"` in `products.ts` and edit the adjacent fields:

```ts
name: "Flame Recognition Award",
shortDescription: "A smooth flame silhouette on a layered display base.",
basePrice: null, // Replace only with your verified numeric price.
```

To enable the configurator, verify square dimensions and supported finishes, set `type: "configurable"`, enter `basePrice`, `sizes` and `finishes`, then review the example surcharges in `../pricing.ts`. These rates are shared across configurable products today; implement per-product rules there before using different pricing schedules. Run `npm test` and `npm run build` after changes.

## Names, variants and SKUs

Hierarchy: family → category → product → options → SKU. Customer cards display the product name. `configurationSku()` from `src/api` returns an internal SKU for a supported size/finish, e.g. `PLQ-DG-1010-CE`. `formatSize()` renders `10 × 10 in`. No size/SKU is invented for unconfirmed dimensions. Visual variant SKUs such as `AWD-GEO-BLU` identify the design only until exact stock configurations are known.

`FP` = Full-Color Print, `ET` = Etched, `CE` = Colored Etching, `COM` = Combination. Product prefixes follow your naming prompt: `PLQ`, `AWD`, `TRP`, `MDL`, `SHT`, `STK`, `KCH`, `GVW`, `MER`.

## AWS later

All pages still read through `src/api`. Keep editing static files while the mock is active. When your backend is ready, implement the same `CustomerApi` contract and switch `src/api/client.ts`. No AWS credentials or assumed endpoints have been added. The MVP 1.5 guided RFQ saves a local draft and demo receipt through `api.rfq`; no request is sent to Just and Pairs. See `docs/CUSTOMER_MVP_1_5.md` for the workflow and storage limits.
