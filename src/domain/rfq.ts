import type { Product, RfqDraft, RfqEntry, RfqPolicy } from "../api/index.ts";

export const rfqSteps = [
  "Product",
  "Specifications",
  "Quantity",
  "Artwork",
  "Deadline",
  "Delivery & Contact",
  "Review",
];
export const emptyDetails = () => ({
  size: null as number | null,
  finish: "",
  requestedSize: "",
  requestedFinish: "",
  title: "",
  recipient: "",
  organization: "",
  event: "",
  message: "",
  description: "",
});
export function newRfqDraft(id: string): RfqDraft {
  return {
    schemaVersion: 1,
    id,
    sourceKey: "",
    revision: 0,
    updatedAt: "",
    step: 0,
    selection: "",
    productId: null,
    variantId: "",
    details: emptyDetails(),
    quantity: 1,
    artwork: { choice: "help", idea: "", files: [] },
    deadline: { date: "", flexible: false, rush: false },
    delivery: {
      method: "Pickup",
      recipient: "",
      address: "",
      city: "",
      province: "",
      notes: "",
    },
    contact: { name: "", mobile: "", email: "", organization: "" },
    acknowledged: false,
  };
}
export function selectRfqProduct(draft: RfqDraft, product?: Product): RfqDraft {
  if (
    (product && draft.productId === product.id) ||
    (!product && draft.selection === "custom")
  )
    return draft;
  return {
    ...draft,
    selection: product ? "catalog" : "custom",
    productId: product?.id ?? null,
    variantId: product?.variants?.[0]?.id ?? "",
    details: {
      ...emptyDetails(),
      title: draft.details.title,
      recipient: draft.details.recipient,
      organization: draft.details.organization,
      event: draft.details.event,
      message: draft.details.message,
      size: product?.sizes[0] ?? null,
      finish: product?.finishes[0] ?? "",
    },
    acknowledged: false,
  };
}
export function applyRfqEntry(
  draft: RfqDraft,
  entry: RfqEntry,
  products: Product[],
): RfqDraft {
  if (!entry.sourceKey || entry.sourceKey === draft.sourceKey) return draft;
  const product = products.find(
    (p) => p.id === (entry.productId || entry.configuration?.productId),
  );
  // Refresh and URL reopen must not wipe an in-progress draft when the URL only
  // restates the same product/mode and no new router-state configuration arrived.
  if (!entry.configuration) {
    const sameCustom = entry.mode === "custom" && draft.selection === "custom";
    const sameBulk = entry.mode === "bulk" && !!draft.sourceKey;
    const sameProduct =
      !!product &&
      draft.productId === product.id &&
      (!entry.variantId || entry.variantId === draft.variantId);
    if (sameCustom || sameBulk || sameProduct)
      return { ...draft, sourceKey: entry.sourceKey };
  }
  let next = { ...draft, sourceKey: entry.sourceKey, acknowledged: false };
  if (entry.mode === "custom") next = selectRfqProduct(next);
  else if (product) {
    next = selectRfqProduct(next, product);
    next.step = 1;
    if (product.variants?.some((v) => v.id === entry.variantId))
      next.variantId = entry.variantId!;
    const c = entry.configuration;
    if (c?.productId === product.id) {
      next.details = {
        ...next.details,
        size: product.sizes.includes(c.size) ? c.size : next.details.size,
        finish: product.finishes.includes(c.finish)
          ? c.finish
          : next.details.finish,
        title: c.title,
        recipient: c.recipient,
        organization: c.organization,
        event: c.event,
        message: c.message,
      };
      next.quantity = c.quantity;
      next.artwork = {
        choice: c.design === "upload" ? "design" : "help",
        idea: c.idea,
        files: c.file ? [{ ...c.file, id: `handoff-${draft.id}` }] : [],
      };
      next.deadline = { date: c.deadline, flexible: false, rush: c.rush };
      next.delivery = { ...next.delivery, method: c.delivery };
      next.contact = {
        ...next.contact,
        organization: next.contact.organization || c.organization,
      };
    }
  }
  return next;
}
export function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function validateRfq(
  d: RfqDraft,
  products: Product[],
  policy: RfqPolicy,
  step?: number,
  today = todayLocal(),
): Record<string, string> {
  const errors: Record<string, string> = {};
  const at = (n: number) => step === undefined || step === n;
  const product = products.find((p) => p.id === d.productId);
  if (at(0)) {
    if (!d.selection || (d.selection === "catalog" && !product))
      errors.productId = "Choose an available product or Something Custom.";
    if (
      product?.variants?.length &&
      !product.variants.some((v) => v.id === d.variantId)
    )
      errors.variantId = "Choose a design option.";
  }
  if (at(1)) {
    if (product?.sizes.length && !product.sizes.includes(d.details.size!))
      errors.size = "Choose an available size.";
    if (
      product?.finishes.length &&
      !product.finishes.includes(d.details.finish)
    )
      errors.finish = "Choose an available finish.";
    if (d.selection === "custom" && !d.details.description.trim())
      errors.description = "Tell us what you would like made.";
    for (const [key, value] of Object.entries(d.details))
      if (typeof value === "string" && value.length > 2000)
        errors[key] = "Use 2,000 characters or fewer.";
  }
  if (
    at(2) &&
    (!Number.isInteger(d.quantity) || d.quantity < 1 || d.quantity > 9999)
  )
    errors.quantity = "Enter a whole quantity from 1 to 9,999.";
  if (at(3)) {
    if (!["help", "design", "reference"].includes(d.artwork.choice))
      errors.artwork = "Choose how you would like to prepare your design.";
    if (d.artwork.choice === "design" && !d.artwork.files.length)
      errors.files = "Choose a local design file or select design assistance.";
    if (
      d.artwork.choice === "reference" &&
      !d.artwork.files.length &&
      !d.artwork.idea.trim()
    )
      errors.idea = "Describe your idea or select a reference file.";
    if (d.artwork.idea.length > 2000)
      errors.idea = "Use 2,000 characters or fewer.";
    if (
      d.artwork.files.length > policy.maxFiles ||
      d.artwork.files.reduce((sum, f) => sum + f.size, 0) > policy.maxTotalBytes
    )
      errors.files = "The selected files exceed the local preview limit.";
    for (const f of d.artwork.files)
      if (
        !policy.mimeTypes.includes(f.type) ||
        f.size <= 0 ||
        f.size > policy.maxFileBytes ||
        !f.data.startsWith(`data:${f.type};base64,`) ||
        f.data.length > policy.maxFileBytes * 1.4 + 100
      )
        errors.files =
          "Select valid JPG, PNG or PDF files within the preview limit.";
  }
  if (at(4) && !d.deadline.flexible) {
    const date = d.deadline.date;
    const parsed = new Date(`${date}T12:00:00Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== date ||
      date < today
    )
      errors.date = "Choose today or a future date, or select a flexible date.";
  }
  if (at(5)) {
    if (!d.contact.name.trim()) errors.name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.contact.email.trim()))
      errors.email = "Enter a valid email address.";
    if (
      !/^[+\d\s()\-]+$/.test(d.contact.mobile) ||
      d.contact.mobile.replace(/\D/g, "").length < 7 ||
      d.contact.mobile.replace(/\D/g, "").length > 15
    )
      errors.mobile = "Enter a valid mobile number.";
    if (!["Pickup", "Courier Delivery"].includes(d.delivery.method))
      errors.delivery = "Choose pickup or courier delivery.";
    if (d.delivery.method === "Courier Delivery")
      for (const key of ["recipient", "address", "city", "province"] as const)
        if (!d.delivery[key].trim())
          errors[`delivery.${key}`] = `Enter the delivery ${key}.`;
    for (const [key, value] of Object.entries(d.contact))
      if (value.length > 250) errors[key] = "Use 250 characters or fewer.";
    for (const [key, value] of Object.entries(d.delivery))
      if (value.length > 1000)
        errors[`delivery.${key}`] = "Use 1,000 characters or fewer.";
  }
  if (at(6) && !d.acknowledged)
    errors.acknowledged =
      "Confirm the local demo acknowledgment before continuing.";
  return errors;
}
export function firstInvalidRfqStep(
  d: RfqDraft,
  products: Product[],
  policy: RfqPolicy,
): number {
  for (let i = 0; i < 7; i++)
    if (Object.keys(validateRfq(d, products, policy, i)).length) return i;
  return 6;
}
export function nextRfqStep(
  d: RfqDraft,
  products: Product[],
  policy: RfqPolicy,
): number {
  return Object.keys(validateRfq(d, products, policy, d.step)).length
    ? d.step
    : Math.min(6, d.step + 1);
}
