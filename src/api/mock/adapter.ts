import type { CustomerApi, RequestOptions, SiteData } from "../contracts.ts";
import { ApiError } from "../errors.ts";
import * as data from "./data.ts";
import { faq, pageContent } from "./content.ts";
import { filterProducts } from "./filtering.ts";
import { estimatePrice } from "./pricing.ts";
import type { Product } from "../types.ts";
import { createRfqApi, type RfqStorage } from "./rfq.ts";

export function createMockApi({
  latencyMs = 120,
  products = data.products,
  storage,
}: {
  latencyMs?: number;
  products?: Product[];
  storage?: RfqStorage;
} = {}): CustomerApi {
  let runtimeProducts = products;
  let runtimeHomeContent = data.homeContent;
  let runtimeBusinessSettings = data.businessSettings;
  let runtimePortfolio = data.portfolio;
  if (products === data.products && typeof localStorage !== "undefined") {
    try {
      const admin = JSON.parse(localStorage.getItem("jp_admin_poc_v1") || "{}");
      if (Array.isArray(admin.products)) runtimeProducts = admin.products;
      if (admin.content && typeof admin.content.heroTitle === "string")
        runtimeHomeContent = { ...data.homeContent, ...admin.content };
      if (admin.content?.featuredProjectName && admin.content?.featuredProjectImage)
        runtimePortfolio = [{ name: admin.content.featuredProjectName, type: admin.content.featuredProjectType || "Approved work", image: admin.content.featuredProjectImage }, ...data.portfolio];
      if (admin.settings && typeof admin.settings.businessName === "string")
        runtimeBusinessSettings = { ...data.businessSettings, ...admin.settings };
    } catch {
      // Invalid POC overrides never prevent the customer site from loading.
    }
  }
  async function respond<T>(
    read: () => T,
    { signal }: RequestOptions = {},
  ): Promise<T> {
    signal?.throwIfAborted();
    await new Promise<void>((resolve, reject) => {
      const abort = () => {
        clearTimeout(timer);
        reject(
          signal?.reason ?? new DOMException("Request aborted", "AbortError"),
        );
      };
      const timer = setTimeout(() => {
        signal?.removeEventListener("abort", abort);
        resolve();
      }, latencyMs);
      signal?.addEventListener("abort", abort, { once: true });
    });
    signal?.throwIfAborted();
    // Every response is independent, as if it arrived from a JSON endpoint.
    return structuredClone(read());
  }
  return {
    rfq: createRfqApi(respond, runtimeProducts, storage),
    getSiteData: (options) =>
      respond<SiteData>(
        () => ({ ...data, products: runtimeProducts, portfolio: runtimePortfolio, homeContent: runtimeHomeContent, businessSettings: runtimeBusinessSettings, faq, pageContent }),
        options,
      ),
    listProducts: (filters = {}, options) =>
      respond(() => filterProducts(runtimeProducts, filters), options),
    getProduct: (slug, options) =>
      respond(() => {
        const product = runtimeProducts.find((p) => p.slug === slug);
        if (!product)
          throw new ApiError("NOT_FOUND", "This product could not be found.");
        return product;
      }, options),
    estimatePrice: (input, options) =>
      respond(() => {
        const product = runtimeProducts.find((p) => p.id === input.productId);
        if (!product)
          throw new ApiError("NOT_FOUND", "This product could not be found.");
        // Incomplete/unsupported configurations have no estimate; they are not network failures.
        return estimatePrice(product, input);
      }, options),
  };
}
