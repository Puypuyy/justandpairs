// Assembly only. Edit the clearly named files inside ./data/.
export { categories, families } from "./data/categories.ts";
export { occasions } from "./data/occasions.ts";
export { sizes, sizeGuidance, finishes, styles } from "./data/options.ts";
export { awardImage, merchImage, portfolio, steps } from "./data/site.ts";
export const homeContent = {
  announcement: "Custom awards & merchandise made for your moment.",
  heroTitle: "Recognition made tangible.",
  heroText:
    "Custom plaques, awards and merchandise for achievements, events and moments worth remembering.",
  testimonialQuote: "",
  testimonialName: "",
  testimonialApproved: false,
  policySummary: "",
  featuredProjectName: "",
  featuredProjectType: "",
  featuredProjectImage: "",
};
export const businessSettings = {
  businessName: "Just and Pairs",
  email: "Not yet confirmed",
  phone: "Not yet confirmed",
  address: "Not yet confirmed",
  hours: "Not yet confirmed",
  verified: false,
};
import { suppliedProducts } from "./data/products.ts";
// Active customer catalog. Demo products stay disabled in demo-products.ts.
export const products = [...suppliedProducts];
