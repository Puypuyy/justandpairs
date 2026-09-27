import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  Alert,
  Button,
  Drawer,
  IconButton,
  MenuItem,
  TextField,
} from "@mui/material";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useProducts, useSiteData } from "../api/react";
import { Breadcrumb, ProductCard } from "../components/common";
export default function Catalog({ awards = false }: { awards?: boolean }) {
  const { categories, occasions, finishes, sizes, styles } = useSiteData();
  const { category, occasion } = useParams();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const activeCategory = categories.find((c) => c.slug === category);
  const activeOccasion = occasions.find((o) => o.slug === occasion);
  const title =
    activeOccasion?.name ||
    activeCategory?.name ||
    (awards ? "Awards & Plaques" : "Made for your moment.");
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };
  const values = {
    category: category || params.get("category") || "",
    occasion: occasion || params.get("occasion") || "",
    size: params.get("size") || "",
    style: params.get("style") || "",
    finish: params.get("finish") || "",
    query: params.get("q") || "",
    sort: params.get("sort") || "featured",
    awards,
  };
  const results = useProducts(values);
  const found = results.data ?? [];
  const unknown =
    (category && !activeCategory) || (occasion && !activeOccasion);
  const canFilterPlaques =
    !values.category || ["plaques", "glass-awards"].includes(values.category);
  const filterFields = (
    <>
      <div className="row-between">
        <h3>Refine your selection</h3>
        <Button
          onClick={() => setParams(values.query ? { q: values.query } : {})}
        >
          Reset
        </Button>
      </div>
      {!category && (
        <TextField
          select
          label="Product category"
          value={values.category}
          onChange={(e) => {
            const next = new URLSearchParams(params);
            next.set("category", e.target.value);
            ["size", "style", "finish"].forEach((k) => next.delete(k));
            setParams(next);
          }}
        >
          <MenuItem value="">All products</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c.slug} value={c.slug}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>
      )}
      {!occasion && (
        <TextField
          select
          label="Occasion"
          value={values.occasion}
          onChange={(e) => update("occasion", e.target.value)}
        >
          <MenuItem value="">All occasions</MenuItem>
          {occasions.map((o) => (
            <MenuItem key={o.slug} value={o.slug}>
              {o.name}
            </MenuItem>
          ))}
        </TextField>
      )}
      {canFilterPlaques && (
        <>
          <TextField
            select
            label="Size (inches)"
            value={values.size}
            onChange={(e) => update("size", e.target.value)}
          >
            <MenuItem value="">All sizes</MenuItem>
            {sizes.map((s) => (
              <MenuItem key={s} value={s}>
                {s} × {s}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Style"
            value={values.style}
            onChange={(e) => update("style", e.target.value)}
          >
            <MenuItem value="">All styles</MenuItem>
            {styles.map((s) => (
              <MenuItem value={s} key={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Finish"
            value={values.finish}
            onChange={(e) => update("finish", e.target.value)}
          >
            <MenuItem value="">All finishes</MenuItem>
            {finishes.map((f) => (
              <MenuItem value={f.name} key={f.name}>
                {f.name}
              </MenuItem>
            ))}
          </TextField>
        </>
      )}
    </>
  );
  return (
    <div className="container catalog-page">
      <Breadcrumb
        current={activeCategory?.name || activeOccasion?.name || "All products"}
      />
      <div className="catalog-intro">
        <span className="eyebrow">THOUGHTFULLY MADE. PERSONALLY YOURS.</span>
        <h1>{unknown ? "Collection not found" : title}</h1>
        <p>
          {activeCategory?.description ||
            activeOccasion?.description ||
            "Explore custom awards, keepsakes and merchandise for people worth celebrating."}
        </p>
      </div>
      <div className="catalog-toolbar">
        <TextField
          label="Search products"
          value={values.query}
          onChange={(e) => update("q", e.target.value)}
          slotProps={{
            input: {
              startAdornment: <Search size={18} style={{ marginRight: 12 }} />,
            },
          }}
        />
        <Button
          className="filter-toggle"
          variant="outlined"
          startIcon={<SlidersHorizontal size={18} />}
          onClick={() => setOpen(true)}
        >
          Filters
        </Button>
        <TextField
          select
          label="Sort by"
          value={values.sort}
          onChange={(e) => update("sort", e.target.value)}
        >
          <MenuItem value="featured">Featured</MenuItem>
          <MenuItem value="price-low">Price: low to high</MenuItem>
          <MenuItem value="price-high">Price: high to low</MenuItem>
          <MenuItem value="name">Name: A–Z</MenuItem>
        </TextField>
      </div>
      <div className="catalog-layout">
        <aside className="catalog-filters">{filterFields}</aside>
        <div>
          <div className="catalog-count" role="status">
            {unknown ? 0 : found.length} products{" "}
            <span>Sample catalog · Estimated prices</span>
          </div>
          {results.loading ? (
            <p role="status">Loading products…</p>
          ) : results.error ? (
            <Alert
              severity="error"
              action={
                <Button color="inherit" onClick={results.retry}>
                  Try again
                </Button>
              }
            >
              We couldn't load these products.
            </Alert>
          ) : !unknown && found.length ? (
            <div className="catalog-products">
              {found.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Search size={32} />
              <h2>No matching pieces yet.</h2>
              <p>
                Try a different search or clear your filters to explore more
                possibilities.
              </p>
              <Button component={Link} to="/products" variant="contained">
                Explore all products
              </Button>
              <Button onClick={() => setParams({})}>Clear filters</Button>
            </div>
          )}
        </div>
      </div>
      <Drawer open={open} onClose={() => setOpen(false)} anchor="right">
        <div className="filter-drawer">
          <div className="row-between">
            <h2>Filters</h2>
            <IconButton
              onClick={() => setOpen(false)}
              aria-label="Close filters"
            >
              <X />
            </IconButton>
          </div>
          {filterFields}
          <Button variant="contained" onClick={() => setOpen(false)}>
            Show {found.length} products
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
