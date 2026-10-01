import type { Configuration, Product } from "../types.ts";
export const pricingExamples = {
  sizeAdjustments: {
    6: 0,
    7: 250,
    8: 500,
    9: 800,
    10: 1100,
    11: 1450,
    12: 1800,
  } as Record<number, number>,
  finishAdjustments: {
    "Full-Color Print": 0,
    Etched: 350,
    "Colored Etching": 650,
  } as Record<string, number>,
  depositRate: 0.5,
};
export function estimatePrice(
  product: Product,
  config: Pick<Configuration, "size" | "finish" | "quantity">,
) {
  if (
    product.type !== "configurable" ||
    product.basePrice == null ||
    !product.sizes.includes(config.size) ||
    !product.finishes.includes(config.finish) ||
    !Number.isInteger(config.quantity) ||
    config.quantity < 1 ||
    config.quantity > 9999
  )
    return null;
  const baseUnit =
    product.basePrice +
    pricingExamples.sizeAdjustments[config.size] +
    pricingExamples.finishAdjustments[config.finish];
  if (product.minimumQuantity && config.quantity < product.minimumQuantity)
    return null;
  if (product.autoQuoteMax && config.quantity >= product.autoQuoteMax)
    return null;
  const tiers = [...(product.quantityTiers || [])].sort((a, b) => a.min - b.min);
  const tier = tiers.filter((item) => item.min <= config.quantity).at(-1);
  if (tier?.mode === "custom") return null;
  const unit = !tier
    ? baseUnit
    : tier.mode === "fixed"
      ? tier.value ?? baseUnit
      : tier.mode === "percent"
        ? baseUnit * (1 - (tier.value ?? 0) / 100)
        : Math.max(0, baseUnit - (tier.value ?? 0));
  const total = unit * config.quantity;
  if (!Number.isFinite(total)) return null;
  if (!tiers.length)
    return { unit, total, deposit: total * pricingExamples.depositRate };
  const next = tiers.find((item) => item.min > config.quantity && item.mode !== "custom");
  const nextUnit = next
    ? next.mode === "fixed"
      ? next.value ?? baseUnit
      : next.mode === "percent"
        ? baseUnit * (1 - (next.value ?? 0) / 100)
        : Math.max(0, baseUnit - (next.value ?? 0))
    : null;
  return {
    unit,
    total,
    deposit: total * pricingExamples.depositRate,
    baseUnit,
    savings: Math.max(0, (baseUnit - unit) * config.quantity),
    nextTier:
      next && nextUnit != null
        ? {
            quantity: next.min,
            unit: nextUnit,
            addedCost: next.min * nextUnit - total,
          }
        : undefined,
  };
}
