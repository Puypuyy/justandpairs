import { Button } from "@mui/material";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Product } from "../api";
import { useSiteData } from "../api/react";
import { money } from "../utils/formatting";
export function Action({
  to,
  children,
  secondary = false,
}: {
  to: string;
  children: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <Button
      component={Link}
      to={to}
      variant={secondary ? "outlined" : "contained"}
      endIcon={<ArrowRight size={17} />}
    >
      {children}
    </Button>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  copy,
  to,
  link,
}: {
  eyebrow?: string;
  title: string;
  copy?: string;
  to?: string;
  link?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {copy && <p>{copy}</p>}
      </div>
      {to && (
        <Link className="text-link" to={to}>
          {link || "Explore collection"} <ArrowUpRight size={18} />
        </Link>
      )}
    </div>
  );
}
export function ProductCard({ product }: { product: Product }) {
  const { categories } = useSiteData();
  return (
    <article className="product-card">
      <Link className="product-image" to={`/products/${product.slug}`}>
        <img
          src={product.image}
          alt={`Illustrative ${product.name}`}
          loading="lazy"
        />
        {product.badge && <span className="badge">{product.badge}</span>}
        <span className="image-label">Concept image</span>
      </Link>
      <div className="product-copy">
        <span className="eyebrow">
          {categories.find((c) => c.slug === product.category)?.name}
        </span>
        <h3>
          <Link to={`/products/${product.slug}`}>{product.name}</Link>
        </h3>
        <p>{product.shortDescription}</p>
        <div className="product-bottom">
          <strong>
            {product.basePrice
              ? `From ${money(product.basePrice)}`
              : "Request pricing"}
          </strong>
          <Link
            aria-label={`View ${product.name}`}
            to={`/products/${product.slug}`}
          >
            View Details <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
export function Breadcrumb({
  current,
  parent = "Products",
  parentTo = "/products",
}: {
  current: string;
  parent?: string;
  parentTo?: string;
}) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <Link to="/">Home</Link>
      <span>/</span>
      <Link to={parentTo}>{parent}</Link>
      <span>/</span>
      <span aria-current="page">{current}</span>
    </nav>
  );
}
