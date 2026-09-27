import { createMockApi } from "../src/api/mock/adapter.ts";
import { demoProducts } from "./fixtures/products.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { api, configurationSku, formatSize } from "../src/api/index.ts";

test("catalog references, public URLs and structured internal codes are valid", async () => {
  const data = await api.getSiteData();
  for (const key of ["id", "slug", "sku"] as const) {
    assert.equal(
      new Set(data.products.map((p) => p[key])).size,
      data.products.length,
      key,
    );
  }
  for (const p of data.products) {
    const category = data.categories.find((c) => c.slug === p.category);
    assert.ok(category, p.name);
    assert.ok(data.families.some((f) => f.slug === category.family));
    assert.ok(
      p.occasionTags.every((tag) => data.occasions.some((o) => o.slug === tag)),
    );
    assert.match(p.sku, /^(PLQ|AWD|TRP|MDL|SHT|STK|KCH|GVW|MER)-[A-Z0-9]+$/);
    assert.ok(existsSync(`public${p.image}`), p.image);
    for (const v of p.variants ?? []) assert.ok(existsSync(`public${v.image}`));
  }
});

test("supplied designs do not fabricate dimensions, processes or pricing", async () => {
  const data = await api.getSiteData();
  const supplied = data.products.filter((p) => p.imageKind === "reference");
  assert.equal(supplied.length, 28);
  for (const p of supplied) {
    assert.equal(p.basePrice, null);
    assert.deepEqual(p.sizes, []);
    assert.deepEqual(p.finishes, []);
    assert.equal(
      await api.estimatePrice({
        productId: p.id,
        size: 8,
        finish: "Etched",
        quantity: 1,
      }),
      null,
    );
  }
  const geometric = supplied.find((p) => p.id === "geometric-panel")!;
  assert.deepEqual(
    geometric.variants?.map((v) => v.id),
    ["clear", "blue"],
  );
  assert.equal(new Set(geometric.variants?.map((v) => v.sku)).size, 2);
  const files = readdirSync("public/images/products");
  assert.equal(files.length, 29);
  const hashes = files.map((f) =>
    createHash("sha256")
      .update(readFileSync(`public/images/products/${f}`))
      .digest("hex"),
  );
  assert.equal(new Set(hashes).size, 29);
});

test("family filters and option SKU naming preserve catalog hierarchy", async () => {
  const api = createMockApi({ latencyMs: 0, products: demoProducts });
  const data = await api.getSiteData();
  const merchandise = await api.listProducts({ family: "merchandise" });
  assert.ok(merchandise.length);
  assert.ok(
    merchandise.every(
      (p) =>
        data.categories.find((c) => c.slug === p.category)?.family ===
        "merchandise",
    ),
  );
  assert.deepEqual(
    await api.listProducts({ family: "merchandise", category: "glass-awards" }),
    [],
  );
  const plaque = data.products.find((p) => p.id === "double")!;
  assert.equal(
    configurationSku(plaque, 10, "Colored Etching"),
    "PLQ-DG-1010-CE",
  );
  assert.equal(
    configurationSku(plaque, 6, "Full-Color Print"),
    "PLQ-DG-0606-FP",
  );
  assert.equal(configurationSku(plaque, 99, "Etched"), null);
  assert.equal(configurationSku(plaque, 6, "Combination"), null);
  assert.equal(formatSize(6), "6 × 6 in");
  assert.equal(formatSize(10, 12), "10 × 12 in");
});
