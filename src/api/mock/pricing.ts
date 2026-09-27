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
  const unit =
    product.basePrice +
    pricingExamples.sizeAdjustments[config.size] +
    pricingExamples.finishAdjustments[config.finish];
  const total = unit * config.quantity;
  if (!Number.isFinite(total)) return null;
  return { unit, total, deposit: total * pricingExamples.depositRate };
}
