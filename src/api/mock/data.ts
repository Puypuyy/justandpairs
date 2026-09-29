// Assembly only. Edit the clearly named files inside ./data/.
export { categories, families } from "./data/categories.ts";
export { occasions } from "./data/occasions.ts";
export { sizes, sizeGuidance, finishes, styles } from "./data/options.ts";
export { awardImage, merchImage, portfolio, steps } from "./data/site.ts";
import { suppliedProducts } from "./data/products.ts";
// Active customer catalog. Demo products stay disabled in demo-products.ts.
export const products = [...suppliedProducts];
