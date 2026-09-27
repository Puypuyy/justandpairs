import type { Product } from "./types.ts";

export function formatSize(width: number, height = width): string {
  return `${width} × ${height} in`;
}

// Internal configuration reference. Only known supported options receive a SKU.
export function configurationSku(
  product: Product,
  size: number,
  finish: string,
): string | null {
  const finishCodes: Record<string, string> = {
    "Full-Color Print": "FP",
    Etched: "ET",
    "Colored Etching": "CE",
    Combination: "COM",
  };
  if (
    !product.sizes.includes(size) ||
    !product.finishes.includes(finish) ||
    !finishCodes[finish]
  )
    return null;
  const dimension = String(size).padStart(2, "0");
  return `${product.sku}-${dimension}${dimension}-${finishCodes[finish]}`;
}
