import type { Product } from "../types/catalog";
export const awardImage = "/images/awards-studio.png";
export const merchImage = "/images/merchandise-studio.png";
export const categories = [
  {
    slug: "plaques",
    name: "Plaques",
    description: "Recognition with a personal touch.",
    image: awardImage,
  },
  {
    slug: "glass-awards",
    name: "Glass Awards",
    description: "A clear statement of achievement.",
    image: awardImage,
  },
  {
    slug: "trophies-medals",
    name: "Trophies & Medals",
    description: "For every well-earned victory.",
    image: merchImage,
  },
  {
    slug: "shirts",
    name: "Shirts",
    description: "Bring your team identity to life.",
    image: merchImage,
  },
  {
    slug: "stickers-accessories",
    name: "Stickers & Accessories",
    description: "Small details. Lasting impressions.",
    image: merchImage,
  },
  {
    slug: "giveaways-merchandise",
    name: "Giveaways & Merchandise",
    description: "Thoughtful pieces made to be kept.",
    image: merchImage,
  },
];
export const occasions = [
  {
    slug: "corporate-recognition",
    name: "Corporate Recognition",
    description: "Celebrate people and company milestones.",
    image: awardImage,
    position: "30% center",
  },
  {
    slug: "schools-graduation",
    name: "Schools & Graduation",
    description: "Honor hard work and new beginnings.",
    image: awardImage,
    position: "85% center",
  },
  {
    slug: "sports-competitions",
    name: "Sports & Competitions",
    description: "Make every victory a lasting memory.",
    image: merchImage,
    position: "80% center",
  },
  {
    slug: "events-celebrations",
    name: "Events & Celebrations",
    description: "Made for your moments that matter.",
    image: awardImage,
    position: "60% center",
  },
  {
    slug: "teams-organizations",
    name: "Teams & Organizations",
    description: "Bring your people together.",
    image: merchImage,
    position: "15% center",
  },
  {
    slug: "appreciation-gifts",
    name: "Appreciation & Gifts",
    description: "A thoughtful way to say thank you.",
    image: merchImage,
    position: "65% center",
  },
];
export const sizes = [6, 7, 8, 9, 10, 11, 12];
export const sizeGuidance: Record<number, string> = {
  6: "Compact recognition piece.",
  7: "Small awards and appreciation pieces.",
  8: "Versatile standard recognition size.",
  9: "More visual presence for ceremonies.",
  10: "Suitable for larger corporate and event awards.",
  11: "Premium presentation size.",
  12: "Large-format recognition piece for stage presentation and major awards.",
};
export const finishes = [
  {
    name: "Full-Color Print",
    description: "For colorful logos, artwork and detailed graphics.",
  },
  { name: "Etched", description: "A refined engraved-style finish." },
  {
    name: "Colored Etching",
    description: "Etched details with selected color accents.",
  },
];
const all = occasions.map((o) => o.slug);
const seed = (
  id: string,
  name: string,
  category: string,
  basePrice: number | undefined,
  style: string,
  featured = false,
): Product => ({
  id,
  sku: `JP-${id.toUpperCase()}`,
  slug: name.toLowerCase().replaceAll(" ", "-"),
  name,
  category,
  basePrice,
  style,
  featured,
  type:
    category === "plaques" || category === "glass-awards"
      ? "configurable"
      : "bespoke",
  description:
    category === "plaques" || category === "glass-awards"
      ? "A premium glass recognition piece designed for corporate awards, graduation, competitions and meaningful milestones. Personalize it with your logo, recipient details and message."
      : "Create a personal piece for your team, event or celebration. Share your preferred details when quote requests become available.",
  shortDescription:
    category === "plaques"
      ? "Clear glass. Thoughtfully personalized."
      : categories.find((c) => c.slug === category)!.description,
  image:
    category === "plaques" || category === "glass-awards"
      ? awardImage
      : merchImage,
  sizes: category === "plaques" || category === "glass-awards" ? sizes : [],
  finishes:
    category === "plaques" || category === "glass-awards"
      ? finishes.map((f) => f.name)
      : [],
  occasionTags:
    category === "trophies-medals"
      ? ["schools-graduation", "sports-competitions", "teams-organizations"]
      : category === "shirts"
        ? [
            "schools-graduation",
            "sports-competitions",
            "events-celebrations",
            "teams-organizations",
          ]
        : category === "giveaways-merchandise"
          ? [
              "corporate-recognition",
              "events-celebrations",
              "teams-organizations",
              "appreciation-gifts",
            ]
          : all,
  badge: "Customizable",
});
export const products: Product[] = [
  seed(
    "double",
    "Double Glass Recognition Plaque",
    "plaques",
    1800,
    "Double Glass",
    true,
  ),
  seed(
    "single",
    "Single Glass Recognition Plaque",
    "plaques",
    1200,
    "Single Glass",
    true,
  ),
  seed(
    "etched",
    "Premium Etched Glass Award",
    "glass-awards",
    2400,
    "With Base",
    true,
  ),
  seed(
    "standing",
    "Standing Glass Recognition Award",
    "glass-awards",
    2100,
    "Standing Plaque",
    true,
  ),
  seed(
    "medal",
    "Custom Recognition Medal",
    "trophies-medals",
    undefined,
    "Custom Shape",
  ),
  seed("shirt", "Custom Team Shirt", "shirts", undefined, "Custom Shape"),
  seed(
    "keychain",
    "Personalized Keychain",
    "stickers-accessories",
    undefined,
    "Custom Shape",
  ),
  seed(
    "merch",
    "Corporate Merchandise Set",
    "giveaways-merchandise",
    undefined,
    "Custom Shape",
  ),
];
export const portfolio = [
  { name: "Corporate Recognition", type: "Awards", image: awardImage },
  { name: "Graduation Awards", type: "School", image: awardImage },
  { name: "Sports Tournament", type: "Sports", image: merchImage },
  { name: "Company Anniversary", type: "Events", image: awardImage },
  { name: "Custom Merchandise", type: "Merchandise", image: merchImage },
];
export const steps = [
  {
    title: "Tell us what you need",
    text: "Choose a product or tell us about your event.",
  },
  {
    title: "Receive your quote",
    text: "We confirm the details, quantity and pricing.",
  },
  {
    title: "Approve your design",
    text: "See your design before production begins.",
  },
  { title: "We make it", text: "Carefully made and quality checked." },
  {
    title: "Ready for your event",
    text: "Pick it up or arrange your preferred courier.",
  },
];
