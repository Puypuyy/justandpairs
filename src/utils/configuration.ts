import type { Configuration, Product } from "../api/index.ts";
export function initialConfiguration(product: Product): Configuration {
  return {
    productId: product.id,
    size: product.sizes[0] ?? 0,
    finish: product.finishes[0] ?? "",
    quantity: 1,
    title: "",
    recipient: "",
    organization: "",
    event: "",
    message: "",
    design: "help",
    idea: "",
    deadline: "",
    rush: false,
    delivery: "Pickup",
  };
}
export function validateConfiguration(
  c: Configuration,
  product: Product,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!product.sizes.includes(c.size))
    errors.size = "Choose a plaque size to continue.";
  if (!product.finishes.includes(c.finish))
    errors.finish = "Choose a finish to continue.";
  if (!Number.isInteger(c.quantity) || c.quantity < 1 || c.quantity > 9999)
    errors.quantity = "Enter a whole quantity from 1 to 9,999.";
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(c.deadline) ||
    !Number.isFinite(Date.parse(c.deadline)) ||
    c.deadline < localDate()
  )
    errors.deadline = "Choose today or a future date for your request.";
  if (c.design === "upload" && !c.file)
    errors.file = "Choose your design file, or select design assistance.";
  if (!["help", "upload"].includes(c.design))
    errors.file = "Choose a design option to continue.";
  if (!["Pickup", "Courier Delivery"].includes(c.delivery))
    errors.delivery = "Choose pickup or courier delivery.";
  return errors;
}
export function localDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function readConfiguration(product: Product): Configuration {
  try {
    const raw = JSON.parse(
      sessionStorage.getItem(`jp-config-${product.id}`) || "null",
    );
    const initial = initialConfiguration(product);
    if (raw?.productId !== product.id) return initial;
    const config = { ...initial, ...raw } as Configuration;
    if (!product.sizes.includes(config.size)) config.size = initial.size;
    if (!product.finishes.includes(config.finish))
      config.finish = initial.finish;
    if (!["help", "upload"].includes(config.design))
      config.design = initial.design;
    if (!["Pickup", "Courier Delivery"].includes(config.delivery))
      config.delivery = initial.delivery;
    return config;
  } catch {
    return initialConfiguration(product);
  }
}
export function saveConfiguration(c: Configuration) {
  sessionStorage.setItem(`jp-config-${c.productId}`, JSON.stringify(c));
  sessionStorage.setItem("jp-last-product", c.productId);
}
