import type {
  Product,
  RequestOptions,
  RfqApi,
  RfqDraft,
  RfqEntry,
  RfqRecord,
} from "../index.ts";
import { ApiError } from "../errors.ts";
import { applyRfqEntry, newRfqDraft, validateRfq } from "../../domain/rfq.ts";
import { estimatePrice } from "./pricing.ts";
import { createId } from "../../utils/id.ts";

// Only mock persistence lives here. UI never reads or writes transactional storage.
export const rfqStorageKey = "jp_rfq_state_v1";
export const rfqPolicy = {
  maxFiles: 3,
  maxFileBytes: 2 * 1024 * 1024,
  maxTotalBytes: 2 * 1024 * 1024,
  mimeTypes: ["image/jpeg", "image/png", "application/pdf"],
};
export type RfqStorage = Pick<Storage, "getItem" | "setItem">;
type State = { schemaVersion: 1; draft: RfqDraft | null; records: RfqRecord[] };
type Respond = <T>(fn: () => T, options?: RequestOptions) => Promise<T>;

function isDraft(value: unknown): value is RfqDraft {
  if (!value || typeof value !== "object") return false;
  const d = value as RfqDraft;
  return (
    d.schemaVersion === 1 &&
    typeof d.id === "string" &&
    typeof d.sourceKey === "string" &&
    Number.isInteger(d.revision) &&
    Number.isInteger(d.step) &&
    d.step >= 0 &&
    d.step <= 6 &&
    ["", "catalog", "custom"].includes(d.selection) &&
    (d.productId === null || typeof d.productId === "string") &&
    typeof d.variantId === "string" &&
    Number.isFinite(d.quantity) &&
    typeof d.acknowledged === "boolean" &&
    !!d.details &&
    (d.details.size === null || Number.isFinite(d.details.size)) &&
    [
      "finish",
      "requestedSize",
      "requestedFinish",
      "title",
      "recipient",
      "organization",
      "event",
      "message",
      "description",
    ].every(
      (k) => typeof d.details[k as keyof typeof d.details] === "string",
    ) &&
    !!d.contact &&
    ["name", "mobile", "email", "organization"].every(
      (k) => typeof d.contact[k as keyof typeof d.contact] === "string",
    ) &&
    !!d.delivery &&
    ["method", "recipient", "address", "city", "province", "notes"].every(
      (k) => typeof d.delivery[k as keyof typeof d.delivery] === "string",
    ) &&
    !!d.deadline &&
    typeof d.deadline.date === "string" &&
    typeof d.deadline.flexible === "boolean" &&
    typeof d.deadline.rush === "boolean" &&
    !!d.artwork &&
    typeof d.artwork.choice === "string" &&
    typeof d.artwork.idea === "string" &&
    Array.isArray(d.artwork.files) &&
    d.artwork.files.every(
      (f) =>
        f &&
        ["id", "name", "type", "data"].every(
          (k) => typeof f[k as keyof typeof f] === "string",
        ) &&
        Number.isFinite(f.size),
    )
  );
}
export function createRfqApi(
  respond: Respond,
  products: Product[],
  storage?: RfqStorage,
): RfqApi {
  function getStorage() {
    try {
      return storage ?? globalThis.localStorage;
    } catch {
      throw new ApiError(
        "UNAVAILABLE",
        "Browser storage is unavailable. Enable local storage to save this demo.",
      );
    }
  }
  function read(): State {
    try {
      const raw = getStorage()?.getItem(rfqStorageKey);
      if (!raw) return { schemaVersion: 1, draft: null, records: [] };
      const state = JSON.parse(raw) as State;
      if (
        state.schemaVersion !== 1 ||
        !Array.isArray(state.records) ||
        (state.draft !== null && !isDraft(state.draft)) ||
        !state.records.every(
          (r) =>
            r &&
            typeof r.id === "string" &&
            typeof r.reference === "string" &&
            isDraft(r.draft),
        )
      )
        throw new Error("Invalid storage");
      return state;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        "INVALID_REQUEST",
        "The saved demo data could not be read. Clear this site's browser storage to start again.",
      );
    }
  }
  function write(state: State) {
    try {
      const target = getStorage();
      if (!target) throw new Error("No browser storage");
      target.setItem(rfqStorageKey, JSON.stringify(state));
    } catch {
      throw new ApiError(
        "UNAVAILABLE",
        "Could not save locally. Browser storage may be full or disabled. Remove large files or free storage, then retry.",
      );
    }
  }
  function assertDraft(d: RfqDraft) {
    if (!isDraft(d))
      throw new ApiError(
        "INVALID_REQUEST",
        "The request has an invalid draft format.",
      );
  }
  function save(d: RfqDraft, state: State) {
    assertDraft(d);
    if (state.records.some((r) => r.id === d.id))
      throw new ApiError(
        "INVALID_REQUEST",
        "This demo was already submitted. Start a new request.",
      );
    if (
      state.draft &&
      (state.draft.id !== d.id || state.draft.revision !== d.revision)
    )
      throw new ApiError(
        "CONFLICT",
        "This draft changed in another tab. Reload to use the latest saved version.",
      );
    const next = {
      ...d,
      revision: d.revision + 1,
      updatedAt: new Date().toISOString(),
    };
    write({ ...state, draft: next });
    return next;
  }
  return {
    getPolicy: (options) => respond(() => rfqPolicy, options),
    openDraft: (entry: RfqEntry = {}, options) =>
      respond(() => {
        const state = read();
        const requested = entry.productId || entry.configuration?.productId;
        if (requested && !products.some((p) => p.id === requested))
          throw new ApiError(
            "NOT_FOUND",
            "That product is no longer available. Start a custom request or choose another product.",
          );
        const draft = state.draft ?? newRfqDraft(createId());
        const next = applyRfqEntry(draft, entry, products);
        if (!state.draft || next !== draft) return save(next, state);
        return draft;
      }, options),
    saveDraft: (draft, options) => respond(() => save(draft, read()), options),
    discardDraft: (options) =>
      respond(() => {
        const state = read();
        write({ ...state, draft: null });
      }, options),
    submit: (draft, options) =>
      respond(() => {
        assertDraft(draft);
        const state = read();
        // Draft identity is the idempotency key. Retries return the existing immutable receipt.
        const existing = state.records.find((r) => r.id === draft.id);
        if (existing) return existing;
        if (
          !state.draft ||
          state.draft.id !== draft.id ||
          state.draft.revision !== draft.revision
        )
          throw new ApiError(
            "CONFLICT",
            "Your draft changed. Reload before submitting.",
          );
        const errors = validateRfq(draft, products, rfqPolicy);
        if (Object.keys(errors).length)
          throw new ApiError(
            "VALIDATION_ERROR",
            "Check the highlighted fields.",
            errors,
          );
        const product = products.find((p) => p.id === draft.productId);
        const now = new Date();
        const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
        let reference: string;
        do {
          reference = `JP-RFQ-${stamp}-${createId().replaceAll("-", "").slice(0, 6).toUpperCase()}`;
        } while (state.records.some((r) => r.reference === reference));
        const submitted = structuredClone(draft);
        // Keep file metadata in receipts, not repeated large preview bytes. No upload exists.
        submitted.artwork.files = submitted.artwork.files.map((f) => ({
          ...f,
          data: "",
        }));
        if (submitted.delivery.method === "Pickup")
          submitted.delivery = {
            method: "Pickup",
            recipient: "",
            address: "",
            city: "",
            province: "",
            notes: "",
          };
        const record: RfqRecord = {
          id: draft.id,
          reference,
          status: "LOCAL_DEMO",
          createdAt: now.toISOString(),
          draft: submitted,
          productSnapshot: product ?? null,
          estimate: product
            ? estimatePrice(product, {
                size: draft.details.size ?? 0,
                finish: draft.details.finish,
                quantity: draft.quantity,
              })
            : null,
        };
        write({ ...state, draft: null, records: [...state.records, record] });
        return record;
      }, options),
    getRecord: (id, options) =>
      respond(() => {
        const record = read().records.find((r) => r.id === id);
        if (!record)
          throw new ApiError(
            "NOT_FOUND",
            "This local demo request was not found in this browser.",
          );
        return record;
      }, options),
  };
}
