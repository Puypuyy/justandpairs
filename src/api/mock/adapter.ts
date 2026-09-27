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
    rfq: createRfqApi(respond, products, storage),
    getSiteData: (options) =>
      respond<SiteData>(
        () => ({ ...data, products, faq, pageContent }),
        options,
      ),
    listProducts: (filters = {}, options) =>
      respond(() => filterProducts(products, filters), options),
    getProduct: (slug, options) =>
      respond(() => {
        const product = products.find((p) => p.slug === slug);
        if (!product)
          throw new ApiError("NOT_FOUND", "This product could not be found.");
        return product;
      }, options),
    estimatePrice: (input, options) =>
      respond(() => {
        const product = products.find((p) => p.id === input.productId);
        if (!product)
          throw new ApiError("NOT_FOUND", "This product could not be found.");
        // Incomplete/unsupported configurations have no estimate; they are not network failures.
        return estimatePrice(product, input);
      }, options),
  };
}
