import { useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Chip,
} from "@mui/material";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import { Action, Breadcrumb, SectionHeading } from "../components/common";
import { portfolio, products, steps } from "../data/catalog";
import type { Configuration } from "../types/catalog";
import { readConfiguration } from "../utils/configuration";
import Estimate from "../components/Estimate";
export function RequestQuote() {
  const location = useLocation();
  const [params] = useSearchParams();
  let last: string | null = null;
  try {
    last = sessionStorage.getItem("jp-last-product");
  } catch {
    /* unavailable browser storage */
  }
  const chosen = products.find((p) => p.slug === params.get("product"));
  const fromState = location.state?.config as Configuration | undefined;
  const product =
    chosen || products.find((p) => p.id === (fromState?.productId || last));
  const config = fromState || (product && readConfiguration(product));
  const saved = !chosen && product && config;
  return (
    <div className="container quote-page">
      <Breadcrumb current="Request a Quote" />
      <div className="quote-layout">
        <div className="quote-copy">
          <span className="large-icon">
            <MessageSquare size={32} />
          </span>
          <span className="eyebrow">THE NEXT STEP IN YOUR MOMENT</span>
          <h1>
            {saved
              ? "Your ideas, ready for the next step."
              : "Something meaningful starts here."}
          </h1>
          <p>
            Quote requests are part of the next customer phase.{" "}
            {saved
              ? "Your selected product configuration has been saved for the next step."
              : "Explore the collection and configure a recognition piece while we prepare the next step."}
          </p>
          <Alert severity="info">
            No request has been sent. Quote submission and order processing are
            not available yet.
          </Alert>
          {saved && (
            <div className="saved-details">
              <h3>
                <CheckCircle2 size={19} /> Your choices are ready
              </h3>
              <dl>
                {[
                  ["Requested date", config.deadline || "Not chosen"],
                  ["Pickup or delivery", config.delivery],
                  [
                    "Your design",
                    config.design === "help"
                      ? "Design assistance requested"
                      : config.file?.name || "No file selected",
                  ],
                  ["Award title", config.title],
                  ["Recipient", config.recipient],
                  ["Organization", config.organization],
                  ["Event / Date", config.event],
                  ["Message", config.message],
                  ["Design idea", config.idea],
                  [
                    "Rush availability",
                    config.rush ? "Please check" : "Not requested",
                  ],
                ]
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
              </dl>
              <p className="fine-print">
                Choices stay in this browser session. Your design file has not
                been uploaded or shared.
              </p>
            </div>
          )}
          {chosen && (
            <div className="saved-details">
              <h3>{chosen.name}</h3>
              <p>
                This piece will be quoted to your requirements when requests
                become available.
              </p>
            </div>
          )}
          <div className="button-row">
            {product && (
              <Action to={`/products/${product.slug}`}>
                Return to your product
              </Action>
            )}
            <Action to="/products" secondary>
              Keep exploring
            </Action>
          </div>
        </div>
        {saved && product.type === "configurable" ? (
          <Estimate product={product} config={config} />
        ) : (
          <div className="quote-image">
            <img
              src={product?.image || products[0].image}
              alt="Illustrative recognition product concept"
            />
            <span>Made for your moment.</span>
          </div>
        )}
      </div>
    </div>
  );
}
export function OurWork() {
  const [filter, setFilter] = useState("All");
  return (
    <div className="container section">
      <span className="eyebrow">A LITTLE INSPIRATION</span>
      <h1>Made for moments like these.</h1>
      <p>Explore the possibilities for your next event, milestone or team.</p>
      <Alert severity="info">
        This is a concept showcase. These illustrations are not completed
        customer projects. Real work will be featured here with permission.
      </Alert>
      <div className="portfolio-filters">
        {["All", "Awards", "School", "Sports", "Events", "Merchandise"].map(
          (f) => (
            <Chip
              key={f}
              label={f}
              onClick={() => setFilter(f)}
              color={f === filter ? "primary" : "default"}
              variant={f === filter ? "filled" : "outlined"}
            />
          ),
        )}
      </div>
      <div className="portfolio-full">
        {portfolio
          .filter((p) => filter === "All" || p.type === filter)
          .map((p) => (
            <article key={p.name}>
              <img src={p.image} alt={`${p.name} illustrative concept`} />
              <span className="eyebrow">CONCEPT SHOWCASE</span>
              <h2>{p.name}</h2>
              <p>A starting point for something that's distinctly yours.</p>
              <Action to="/request-quote" secondary>
                Start a similar project
              </Action>
            </article>
          ))}
      </div>
    </div>
  );
}
const faq = [
  [
    "How to Order",
    "Browse a product, choose your size and finish, and personalize it. The Request Quote button saves your selections locally. Sending quote requests will be available in the next customer phase.",
  ],
  [
    "Payments",
    "An estimated 50% deposit is shown to help you plan. Payment will only be requested after quotation approval in a future phase. This preview does not collect payments.",
  ],
  [
    "Design Approval",
    "You will review your design before production. Design approval and revision tools are coming in a later phase.",
  ],
  [
    "Pickup & Delivery",
    "Choose pickup or courier delivery in your product configuration. Courier fees are shouldered by the customer. Arrangements and timing will be confirmed with your quotation.",
  ],
  [
    "FAQs",
    "Prices in this preview are illustrative estimates. Final pricing, production time, materials and availability are confirmed after your requirements are reviewed.",
  ],
  [
    "Files & Artwork",
    "Select a JPG, PNG or PDF up to 2 MB for this local preview. The file stays in your browser session and is never submitted to a server.",
  ],
  [
    "Contact",
    "Direct contact details will be added before quote requests open. In the meantime, browse the collection and save your product choices.",
  ],
];
export function Help() {
  return (
    <div className="container help-page section">
      <span className="eyebrow">A LITTLE GUIDANCE GOES A LONG WAY</span>
      <h1>How can we help?</h1>
      <p>Everything you need to take the next step with confidence.</p>
      <div className="help-layout">
        <aside>
          <h3>Customer care</h3>
          {faq.map(([title]) => (
            <a
              key={title}
              href={`#${title.toLowerCase().replaceAll(" ", "-")}`}
            >
              {title}
              <ArrowRight size={14} />
            </a>
          ))}
        </aside>
        <div>
          {faq.map(([title, text]) => (
            <Accordion
              id={title.toLowerCase().replaceAll(" ", "-")}
              key={title}
              defaultExpanded={title === "How to Order"}
              disableGutters
              elevation={0}
            >
              <AccordionSummary expandIcon={<ChevronDown size={18} />}>
                <h3>{title}</h3>
              </AccordionSummary>
              <AccordionDetails>
                <p>{text}</p>
              </AccordionDetails>
            </Accordion>
          ))}
        </div>
      </div>
      <section className="section">
        <SectionHeading title="From idea to finished piece." />
        <div className="steps">
          {steps.map((s, i) => (
            <div key={s.title}>
              <span className="step-number">0{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
const pageContent: Record<string, [string, string]> = {
  "/account": [
    "Your account, coming later.",
    "Customer accounts are planned for a later phase. You can explore products and save a configuration in this browser session without signing in.",
  ],
  "/track-order": [
    "Order tracking is on its way.",
    "Tracking will be connected when ordering becomes available. No live orders are processed through this preview.",
  ],
  "/about": [
    "Ideas made tangible.",
    "Just and Pairs creates custom awards, recognition pieces and merchandise for achievements, events and moments worth remembering.",
  ],
  "/contact": [
    "Let’s make something meaningful.",
    "Contact information will be available before quote requests open. For now, explore our products and keep your choices ready.",
  ],
  "/terms": [
    "Terms, coming before ordering.",
    "The customer terms will be published before quote submission and ordering open. Browsing and local configuration are available now.",
  ],
  "/privacy": [
    "Your privacy in this preview.",
    "Your configuration and any selected design file stay in this browser session. No account, payment or quote submission is collected. Closing the tab clears session data. Fonts are loaded from Google Fonts.",
  ],
};
export function InfoPage() {
  const location = useLocation();
  const content = pageContent[location.pathname];
  return (
    <section className="container info-page">
      <span className="eyebrow">JUST AND PAIRS</span>
      <h1>{content?.[0] || "This page isn’t in the collection."}</h1>
      <p>
        {content?.[1] ||
          "Let’s help you find a piece for your next meaningful moment."}
      </p>
      <Action to="/products">Browse Products</Action>
      <Button component={Link} to="/help">
        Visit Help
      </Button>
    </section>
  );
}
