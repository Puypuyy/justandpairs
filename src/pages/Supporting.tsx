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
import { usePriceEstimate, useSiteData } from "../api/react";
import type { Configuration } from "../api";
import { readConfiguration } from "../utils/configuration";
import Estimate from "../components/Estimate";
export function RequestQuote() {
  const { products, awardImage } = useSiteData();
  const location = useLocation();
  const [params] = useSearchParams();
  let last: string | null = null;
  try {
    last = sessionStorage.getItem("jp-last-product");
  } catch {
    /* unavailable browser storage */
  }
  const chosen = products.find((p) => p.slug === params.get("product"));
  const variant = chosen?.variants?.find((v) => v.id === params.get("variant"));
  const fromState = location.state?.config as Configuration | undefined;
  const product =
    chosen || products.find((p) => p.id === (fromState?.productId || last));
  const config = fromState || (product && readConfiguration(product));
  const saved = !chosen && product && config;
  const pricing = usePriceEstimate(
    saved && product.type === "configurable" ? config : undefined,
  );
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
            This is your original configuration preview.{" "}
            {saved
              ? "Your selected product configuration has been saved for the next step."
              : "Explore the collection or continue to the guided request."}
          </p>
          <Alert severity="info">
            No request has been sent. You can now prepare a guided local demo
            request. Online submission to Just and Pairs is not connected.
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
              {variant && <p>Selected option: {variant.name}</p>}
              <p>
                Continue to the guided request to record your requirements
                locally.
              </p>
            </div>
          )}
          <div className="button-row">
            <Button
              component={Link}
              variant="contained"
              to={`/request-quote${chosen ? `?product=${chosen.slug}` : ""}`}
              state={{
                config,
                variantId: variant?.id,
                rfqEntryId: crypto.randomUUID(),
              }}
            >
              Continue to guided request
            </Button>
            {product && (
              <Action
                to={`/products/${product.slug}${variant ? `?variant=${encodeURIComponent(variant.id)}` : ""}`}
              >
                Return to your product
              </Action>
            )}
            <Action to="/products" secondary>
              Keep exploring
            </Action>
          </div>
        </div>
        {saved && product.type === "configurable" ? (
          <Estimate product={product} config={config} pricing={pricing} />
        ) : (
          <div className="quote-image">
            <img
              src={variant?.image || product?.image || awardImage}
              alt={product?.name || "Recognition product concept"}
              decoding="async"
            />
            <span>Made for your moment.</span>
          </div>
        )}
      </div>
    </div>
  );
}
export function OurWork() {
  const { portfolio } = useSiteData();
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
        {["All", ...new Set(portfolio.map((item) => item.type))].map((f) => (
          <Chip
            key={f}
            label={f}
            onClick={() => setFilter(f)}
            color={f === filter ? "primary" : "default"}
            variant={f === filter ? "filled" : "outlined"}
          />
        ))}
      </div>
      <div className="portfolio-full">
        {portfolio
          .filter((p) => filter === "All" || p.type === filter)
          .map((p) => (
            <article key={p.name}>
              <img src={p.image} alt={`${p.name} illustrative concept`} loading="lazy" decoding="async" />
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
export function Help() {
  const { faq, steps } = useSiteData();
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
export function InfoPage() {
  const { pageContent } = useSiteData();
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
