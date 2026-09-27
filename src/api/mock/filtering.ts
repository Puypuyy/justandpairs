import type { Product, ProductFilters as Filters } from "../contracts.ts";
export function filterProducts(products: Product[], f: Filters) {
  const result = products.filter(
    (p) =>
      (!f.category || p.category === f.category) &&
      (!f.awards ||
        ["plaques", "glass-awards", "trophies-medals"].includes(p.category)) &&
      (!f.occasion || p.occasionTags.includes(f.occasion)) &&
      (!f.size || p.sizes.includes(Number(f.size))) &&
      (!f.style || p.style === f.style) &&
      (!f.finish || p.finishes.includes(f.finish)) &&
      (!f.query ||
        `${p.name} ${p.description} ${p.category}`
          .toLowerCase()
          .includes(f.query.toLowerCase())),
  );
  return result.sort((a, b) =>
    f.sort === "price-low"
      ? (a.basePrice ?? Infinity) - (b.basePrice ?? Infinity)
      : f.sort === "price-high"
        ? (b.basePrice ?? -1) - (a.basePrice ?? -1)
        : f.sort === "name"
          ? a.name.localeCompare(b.name)
          : Number(!!b.featured) - Number(!!a.featured),
  );
}
