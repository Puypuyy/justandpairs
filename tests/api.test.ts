import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { api, ApiError } from "../src/api/index.ts";
import { createMockApi } from "../src/api/mock/adapter.ts";

import { demoProducts } from "./fixtures/products.ts";
const client = createMockApi({ latencyMs: 0, products: demoProducts });

test("public client delivers shared content asynchronously", async () => {
  const pending = api.getSiteData();
  assert.ok(pending instanceof Promise);
  const data = await pending;
  assert.equal(data.categories.length, 6);
  assert.equal(data.occasions.length, 6);
  assert.ok(data.products.length && data.faq.length && data.portfolio.length);
  assert.ok(data.pageContent["/privacy"]);
  assert.deepEqual(data.sizes, [6, 7, 8, 9, 10, 11, 12]);
});

test("responses cannot mutate fixtures or another response", async () => {
  const first = await client.getSiteData();
  first.products[0].name = "Changed";
  first.products[0].sizes.push(99);
  first.categories.length = 0;
  const second = await client.getSiteData();
  assert.notEqual(second.products[0].name, "Changed");
  assert.ok(!second.products[0].sizes.includes(99));
  assert.equal(second.categories.length, 6);
  const detail = await client.getProduct(second.products[0].slug);
  detail.sizes.length = 0;
  assert.equal((await client.getProduct(detail.slug)).sizes.length, 7);
});

test("catalog query intersects filters and sorts without altering source order", async () => {
  const before = await client.listProducts();
  const result = await client.listProducts({
    category: "plaques",
    query: "GLASS",
    size: "10",
    finish: "Etched",
    occasion: "corporate-recognition",
    sort: "price-low",
  });
  assert.equal(result.length, 2);
  assert.ok(result[0].basePrice! < result[1].basePrice!);
  assert.deepEqual(await client.listProducts({ query: "no-such-product" }), []);
  assert.deepEqual(
    await client.listProducts({ category: "shirts", size: "10" }),
    [],
  );
  assert.deepEqual(await client.listProducts(), before);
});

test("price endpoint looks up the product and preserves existing totals", async () => {
  assert.deepEqual(
    await client.estimatePrice({
      productId: "double",
      size: 10,
      finish: "Colored Etching",
      quantity: 5,
    }),
    { unit: 3550, total: 17750, deposit: 8875 },
  );
  assert.equal(
    await client.estimatePrice({
      productId: "double",
      size: 10,
      finish: "Etched",
      quantity: 0,
    }),
    null,
  );
  assert.equal(
    await client.estimatePrice({
      productId: "shirt",
      size: 6,
      finish: "Etched",
      quantity: 1,
    }),
    null,
  );
});

test("missing records reject consistently and a later request still succeeds", async () => {
  const missing = (error: unknown) =>
    error instanceof ApiError && error.code === "NOT_FOUND";
  await assert.rejects(client.getProduct("does-not-exist"), missing);
  await assert.rejects(
    client.estimatePrice({
      productId: "missing",
      size: 6,
      finish: "Etched",
      quantity: 1,
    }),
    missing,
  );
  assert.equal(
    (await client.getProduct("double-glass-recognition-plaque")).id,
    "double",
  );
});

test("pre-aborted and in-flight requests cancel without affecting subsequent requests", async () => {
  const slow = createMockApi({ latencyMs: 20 });
  const controller = new AbortController();
  const request = slow.listProducts({}, { signal: controller.signal });
  controller.abort();
  await assert.rejects(request, { name: "AbortError" });
  await assert.rejects(slow.getSiteData({ signal: controller.signal }), {
    name: "AbortError",
  });
  assert.ok((await slow.listProducts()).length);
});

test("application code only uses the public API boundary for data access", () => {
  function inspect(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (directory === "src" && entry.name === "api") continue;
      const filename = join(directory, entry.name);
      if (entry.isDirectory()) inspect(filename);
      else if (/\.tsx?$/.test(entry.name)) {
        const source = readFileSync(filename, "utf8");
        assert.doesNotMatch(
          source,
          /from\s+["'][^"']*(?:api\/mock|data\/catalog|api\/client|api\/contracts|api\/types)["']/,
          filename,
        );
        assert.doesNotMatch(source, /\bfetch\s*\(/, filename);
      }
    }
  }
  inspect("src");
});
