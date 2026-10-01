import { Button } from "@mui/material";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  FileText,
  HeartHandshake,
  MessageSquare,
  PackageCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Action, Breadcrumb } from "../components/common";
import { useSiteData } from "../api/react";

const principles = [
  {
    icon: Award,
    title: "Recognition with purpose",
    text: "Awards and keepsakes should reflect the achievement, person, team or occasion behind them.",
  },
  {
    icon: Sparkles,
    title: "Made around your idea",
    text: "Choose from the collection or begin with your own reference, logo and requirements.",
  },
  {
    icon: PackageCheck,
    title: "Clear before production",
    text: "Specifications, pricing and the design are confirmed before an order moves into production.",
  },
];

export function About() {
  return (
    <div className="static-page">
      <section className="static-hero static-hero-dark">
        <div className="container static-hero-grid">
          <div>
            <Breadcrumb current="About" />
            <span className="eyebrow">ABOUT JUST AND PAIRS</span>
            <h1>Recognition made tangible.</h1>
            <p>
              Just and Pairs creates custom awards, recognition pieces and
              merchandise for achievements, events and moments worth
              remembering.
            </p>
            <div className="button-row">
              <Action to="/products">Explore the collection</Action>
              <Action to="/request-quote?mode=custom" secondary>
                Start a custom request
              </Action>
            </div>
          </div>
          <div className="static-hero-mark" aria-hidden="true">
            <Award size={72} />
            <span>Ideas made tangible.</span>
          </div>
        </div>
      </section>

      <section className="container section static-intro">
        <span className="eyebrow">WHAT WE MAKE</span>
        <h2>Made for the moment, not just the material.</h2>
        <p>
          Customers often begin with a person to recognize, an event to plan
          or an idea they want to bring to life. Our collection supports
          corporate recognition, schools and graduation, sports and
          competitions, events, organizations, appreciation gifts and custom
          merchandise.
        </p>
      </section>

      <section className="container static-card-grid" aria-label="Our approach">
        {principles.map(({ icon: Icon, title, text }) => (
          <article className="static-card" key={title}>
            <Icon size={26} />
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="container section static-split">
        <div>
          <span className="eyebrow">HOW IT WORKS</span>
          <h2>A clear path from idea to finished piece.</h2>
        </div>
        <ol className="static-steps">
          <li><span>01</span><div><h3>Tell us what you need</h3><p>Choose a product or describe your own idea and occasion.</p></div></li>
          <li><span>02</span><div><h3>Confirm the details</h3><p>Specifications, quantity, timing and pricing are reviewed.</p></div></li>
          <li><span>03</span><div><h3>Approve the design</h3><p>You review the design before anything enters production.</p></div></li>
          <li><span>04</span><div><h3>Production and release</h3><p>The finished order is quality checked before pickup or delivery.</p></div></li>
        </ol>
      </section>
      <StaticCta />
    </div>
  );
}

export function Contact() {
  const { businessSettings } = useSiteData();
  return (
    <div className="static-page">
      <section className="container static-hero static-contact-hero">
        <Breadcrumb current="Contact" />
        <span className="eyebrow">CONTACT</span>
        <h1>Tell us what you would like to make.</h1>
        <p>
          Prepare your product, quantity, deadline and design requirements in
          one guided request. During this static phase, the request is saved
          only in your browser and is not transmitted to Just and Pairs.
        </p>
      </section>
      <section className="container static-contact-grid">
        <article className="static-card static-contact-card">
          <MessageSquare size={28} />
          <h2>Prepare a quote request</h2>
          <p>Use the guided form for awards, merchandise, bulk requirements or something completely custom.</p>
          <Button component={Link} to="/request-quote" variant="contained" endIcon={<ArrowRight size={17} />}>Start your request</Button>
        </article>
        <article className="static-card static-contact-card">
          <HeartHandshake size={28} />
          <h2>Need help deciding?</h2>
          <p>Review ordering, artwork, payment, design approval and delivery guidance before preparing your request.</p>
          <Button component={Link} to="/help" variant="outlined">Visit Help</Button>
        </article>
      </section>
      <section className="container section static-note">
        <CheckCircle2 size={24} />
        <div>
          <h2>{businessSettings.verified ? "Contact Just and Pairs" : "Business details awaiting verification"}</h2>
          <div className="contact-details"><p><strong>Email</strong><br />{businessSettings.email}</p><p><strong>Phone</strong><br />{businessSettings.phone}</p><p><strong>Address</strong><br />{businessSettings.address}</p><p><strong>Hours</strong><br />{businessSettings.hours}</p></div>
          {!businessSettings.verified && <p>These values are editable in the admin POC and must be verified before launch.</p>}
        </div>
      </section>
    </div>
  );
}

export function Terms() {
  const { homeContent } = useSiteData();
  return (
    <LegalPage title="Website terms" eyebrow="TERMS" icon={FileText}>
      <p>This website is currently a static customer preview. It allows you to browse products and prepare a quotation request locally, but it does not transmit an enquiry, create a binding quotation, accept an order or collect payment.</p>
      <h2>Product information</h2>
      <p>Product names, images and descriptions help you explore possible designs. Dimensions, materials, finishes, availability, lead times and prices remain subject to confirmation in a formal quotation.</p>
      <h2>Local quotation requests</h2>
      <p>A request and its confirmation reference are stored only in your current browser. They are not proof that Just and Pairs received or accepted an order. Contact and submission services will be connected in a later phase.</p>
      <h2>Artwork and files</h2>
      <p>Files selected in the request form are used only for a local browser preview. They are not uploaded. Keep an original copy of every file you intend to provide when direct submissions become available.</p>
      <h2>Orders and payment</h2>
      <p>Production begins only after the requirements, quotation, payment terms and design approval have been confirmed through an authorized Just and Pairs channel. This website does not currently take deposits or payments.</p>
      {homeContent.policySummary && <><h2>Additional customer policy</h2><p>{homeContent.policySummary}</p></>}
    </LegalPage>
  );
}

export function Privacy() {
  return (
    <LegalPage title="Privacy in this website preview" eyebrow="PRIVACY" icon={ShieldCheck}>
      <p>This static preview keeps quotation drafts and local confirmation records in your browser. Just and Pairs does not receive that information through this website in the current phase.</p>
      <h2>Information stored locally</h2>
      <p>The guided request may store product selections, specifications, quantity, artwork preview data, deadline, delivery preference and contact details in local browser storage. Confirmation records remain on the same device and browser until that site data is cleared.</p>
      <h2>Selected files</h2>
      <p>JPG, PNG or PDF files selected in the form remain local. Submitted demo records retain file names and basic metadata but remove the preview bytes. No file is sent to a server.</p>
      <h2>External services</h2>
      <p>The website loads Manrope and Inter fonts from Google Fonts. Your browser may connect to Google to retrieve those font files. No account, analytics, advertising or payment service is currently integrated.</p>
      <h2>Your control</h2>
      <p>You can remove locally stored information by clearing this site's data in your browser. Do not enter sensitive information that is not needed to prepare a quotation request.</p>
    </LegalPage>
  );
}

function LegalPage({ title, eyebrow, icon: Icon, children }: { title: string; eyebrow: string; icon: typeof FileText; children: ReactNode }) {
  return (
    <div className="container static-page legal-page">
      <Breadcrumb current={title} />
      <div className="legal-heading"><Icon size={30} /><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1></div></div>
      <div className="legal-copy">{children}</div>
      <p className="legal-status">Current website phase: static/local preview. Last reviewed September 2026.</p>
    </div>
  );
}

export function NotFound() {
  return (
    <section className="container not-found-page">
      <span className="not-found-code">404</span>
      <span className="eyebrow">PAGE NOT FOUND</span>
      <h1>This page is not in the collection.</h1>
      <p>The address may have changed, or the page may not be available in this static preview.</p>
      <div className="button-row"><Action to="/products">Browse products</Action><Action to="/" secondary>Return home</Action></div>
    </section>
  );
}

function StaticCta() {
  return (
    <section className="static-final-cta"><div className="container">
      <span className="eyebrow">YOUR IDEA STARTS HERE</span>
      <h2>What would you like to make?</h2>
      <p>Choose from the collection or tell us about something custom.</p>
      <div className="button-row"><Action to="/request-quote">Prepare a quote request</Action><Action to="/our-work" secondary>See our work</Action></div>
    </div></section>
  );
}
