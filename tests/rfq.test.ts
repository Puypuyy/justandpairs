import { test } from "node:test";
import assert from "node:assert/strict";
import { createMockApi } from "../src/api/mock/adapter.ts";
import {
  rfqPolicy,
  rfqStorageKey,
  type RfqStorage,
} from "../src/api/mock/rfq.ts";
import {
  ApiError,
  type RfqDraft,
  type RfqEntry,
  type RfqFile,
} from "../src/api/index.ts";
import {
  applyRfqEntry,
  firstInvalidRfqStep,
  newRfqDraft,
  nextRfqStep,
  selectRfqProduct,
  validateRfq,
} from "../src/domain/rfq.ts";
import { initialConfiguration } from "../src/utils/configuration.ts";
import { demoProducts } from "./fixtures/products.ts";

class MemoryStorage implements RfqStorage {
  values = new Map<string, string>();
  fail = false;
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.fail) throw new Error("quota");
    this.values.set(key, value);
  }
}
const products = [
  ...demoProducts,
  {
    ...demoProducts[0],
    id: "bespoke",
    type: "bespoke" as const,
    basePrice: null,
    sizes: [],
    finishes: [],
    variants: [
      {
        id: "blue",
        name: "Blue panels",
        sku: "AWD-GEO-BLU",
        image: "/blue.png",
      },
      {
        id: "clear",
        name: "Clear panels",
        sku: "AWD-GEO-CLR",
        image: "/clear.png",
      },
    ],
  },
];
const setup = (storage = new MemoryStorage(), latencyMs = 0) => ({
  storage,
  api: createMockApi({ storage, products, latencyMs }),
});
const file: RfqFile = {
  id: "file",
  name: "design.png",
  type: "image/png",
  size: 3,
  data: "data:image/png;base64,YWJj",
};
function valid(d: RfqDraft): RfqDraft {
  return {
    ...selectRfqProduct(d, products[0]),
    quantity: 5,
    step: 6,
    deadline: { date: "2099-01-01", flexible: false, rush: false },
    contact: {
      name: "Demo Customer",
      mobile: "+63 900 000 0000",
      email: "demo@example.test",
      organization: "Demo School",
    },
    acknowledged: true,
  };
}
test("RFQ progression validates each step and review catches invalid earlier answers", () => {
  let draft = newRfqDraft("test");
  assert.equal(nextRfqStep(draft, products, rfqPolicy), 0);
  draft = selectRfqProduct(draft);
  assert.equal(nextRfqStep(draft, products, rfqPolicy), 1);
  draft.step = 1;
  assert.equal(nextRfqStep(draft, products, rfqPolicy), 1);
  draft.details.description = "Custom team awards";
  for (const step of [1, 2, 3]) {
    draft.step = step;
    assert.equal(nextRfqStep(draft, products, rfqPolicy), step + 1);
  }
  draft.step = 4;
  assert.equal(nextRfqStep(draft, products, rfqPolicy), 4);
  draft.deadline.flexible = true;
  assert.equal(nextRfqStep(draft, products, rfqPolicy), 5);
  draft = valid(draft);
  assert.deepEqual(validateRfq(draft, products, rfqPolicy), {});
  draft.quantity = 0;
  assert.equal(firstInvalidRfqStep(draft, products, rfqPolicy), 2);
});
test("product handoff preserves all known choices and same entry does not overwrite edits", () => {
  const configuration = {
    ...initialConfiguration(products[0]),
    size: 10,
    finish: "Colored Etching",
    quantity: 25,
    title: "Achievement",
    recipient: "Demo",
    organization: "School",
    event: "Graduation",
    message: "Thank you",
    idea: "Use our colors",
    file,
    design: "upload" as const,
    deadline: "2099-02-01",
    rush: true,
    delivery: "Courier Delivery" as const,
  };
  const entry: RfqEntry = {
    productId: "double",
    configuration,
    sourceKey: "handoff1",
  };
  const draft = applyRfqEntry(newRfqDraft("handoff"), entry, products);
  assert.equal(draft.step, 1);
  assert.equal(draft.details.size, 10);
  assert.equal(draft.details.finish, "Colored Etching");
  for (const key of [
    "title",
    "recipient",
    "organization",
    "event",
    "message",
  ] as const)
    assert.equal(draft.details[key], configuration[key]);
  assert.equal(draft.quantity, 25);
  assert.equal(draft.artwork.files[0].data, file.data);
  assert.equal(draft.artwork.choice, "design");
  assert.equal(draft.artwork.idea, configuration.idea);
  assert.equal(draft.deadline.date, configuration.deadline);
  assert.equal(draft.deadline.rush, true);
  assert.equal(draft.delivery.method, "Courier Delivery");
  draft.quantity = 30;
  assert.equal(applyRfqEntry(draft, entry, products).quantity, 30);
  assert.equal(
    applyRfqEntry(draft, { ...entry, sourceKey: "handoff2" }, products)
      .quantity,
    25,
  );
});
test("product changes clear unsupported choices while preserving contact, quantity and artwork", () => {
  const draft = valid(newRfqDraft("switch"));
  draft.artwork.files = [file];
  draft.details.size = 10;
  const changed = selectRfqProduct(draft, products.at(-1));
  assert.equal(changed.details.size, null);
  assert.equal(changed.details.finish, "");
  assert.equal(changed.variantId, "blue");
  assert.deepEqual(changed.contact, draft.contact);
  assert.deepEqual(changed.artwork, draft.artwork);
  assert.equal(changed.quantity, 5);
  assert.equal(changed.acknowledged, false);
  const custom = selectRfqProduct(changed);
  assert.equal(custom.selection, "custom");
  assert.equal(custom.productId, null);
  assert.equal(custom.variantId, "");
});
test("RFQ validation handles contact, conditional address, actual dates and file limits", () => {
  const draft = valid(newRfqDraft("validate"));
  draft.contact.email = "wrong";
  draft.contact.mobile = "123";
  draft.delivery.method = "Courier Delivery";
  draft.deadline.date = "2099-02-31";
  let errors = validateRfq(draft, products, rfqPolicy);
  assert.ok(
    errors.email && errors.mobile && errors["delivery.address"] && errors.date,
  );
  draft.delivery.method = "Pickup";
  draft.deadline.flexible = true;
  errors = validateRfq(draft, products, rfqPolicy);
  assert.ok(!errors["delivery.address"] && !errors.date);
  draft.artwork.choice = "design";
  assert.ok(validateRfq(draft, products, rfqPolicy, 3).files);
  draft.artwork.files = [file];
  assert.deepEqual(validateRfq(draft, products, rfqPolicy, 3), {});
  for (const bad of [
    { ...file, type: "image/svg+xml" },
    { ...file, size: rfqPolicy.maxFileBytes + 1 },
    { ...file, data: "javascript:alert(1)" },
  ]) {
    draft.artwork.files = [bad];
    assert.ok(validateRfq(draft, products, rfqPolicy, 3).files);
  }
  draft.artwork.files = Array(4).fill(file);
  assert.ok(validateRfq(draft, products, rfqPolicy, 3).files);
  draft.artwork.files = [];
  draft.artwork.choice = "reference";
  assert.ok(validateRfq(draft, products, rfqPolicy, 3).idea);
  draft.artwork.idea = "Reference description";
  assert.deepEqual(validateRfq(draft, products, rfqPolicy, 3), {});
});
test("draft persistence survives adapter recreation including step and local previews", async () => {
  const { api, storage } = setup();
  const first = await api.rfq.openDraft();
  const draft = valid(first);
  draft.artwork.files = [file];
  const saved = await api.rfq.saveDraft(draft);
  assert.equal(saved.revision, first.revision + 1);
  saved.contact.name = "Caller mutation";
  const restored = await setup(storage).api.rfq.openDraft();
  assert.equal(restored.step, 6);
  assert.equal(restored.contact.name, "Demo Customer");
  assert.equal(restored.artwork.files[0].data, file.data);
  assert.equal(restored.id, first.id);
});
test("mock submit is validated, atomic, idempotent and persisted with a snapshot and estimate", async () => {
  const { api, storage } = setup();
  const initial = await api.rfq.openDraft();
  await assert.rejects(
    api.rfq.submit(initial),
    (e: unknown) =>
      e instanceof ApiError &&
      e.code === "VALIDATION_ERROR" &&
      !!e.fieldErrors.name,
  );
  const draft = valid(initial);
  draft.artwork.files = [file];
  const saved = await api.rfq.saveDraft(draft);
  const [record, retry] = await Promise.all([
    api.rfq.submit(saved),
    api.rfq.submit(saved),
  ]);
  assert.equal(record.id, retry.id);
  assert.match(record.reference, /^JP-RFQ-\d{6}-[A-F0-9]{6}$/);
  assert.equal(record.status, "LOCAL_DEMO");
  assert.equal(record.productSnapshot?.name, products[0].name);
  assert.equal(record.estimate?.total, 9000);
  assert.equal(record.draft.artwork.files[0].name, "design.png");
  assert.equal(record.draft.artwork.files[0].data, "");
  assert.equal(JSON.parse(storage.getItem(rfqStorageKey)!).records.length, 1);
  record.draft.contact.name = "Changed";
  assert.equal(
    (await setup(storage).api.rfq.getRecord(record.id)).draft.contact.name,
    "Demo Customer",
  );
  const next = await api.rfq.openDraft();
  assert.notEqual(next.id, record.id);
  assert.equal(next.selection, "");
  await assert.rejects(
    api.rfq.saveDraft(saved),
    (e: unknown) => e instanceof ApiError && e.code === "INVALID_REQUEST",
  );
});
test("bespoke and custom requests submit without inventing prices or supported specifications", async () => {
  for (const selection of ["bespoke", "custom"]) {
    const { api } = setup();
    let d = valid(await api.rfq.openDraft());
    d = selectRfqProduct(
      d,
      products.find((p) => p.id === selection),
    );
    d.details.description = "Custom requirements";
    d.details.requestedSize = "Prefer portrait proportions";
    d.acknowledged = true;
    const record = await api.rfq.submit(await api.rfq.saveDraft(d));
    assert.equal(record.estimate, null);
    assert.equal(record.draft.details.size, null);
    assert.equal(
      record.draft.details.requestedSize,
      "Prefer portrait proportions",
    );
  }
});
test("storage failures are explicit and never produce a false submission confirmation", async () => {
  const { api, storage } = setup();
  const draft = await api.rfq.saveDraft(valid(await api.rfq.openDraft()));
  const before = storage.getItem(rfqStorageKey);
  storage.fail = true;
  await assert.rejects(
    api.rfq.submit(draft),
    (e: unknown) => e instanceof ApiError && e.code === "UNAVAILABLE",
  );
  assert.equal(storage.getItem(rfqStorageKey), before);
  storage.fail = false;
  assert.ok((await api.rfq.submit(draft)).reference);
});
test("stale drafts cannot overwrite newer revisions and cancellation has no side effects", async () => {
  const { api, storage } = setup();
  const draft = await api.rfq.openDraft();
  const saved = await api.rfq.saveDraft({ ...draft, quantity: 10 });
  await assert.rejects(
    api.rfq.saveDraft({ ...draft, quantity: 99 }),
    (e: unknown) => e instanceof ApiError && e.code === "CONFLICT",
  );
  const slow = setup(storage, 20).api;
  const controller = new AbortController();
  const pending = slow.rfq.saveDraft(
    { ...saved, quantity: 20 },
    { signal: controller.signal },
  );
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
  assert.equal((await api.rfq.openDraft()).quantity, 10);
});
test("empty receipts and corrupted local state return typed errors", async () => {
  const { api, storage } = setup();
  await assert.rejects(
    api.rfq.getRecord("missing"),
    (e: unknown) => e instanceof ApiError && e.code === "NOT_FOUND",
  );
  await assert.rejects(
    api.rfq.openDraft({ productId: "missing", sourceKey: "test" }),
    (e: unknown) => e instanceof ApiError && e.code === "NOT_FOUND",
  );
  storage.setItem(rfqStorageKey, "{broken");
  await assert.rejects(
    api.rfq.openDraft(),
    (e: unknown) => e instanceof ApiError && e.code === "INVALID_REQUEST",
  );
  storage.values.clear();
  assert.ok((await api.rfq.openDraft()).id);
});
