import type { Configuration, Product } from "./types.ts";
export type { Configuration, Product } from "./types.ts";

export type Category = {
  slug: string;
  name: string;
  description: string;
  image: string;
};
export type Occasion = Category & { position: string };
export type Finish = { name: string; description: string };
export type PortfolioItem = { name: string; type: string; image: string };
export type SiteData = {
  products: Product[];
  categories: Category[];
  occasions: Occasion[];
  sizes: number[];
  finishes: Finish[];
  styles: string[];
  sizeGuidance: Record<number, string>;
  portfolio: PortfolioItem[];
  steps: { title: string; text: string }[];
  faq: [string, string][];
  pageContent: Record<string, [string, string]>;
  awardImage: string;
  merchImage: string;
};
export type ProductFilters = {
  category?: string;
  occasion?: string;
  size?: string;
  style?: string;
  finish?: string;
  query?: string;
  sort?: string;
  awards?: boolean;
};
export type EstimateRequest = Pick<
  Configuration,
  "productId" | "size" | "finish" | "quantity"
>;
export type PriceEstimate = { unit: number; total: number; deposit: number };
export type RequestOptions = { signal?: AbortSignal };

// Implement this interface in an AWS adapter when the backend contract is ready.
export interface CustomerApi {
  getSiteData(options?: RequestOptions): Promise<SiteData>;
  listProducts(
    filters?: ProductFilters,
    options?: RequestOptions,
  ): Promise<Product[]>;
  getProduct(slug: string, options?: RequestOptions): Promise<Product>;
  estimatePrice(
    input: EstimateRequest,
    options?: RequestOptions,
  ): Promise<PriceEstimate | null>;
}
