import { test } from "node:test";
import assert from "node:assert/strict";
import { estimatePrice } from "../src/utils/pricing.ts";
import {
  initialConfiguration,
  validateConfiguration,
} from "../src/utils/configuration.ts";
import { filterProducts } from "../src/utils/catalog.ts";
import type { Product } from "../src/types/catalog.ts";
const product: Product = {
  id: "test",
  sku: "JP-TEST",
  slug: "test",
  name: "Glass Plaque",
  category: "plaques",
  type: "configurable",
  description: "Clear glass recognition",
  shortDescription: "Glass",
  image: "/test.png",
  sizes: [6, 7, 8, 9, 10, 11, 12],
  finishes: ["Full-Color Print", "Etched", "Colored Etching"],
  style: "Double Glass",
  occasionTags: ["corporate"],
  basePrice: 1800,
  featured: true,
};
test("estimate combines options, quantity and 50% deposit", () => {
  assert.deepEqual(
    estimatePrice(product, {
      size: 10,
      finish: "Colored Etching",
      quantity: 5,
    }),
    { unit: 3550, total: 17750, deposit: 8875 },
  );
});
test("all plaque sizes produce estimates", () => {
  for (const size of product.sizes)
    assert.ok(
      estimatePrice(product, { size, finish: "Etched", quantity: 1 })?.total,
    );
});
test("invalid quantities and unsupported options never produce estimates", () => {
  for (const quantity of [0, -1, 1.5, 10000, NaN])
    assert.equal(
      estimatePrice(product, { size: 6, finish: "Etched", quantity }),
      null,
    );
  assert.equal(
    estimatePrice(product, { size: 99, finish: "Etched", quantity: 1 }),
    null,
  );
  assert.equal(
    estimatePrice(product, { size: 6, finish: "unknown", quantity: 1 }),
    null,
  );
});
test("quote readiness requires date and design file when upload selected", () => {
  const c = initialConfiguration(product);
  assert.ok(validateConfiguration(c).deadline);
  c.deadline = "2099-01-01";
  assert.deepEqual(validateConfiguration(c), {});
  c.design = "upload";
  assert.ok(validateConfiguration(c).file);
  c.file = {
    name: "test.pdf",
    type: "application/pdf",
    size: 1,
    data: "data:application/pdf;base64,AA==",
  };
  assert.deepEqual(validateConfiguration(c), {});
  c.deadline = "2000-01-01";
  assert.ok(validateConfiguration(c).deadline);
});
test("filters intersect and sorting puts unknown prices last", () => {
  const other = {
    ...product,
    id: "other",
    category: "shirts",
    name: "Shirt",
    basePrice: undefined,
    sizes: [],
    featured: false,
  };
  assert.equal(
    filterProducts([product, other], {
      query: "GLASS",
      size: "8",
      occasion: "corporate",
    }).length,
    1,
  );
  assert.equal(
    filterProducts([product, other], { size: "9", category: "shirts" }).length,
    0,
  );
  assert.equal(
    filterProducts([other, product], { sort: "price-low" })[0].id,
    "test",
  );
  assert.equal(
    filterProducts([other, product], { sort: "price-high" })[0].id,
    "test",
  );
});
