import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { categories } from "../data/catalog";
type Context = {
  registerTool: (
    tool: {
      name: string;
      description: string;
      inputSchema: object;
      annotations: object;
      execute: (input: unknown) => Promise<object>;
    },
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};
export function useCatalogTool() {
  const navigate = useNavigate();
  useEffect(() => {
    const context = (document as Document & { modelContext?: Context })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      Promise.resolve(
        context.registerTool(
          {
            name: "browse_product_catalog",
            description:
              "Navigate to the product catalog with an optional search and category. Does not submit a quote or create an order.",
            inputSchema: {
              type: "object",
              properties: {
                query: { type: "string" },
                category: {
                  type: "string",
                  enum: categories.map((c) => c.slug),
                },
              },
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            async execute(input) {
              if (!input || typeof input !== "object" || Array.isArray(input))
                throw new Error("Expected catalog filters.");
              const data = input as Record<string, unknown>;
              if (
                Object.keys(data).some(
                  (k) => !["query", "category"].includes(k),
                ) ||
                (data.query !== undefined && typeof data.query !== "string") ||
                (data.category !== undefined &&
                  !categories.some((c) => c.slug === data.category))
              )
                throw new Error("Choose a valid category and text search.");
              const params = new URLSearchParams();
              if (data.query) params.set("q", String(data.query));
              if (data.category) params.set("category", String(data.category));
              const url = `/products?${params}`;
              navigate(url);
              await new Promise<void>((resolve) =>
                requestAnimationFrame(() =>
                  requestAnimationFrame(() => resolve()),
                ),
              );
              return { url, status: "catalog_opened" };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {
      /* Optional browser capability. */
    }
    return () => lifecycle.abort();
  }, [navigate]);
}
