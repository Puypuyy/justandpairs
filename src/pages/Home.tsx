import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  Gem,
  PenTool,
  Truck,
  Upload,
  Sparkles,
} from "lucide-react";
import { Action, ProductCard, SectionHeading } from "../components/common";
import { useSiteData } from "../api/react";
export default function Home() {
  const {
    awardImage,
    merchImage,
    categories,
    occasions,
    portfolio,
    products,
    steps,
  } = useSiteData();
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="gold-line" /> CUSTOM AWARDS & MERCHANDISE
            </span>
            <h1>
              Recognition
              <br />
              made <span>tangible.</span>
            </h1>
            <p>
              Custom plaques, awards and merchandise for achievements, events
              and moments worth remembering.
            </p>
            <div className="button-row">
              <Action to="/request-quote">Start a Custom Order</Action>
              <Action to="/awards-plaques" secondary>
                Explore Awards
              </Action>
            </div>
            <Link
              className="upload-link"
              to="/products/double-glass-recognition-plaque#personalization"
            >
              <Upload size={15} />
              <span>
                Already have a design? <u>Upload it with your request.</u>
              </span>
            </Link>
          </div>
          <div className="hero-art">
            <img
              src={awardImage}
              alt="Concept of clear glass recognition plaques with gold details on warm stone plinths"
              fetchPriority="high"
            />
            <span className="hero-note">
              <Sparkles size={15} /> Made to mean more.
            </span>
            <Link
              className="hero-caption"
              to="/products/double-glass-recognition-plaque"
            >
              <span>
                <small>A MOMENT. A MILESTONE. A KEEPSAKE.</small>
                <strong>Crafted to celebrate achievement.</strong>
              </span>
              <ArrowUpRight size={22} />
            </Link>
            <span className="concept-caption">
              Illustrative product concept
            </span>
          </div>
        </div>
      </section>
      <section className="trust-strip container">
        {[
          [Gem, "Made to Order", "Created around your moment."],
          [PenTool, "Design Approval", "Your vision, reviewed by you."],
          [CheckCircle2, "Quality Checked", "Care in every detail."],
          [Truck, "Pickup or Delivery", "Ready when it matters."],
        ].map(([Icon, title, copy]) => {
          const I = Icon as typeof Gem;
          return (
            <div key={String(title)}>
              <I size={24} />
              <span>
                <strong>{String(title)}</strong>
                <small>{String(copy)}</small>
              </span>
            </div>
          );
        })}
      </section>
      <section className="section container">
        <SectionHeading
          eyebrow="EVERY MOMENT HAS A MEANING"
          title="What's the occasion?"
          copy="Tell us what you're celebrating. We'll help you find something that fits."
        />
        <div className="occasion-grid">
          {occasions.map((o, i) => (
            <Link
              className="occasion-card"
              key={o.slug}
              to={`/occasions/${o.slug}`}
            >
              <div className={`occasion-image crop-${i}`}>
                <img
                  src={o.image}
                  alt={`${o.name} concept inspiration`}
                  style={{ objectPosition: o.position }}
                  loading="lazy"
                />
              </div>
              <div>
                <h3>
                  {o.name}
                  <ArrowUpRight size={16} />
                </h3>
                <p>{o.description}</p>
              </div>
            </Link>
          ))}
        </div>
        <p className="fine-print">
          Illustrative concepts to help you explore the possibilities.
        </p>
      </section>
      <section className="section canvas">
        <div className="container">
          <SectionHeading
            eyebrow="FIND YOUR STARTING POINT"
            title="What would you like to make?"
            to="/products"
            link="Browse all products"
          />
          <div className="category-grid">
            {categories.map((c, i) => (
              <Link
                key={c.slug}
                className="category-card"
                to={`/products/${c.slug}`}
              >
                <img
                  className={`crop-${i}`}
                  src={c.image}
                  alt={`${c.name} concept collection`}
                  loading="lazy"
                />
                <div>
                  <h3>{c.name}</h3>
                  <p>{c.description}</p>
                </div>
                <ArrowUpRight size={20} />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="section container">
        <SectionHeading
          eyebrow="RECOGNITION, BEAUTIFULLY MADE"
          title="Made to recognize something special."
          copy="Thoughtful pieces for achievements that deserve to be remembered."
          to="/awards-plaques"
          link="Explore all awards"
        />
        <div className="product-grid">
          {products
            .filter((p) => p.featured)
            .map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
        </div>
        <p className="fine-print">
          Illustrative products and sample starting prices. Final pricing is
          confirmed in your quotation.
        </p>
      </section>
      <section className="container">
        <div className="custom-feature">
          <div>
            <span className="eyebrow">CUSTOM-MADE. MEANINGFULLY YOURS.</span>
            <h2>
              Have something
              <br />
              different in mind?
            </h2>
            <p>
              Send us your idea, logo or inspiration. We'll help turn it into a
              finished piece made for your event.
            </p>
            <div className="button-row">
              <Action to="/request-quote">Start a Custom Order</Action>
              <Link className="text-link" to="/our-work">
                See Our Work <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
          <img
            src={merchImage}
            alt="Concept collection of custom team apparel and thoughtful merchandise"
            loading="lazy"
          />
        </div>
      </section>
      <section className="section container">
        <SectionHeading
          eyebrow="THOUGHTFUL AT EVERY STEP"
          title="From idea to finished piece."
        />
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
      <section className="section warm">
        <div className="container">
          <SectionHeading
            eyebrow="THE POSSIBILITIES"
            title="Made for moments like these."
            to="/our-work"
            link="Explore Our Work"
          />
          <div className="portfolio-preview">
            {portfolio.slice(0, 3).map((p) => (
              <Link to="/our-work" key={p.name}>
                <img
                  src={p.image}
                  alt={`${p.name} illustrative concept`}
                  loading="lazy"
                />
                <span className="eyebrow">CONCEPT SHOWCASE</span>
                <h3>
                  {p.name}
                  <ArrowUpRight size={19} />
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="section container bulk">
        <div>
          <span className="eyebrow">
            BIG MOMENTS. THOUGHTFULLY COORDINATED.
          </span>
          <h2>
            Planning for a team,
            <br />
            school or organization?
          </h2>
          <p>
            From one meaningful piece to a whole event, we'll help bring every
            detail together.
          </p>
          <Action to="/request-quote">Talk to Us About Your Project</Action>
        </div>
        <div className="bulk-points">
          {[
            "Quantity orders",
            "Custom branding",
            "Multiple award names",
            "Event deadlines",
            "Design assistance",
            "Coordinated production",
          ].map((t) => (
            <div key={t}>
              <Check size={20} />
              {t}
            </div>
          ))}
        </div>
      </section>
      <section className="proof-section container">
        <SectionHeading
          title="Made for people worth celebrating."
          copy="Real stories deserve a space of their own."
        />
        <div className="proof-grid">
          {[
            [
              "Customer stories",
              "Customer testimonials will appear here once shared with permission.",
            ],
            ["Our community", "Approved client logos will be featured here."],
            [
              "Moments, delivered",
              "Finished-order photographs will be added as our collection grows.",
            ],
          ].map(([t, d]) => (
            <div key={t}>
              <span className="eyebrow">COMING SOON</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="final-cta">
        <div className="container">
          <span className="eyebrow">LET'S MAKE IT MEANINGFUL</span>
          <h2>Have an occasion coming up?</h2>
          <p>
            Tell us what you're planning. We'll help you figure out what to
            make.
          </p>
          <div className="button-row">
            <Action to="/request-quote">Request a Quote</Action>
            <Action to="/products" secondary>
              Browse Products
            </Action>
          </div>
        </div>
      </section>
    </>
  );
}
