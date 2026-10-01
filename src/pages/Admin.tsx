import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
} from "@mui/material";
import {
  BarChart3,
  Bell,
  BookOpen,
  Box,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  ExternalLink,
  FileText,
  Gauge,
  LayoutDashboard,
  Menu,
  PackageCheck,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
import { suppliedProducts } from "../api/mock/data/products";
import type { Product, RfqRecord } from "../api";
import { OrderWorkspace, QuoteWorkspace } from "./AdminWorkspaces";
import "./admin.css";
import { createId } from "../utils/id";

type Section =
  | "overview"
  | "quotes"
  | "orders"
  | "products"
  | "customers"
  | "content"
  | "reports"
  | "notifications"
  | "settings"
  | "roadmap";
type QuoteStatus = "New" | "Reviewing" | "Quoted" | "Won" | "Declined";
type OrderStatus = "Awaiting artwork" | "Design approval" | "In production" | "Ready" | "Completed";
type AdminQuote = {
  id: string;
  reference: string;
  customer: string;
  email: string;
  product: string;
  quantity: number;
  due: string;
  value: number | null;
  status: QuoteStatus;
  createdAt: string;
  internalNotes?: string;
  depositPercent?: number;
  validityDays?: number;
};
type AdminOrder = {
  id: string;
  customer: string;
  item: string;
  total: number;
  due: string;
  status: OrderStatus;
  paymentStatus?: "Unpaid" | "Deposit paid" | "Paid";
  fulfillment?: "Pickup" | "Courier Delivery";
  checklist?: { label: string; done: boolean }[];
  revisions?: { label: string; date: string; status: string }[];
  notes?: string;
};
type Customer = { id: string; name: string; organization: string; email: string; quotes: number; spent: number };
type AdminState = {
  products: Product[];
  quotes: AdminQuote[];
  orders: AdminOrder[];
  customers: Customer[];
  content: { announcement: string; heroTitle: string; heroText: string; testimonialQuote: string; testimonialName: string; testimonialApproved: boolean; policySummary: string; featuredProjectName: string; featuredProjectType: string; featuredProjectImage: string };
  notifications: { id: string; name: string; trigger: string; subject: string; message: string; enabled: boolean }[];
  settings: { businessName: string; email: string; phone: string; address: string; hours: string; currency: string; quotePrefix: string; verified: boolean };
};

const STORAGE_KEY = "jp_admin_poc_v1";
const fmt = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });
const today = new Date();
const isoDay = (offset: number) => new Date(today.getTime() + offset * 86400000).toISOString().slice(0, 10);
const seedState = (): AdminState => ({
  products: suppliedProducts,
  quotes: [
    { id: "q1", reference: "JP-RFQ-DEMO-1042", customer: "Maya Santos", email: "maya@example.com", product: "Beveled Flame Recognition Award", quantity: 24, due: isoDay(12), value: 28800, status: "New", createdAt: isoDay(-1) },
    { id: "q2", reference: "JP-RFQ-DEMO-1039", customer: "Paolo Reyes", email: "paolo@example.com", product: "Gold Scroll Recognition Plaque", quantity: 10, due: isoDay(8), value: 14500, status: "Reviewing", createdAt: isoDay(-3) },
    { id: "q3", reference: "JP-RFQ-DEMO-1034", customer: "Ana Lim", email: "ana@example.com", product: "Custom team medals", quantity: 80, due: isoDay(24), value: null, status: "Quoted", createdAt: isoDay(-6) },
  ],
  orders: [
    { id: "JP-24018", customer: "Northview Academy", item: "Graduation plaques · 48", total: 67200, due: isoDay(5), status: "In production" },
    { id: "JP-24017", customer: "Aster Labs", item: "Service awards · 12", total: 21600, due: isoDay(2), status: "Design approval" },
    { id: "JP-24014", customer: "City Sports Club", item: "Tournament trophies · 30", total: 45000, due: isoDay(0), status: "Ready" },
  ],
  customers: [
    { id: "c1", name: "Maya Santos", organization: "Brightline Co.", email: "maya@example.com", quotes: 3, spent: 48600 },
    { id: "c2", name: "Paolo Reyes", organization: "Northview Academy", email: "paolo@example.com", quotes: 5, spent: 112000 },
    { id: "c3", name: "Ana Lim", organization: "City Sports Club", email: "ana@example.com", quotes: 2, spent: 45000 },
  ],
  content: { announcement: "Custom awards & merchandise made for your moment.", heroTitle: "Make the moment tangible.", heroText: "Custom awards and merchandise, designed around the people and moments that matter.", testimonialQuote: "", testimonialName: "", testimonialApproved: false, policySummary: "", featuredProjectName: "", featuredProjectType: "", featuredProjectImage: "" },
  notifications: [
    { id: "quote-received", name: "Request received", trigger: "New quote request", subject: "We received {{reference}}", message: "Hi {{customer}}, we have received your request and will review the details before sending a quotation.", enabled: true },
    { id: "quote-ready", name: "Quotation ready", trigger: "Status changes to Quoted", subject: "Your Just and Pairs quotation is ready", message: "Hi {{customer}}, your quotation for {{product}} is ready for review.", enabled: true },
    { id: "design-approval", name: "Design approval needed", trigger: "Order enters Design approval", subject: "Please review your design", message: "Your design proof is ready. Production starts only after your approval.", enabled: true },
    { id: "order-ready", name: "Order ready", trigger: "Order status changes to Ready", subject: "Your order is ready", message: "Good news—your Just and Pairs order is ready for pickup or delivery coordination.", enabled: true },
  ],
  settings: { businessName: "Just and Pairs", email: "Not yet confirmed", phone: "Not yet confirmed", address: "Not yet confirmed", hours: "Not yet confirmed", currency: "PHP", quotePrefix: "JP-RFQ", verified: false },
});

function readState(): AdminState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...seedState(), ...JSON.parse(saved) } : seedState();
  } catch { return seedState(); }
}

function customerRfqs(): AdminQuote[] {
  const quick: AdminQuote[] = [];
  try {
    const saved = JSON.parse(localStorage.getItem("jp_quick_quotes_v1") || "[]") as Array<{ id: string; reference: string; name: string; email: string; mobile: string; productName: string; quantity: number; needBy: string; estimatedTotal: number | null; createdAt: string }>;
    if (Array.isArray(saved)) quick.push(...saved.map((record) => ({ id: record.id, reference: record.reference, customer: record.name || "Unnamed customer", email: record.email || record.mobile || "No contact", product: record.productName, quantity: record.quantity, due: record.needBy || "Flexible", value: record.estimatedTotal, status: "New" as QuoteStatus, createdAt: record.createdAt.slice(0, 10) })));
  } catch { /* no quick requests */ }
  try {
    const state = JSON.parse(localStorage.getItem("jp_rfq_state_v1") || "{}") as { records?: RfqRecord[] };
    return [...quick, ...(state.records || []).map((record) => ({
      id: record.id,
      reference: record.reference,
      customer: record.draft.contact.name || "Unnamed customer",
      email: record.draft.contact.email,
      product: record.productSnapshot?.name || record.draft.details.description || "Custom request",
      quantity: record.draft.quantity,
      due: record.draft.deadline.date || "Flexible",
      value: record.estimate?.total ?? null,
      status: "New" as QuoteStatus,
      createdAt: record.createdAt.slice(0, 10),
    }))];
  } catch { return quick; }
}

const sections: { id: Section; label: string; icon: typeof Gauge }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "quotes", label: "Quote requests", icon: ClipboardList },
  { id: "orders", label: "Orders", icon: PackageCheck },
  { id: "products", label: "Products", icon: ShoppingBag },
  { id: "customers", label: "Customers", icon: Users },
  { id: "content", label: "Website content", icon: FileText },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "roadmap", label: "POC roadmap", icon: BookOpen },
];

export default function Admin() {
  const [state, setState] = useState(readState);
  const [section, setSection] = useState<Section>("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [notice, setNotice] = useState("");
  const [productEditor, setProductEditor] = useState<Product | "new" | null>(null);
  const [quoteEditor, setQuoteEditor] = useState<AdminQuote | null>(null);
  const [orderEditor, setOrderEditor] = useState<AdminOrder | null>(null);
  const quotes = useMemo(() => {
    const existing = new Set(state.quotes.map((q) => q.id));
    return [...customerRfqs().filter((q) => !existing.has(q.id)), ...state.quotes];
  }, [state.quotes]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);
  useEffect(() => {
    document.title = "Admin POC | Just and Pairs";
  }, []);
  const save = (next: AdminState, message: string) => {
    setState(next); setNotice(message); window.setTimeout(() => setNotice(""), 2600);
  };
  const choose = (next: Section) => { setSection(next); setMobileNav(false); window.scrollTo(0, 0); };
  const heading = sections.find((item) => item.id === section)?.label;
  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${mobileNav ? "open" : ""}`}>
        <div className="admin-brand"><img src="/images/just-and-pairs-logo.jpg" alt="Just and Pairs"/><small>ADMIN POC</small></div>
        <nav aria-label="Admin navigation">
          {sections.map(({ id, label, icon: Icon }) => <button key={id} className={section === id ? "active" : ""} onClick={() => choose(id)}><Icon size={19}/><span>{label}</span>{id === "quotes" && <b>{quotes.filter((q) => q.status === "New").length}</b>}</button>)}
        </nav>
        <div className="admin-sidebar-foot"><span className="admin-avatar">AD</span><div><strong>Admin demo</strong><small>Local browser session</small></div></div>
      </aside>
      {mobileNav && <button className="admin-scrim" aria-label="Close menu" onClick={() => setMobileNav(false)}/>} 
      <main className="admin-main">
        <header className="admin-topbar">
          <IconButton className="admin-menu" aria-label="Open admin menu" onClick={() => setMobileNav(true)}><Menu/></IconButton>
          <div><span className="admin-kicker">Workspace</span><h1>{heading}</h1></div>
          <div className="admin-top-actions"><IconButton aria-label="Notifications"><Bell size={20}/></IconButton><Button component={Link} to="/" target="_blank" endIcon={<ExternalLink size={16}/>}>View storefront</Button></div>
        </header>
        <div className="admin-content">
          <Alert severity="info" className="admin-demo-note"><strong>Static POC:</strong> changes are saved only in this browser. Authentication, payments, uploads and team access connect when the backend is built.</Alert>
          {notice && <div className="admin-toast"><Check size={17}/>{notice}</div>}
          {section === "overview" && <Overview state={state} quotes={quotes} onNavigate={choose}/>} 
          {section === "quotes" && <Quotes quotes={quotes} onOpen={setQuoteEditor} onStatus={(id, status) => {
            const quote = quotes.find((q) => q.id === id);
            const orderId = `ORD-${quote?.reference}`;
            const createsOrder = status === "Won" && !!quote && !state.orders.some((o) => o.id === orderId);
            const orders = createsOrder && quote ? [{ id: orderId, customer: quote.customer, item: `${quote.product} · ${quote.quantity}`, total: quote.value || 0, due: quote.due, status: "Awaiting artwork" as OrderStatus }, ...state.orders] : state.orders;
            save({ ...state, quotes: quotes.map((q) => q.id === id ? { ...q, status } : q), orders }, createsOrder ? "Quote won and order created" : "Quote status updated");
          }}/>} 
          {section === "orders" && <Orders orders={state.orders} onOpen={setOrderEditor} onStatus={(id, status) => save({ ...state, orders: state.orders.map((o) => o.id === id ? { ...o, status } : o) }, "Order stage updated")}/>} 
          {section === "products" && <Products products={state.products} onEdit={setProductEditor}/>} 
          {section === "customers" && <Customers customers={state.customers}/>} 
          {section === "content" && <ContentPanel value={state.content} onSave={(content) => save({ ...state, content }, "Website content draft saved")}/>} 
          {section === "reports" && <Reports state={state} quotes={quotes}/>} 
          {section === "notifications" && <Notifications value={state.notifications} onSave={(notifications) => save({ ...state, notifications }, "Notification templates saved")}/>} 
          {section === "settings" && <SettingsPanel value={state.settings} onSave={(settings) => save({ ...state, settings }, "Business settings saved")}/>} 
          {section === "roadmap" && <Roadmap/>}
        </div>
      </main>
      <ProductDialog product={productEditor} onClose={() => setProductEditor(null)} onSave={(product) => {
        const exists = state.products.some((p) => p.id === product.id);
        save({ ...state, products: exists ? state.products.map((p) => p.id === product.id ? product : p) : [product, ...state.products] }, exists ? "Product updated" : "Product added");
        setProductEditor(null);
      }}/>
      <QuoteWorkspace quote={quoteEditor} onClose={() => setQuoteEditor(null)} onSave={(quote) => { save({ ...state, quotes: quotes.some((q) => q.id === quote.id) ? quotes.map((q) => q.id === quote.id ? quote : q) : [quote, ...quotes] }, "Quotation saved"); setQuoteEditor(null); }}/>
      <OrderWorkspace order={orderEditor} onClose={() => setOrderEditor(null)} onSave={(order) => { save({ ...state, orders: state.orders.map((o) => o.id === order.id ? order : o) }, "Order workspace saved"); setOrderEditor(null); }}/>
    </div>
  );
}

function Stat({ label, value, note, icon: Icon }: { label: string; value: string; note: string; icon: typeof Gauge }) {
  return <article className="admin-stat"><div className="admin-stat-icon"><Icon size={21}/></div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}
function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return <section className="admin-panel"><header><h2>{title}</h2>{action}</header>{children}</section>;
}
function Status({ value }: { value: string }) { return <span className={`admin-status s-${value.toLowerCase().replaceAll(" ", "-")}`}>{value}</span>; }

function Overview({ state, quotes, onNavigate }: { state: AdminState; quotes: AdminQuote[]; onNavigate: (s: Section) => void }) {
  const pipeline = quotes.reduce((sum, q) => sum + (q.value || 0), 0);
  const revenue = state.orders.filter((o) => o.status === "Completed").reduce((sum, o) => sum + o.total, 0);
  return <>
    <div className="admin-welcome"><div><span className="admin-kicker">Thursday overview</span><h2>Good morning. Here’s what needs attention.</h2><p>Review incoming requests, keep production moving, and prepare the catalog for launch.</p></div><Button variant="contained" startIcon={<Plus size={17}/>} onClick={() => onNavigate("products")}>Add a product</Button></div>
    <div className="admin-stats"><Stat label="New requests" value={String(quotes.filter((q) => q.status === "New").length)} note="Ready for review" icon={ClipboardList}/><Stat label="Open orders" value={String(state.orders.filter((o) => o.status !== "Completed").length)} note="Across production" icon={Box}/><Stat label="Quote pipeline" value={fmt.format(pipeline)} note="Illustrative total" icon={CircleDollarSign}/><Stat label="Catalog" value={String(state.products.length)} note="Product records" icon={ShoppingBag}/></div>
    <div className="admin-grid-2"><Panel title="Recent quote requests" action={<Button onClick={() => onNavigate("quotes")} endIcon={<ChevronRight size={16}/>}>View all</Button>}><QuoteTable quotes={quotes.slice(0, 5)}/></Panel><Panel title="Production board" action={<Button onClick={() => onNavigate("orders")} endIcon={<ChevronRight size={16}/>}>Manage</Button>}><div className="production-list">{state.orders.map((o) => <div key={o.id}><span className="production-dot"/><div><strong>{o.item}</strong><small>{o.customer} · Due {o.due}</small></div><Status value={o.status}/></div>)}</div></Panel></div>
    <Panel title="POC readiness"><div className="readiness-grid"><Readiness label="Customer catalog & search" done/><Readiness label="Guided quote request" done/><Readiness label="Admin operations demo" done/><Readiness label="Real authentication"/><Readiness label="Database & file storage"/><Readiness label="Payments & notifications"/></div></Panel>
  </>;
}
function Readiness({ label, done = false }: { label: string; done?: boolean }) { return <div className={done ? "done" : "planned"}><span>{done ? <Check size={16}/> : <span/>}</span><strong>{label}</strong><small>{done ? "POC ready" : "Backend phase"}</small></div>; }

function QuoteTable({ quotes, onStatus, onOpen }: { quotes: AdminQuote[]; onStatus?: (id: string, status: QuoteStatus) => void; onOpen?: (quote: AdminQuote) => void }) {
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Request</th><th>Customer</th><th>Requirement</th><th>Due</th><th>Estimate</th><th>Status</th>{onOpen && <th>Action</th>}</tr></thead><tbody>{quotes.map((q) => <tr key={q.id}><td><strong>{q.reference}</strong><small>{q.createdAt}</small></td><td><strong>{q.customer}</strong><small>{q.email}</small></td><td><strong>{q.product}</strong><small>Qty {q.quantity}</small></td><td>{q.due}</td><td>{q.value ? fmt.format(q.value) : "To quote"}</td><td>{onStatus ? <select aria-label={`Status for ${q.reference}`} value={q.status} onChange={(e) => onStatus(q.id, e.target.value as QuoteStatus)}>{["New", "Reviewing", "Quoted", "Won", "Declined"].map((s) => <option key={s}>{s}</option>)}</select> : <Status value={q.status}/>}</td>{onOpen && <td><Button size="small" onClick={() => onOpen(q)}>Open</Button></td>}</tr>)}</tbody></table></div>;
}
function Quotes({ quotes, onStatus, onOpen }: { quotes: AdminQuote[]; onStatus: (id: string, status: QuoteStatus) => void; onOpen: (quote: AdminQuote) => void }) {
  const [query, setQuery] = useState(""); const [status, setStatus] = useState("All");
  const shown = quotes.filter((q) => (status === "All" || q.status === status) && `${q.reference} ${q.customer} ${q.product}`.toLowerCase().includes(query.toLowerCase()));
  return <Panel title="Quote request pipeline" action={<Chip label={`${shown.length} requests`}/>}><div className="admin-filters"><div className="admin-search"><Search size={17}/><input aria-label="Search quote requests" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customer, reference or product"/></div><TextField select size="small" label="Filter status" value={status} onChange={(e) => setStatus(e.target.value)}><MenuItem value="All">All statuses</MenuItem>{["New", "Reviewing", "Quoted", "Won", "Declined"].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></div><QuoteTable quotes={shown} onStatus={onStatus} onOpen={onOpen}/>{!shown.length && <Empty text="No quote requests match these filters."/>}</Panel>;
}
function Orders({ orders, onStatus, onOpen }: { orders: AdminOrder[]; onStatus: (id: string, status: OrderStatus) => void; onOpen: (order: AdminOrder) => void }) {
  const stages: OrderStatus[] = ["Awaiting artwork", "Design approval", "In production", "Ready", "Completed"];
  return <div className="order-board">{stages.map((stage) => <section key={stage}><header><h2>{stage}</h2><span>{orders.filter((o) => o.status === stage).length}</span></header>{orders.filter((o) => o.status === stage).map((o) => <article key={o.id}><small>{o.id}</small><h3>{o.item}</h3><p>{o.customer}</p><dl><div><dt>Due</dt><dd>{o.due}</dd></div><div><dt>Total</dt><dd>{fmt.format(o.total)}</dd></div></dl><TextField select size="small" label="Move to" value={o.status} onChange={(e) => onStatus(o.id, e.target.value as OrderStatus)}>{stages.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField><Button fullWidth onClick={() => onOpen(o)}>Open order</Button></article>)}</section>)}</div>;
}
function Products({ products, onEdit }: { products: Product[]; onEdit: (p: Product | "new") => void }) {
  const [query, setQuery] = useState(""); const shown = products.filter((p) => `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(query.toLowerCase()));
  return <Panel title="Product catalog" action={<Button variant="contained" startIcon={<Plus size={17}/>} onClick={() => onEdit("new")}>New product</Button>}><div className="admin-filters"><div className="admin-search"><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products or SKU"/></div><span>{shown.length} products</span></div><div className="product-admin-grid">{shown.map((p) => <article key={p.id}><img src={p.image} alt=""/><div><span className="admin-product-meta">{p.sku} · {p.category.replaceAll("-", " ")}</span><h3>{p.name}</h3><p>{p.shortDescription}</p><div><Status value={p.featured ? "Featured" : "Active"}/><strong>{p.basePrice ? fmt.format(p.basePrice) : "Quote only"}</strong></div></div><IconButton aria-label={`Edit ${p.name}`} onClick={() => onEdit(p)}><Pencil size={17}/></IconButton></article>)}</div></Panel>;
}
function ProductDialog({ product, onClose, onSave }: { product: Product | "new" | null; onClose: () => void; onSave: (p: Product) => void }) {
  const blank: Product = { id: "", sku: "", slug: "", name: "", category: "glass-awards", type: "bespoke", description: "", shortDescription: "", image: "/images/products/beveled-flame.png", basePrice: null, featured: false, sizes: [], finishes: [], style: "With Base", occasionTags: [] };
  const [draft, setDraft] = useState<Product>(blank);
  useEffect(() => setDraft(product && product !== "new" ? product : blank), [product]);
  const set = (key: keyof Product, value: unknown) => setDraft((p) => ({ ...p, [key]: value }));
  return <Dialog open={!!product} onClose={onClose} fullWidth maxWidth="md"><DialogTitle className="row-between">{product === "new" ? "Add product" : "Edit product"}<IconButton aria-label="Close product editor" onClick={onClose}><X/></IconButton></DialogTitle><DialogContent className="admin-form"><Alert severity="info">POC catalog edits are saved locally and appear on the storefront after reload. Instant Quote requires a confirmed base price, sizes and finishes.</Alert><TextField label="Product name" value={draft.name} onChange={(e) => set("name", e.target.value)}/><div className="admin-form-row"><TextField label="SKU" value={draft.sku} onChange={(e) => set("sku", e.target.value)}/><TextField select label="Category" value={draft.category} onChange={(e) => set("category", e.target.value)}><MenuItem value="glass-awards">Glass awards</MenuItem><MenuItem value="plaques">Plaques</MenuItem><MenuItem value="trophies-medals">Trophies & medals</MenuItem><MenuItem value="custom-merchandise">Merchandise</MenuItem></TextField><TextField select label="Quotation mode" value={draft.type} onChange={(e) => set("type", e.target.value)}><MenuItem value="bespoke">Custom Quote</MenuItem><MenuItem value="configurable">Instant Quote</MenuItem></TextField><TextField label="Base price" type="number" value={draft.basePrice ?? ""} onChange={(e) => set("basePrice", e.target.value ? Number(e.target.value) : null)}/></div><TextField label="Short description" multiline minRows={2} value={draft.shortDescription} onChange={(e) => set("shortDescription", e.target.value)}/><TextField label="Full description" multiline minRows={3} value={draft.description} onChange={(e) => set("description", e.target.value)}/><div className="admin-form-row"><TextField label="Material (optional)" value={draft.material || ""} onChange={(e) => set("material", e.target.value || null)}/><TextField label="Style" value={draft.style} onChange={(e) => set("style", e.target.value)}/><TextField label="Sizes in inches (comma-separated)" value={draft.sizes.join(", ")} onChange={(e) => set("sizes", e.target.value.split(",").map((v) => Number(v.trim())).filter((v) => Number.isFinite(v) && v > 0))}/><TextField label="Finishes (comma-separated)" value={draft.finishes.join(", ")} onChange={(e) => set("finishes", e.target.value.split(",").map((v) => v.trim()).filter(Boolean))}/></div><TextField label="Image path" value={draft.image} onChange={(e) => set("image", e.target.value)}/><TextField select label="Featured" value={draft.featured ? "yes" : "no"} onChange={(e) => set("featured", e.target.value === "yes")}><MenuItem value="yes">Yes</MenuItem><MenuItem value="no">No</MenuItem></TextField></DialogContent><DialogActions><Button onClick={onClose}>Cancel</Button><Button variant="contained" disabled={!draft.name.trim() || !draft.sku.trim()} onClick={() => { const slug = draft.slug || draft.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); onSave({ ...draft, id: draft.id || createId(), slug, description: draft.description || draft.shortDescription }); }}>Save product</Button></DialogActions></Dialog>;
}
function Customers({ customers }: { customers: Customer[] }) { const [q, setQ] = useState(""); const shown = customers.filter((c) => `${c.name} ${c.organization} ${c.email}`.toLowerCase().includes(q.toLowerCase())); return <Panel title="Customer directory" action={<Chip label={`${customers.length} demo customers`}/>}><div className="admin-filters"><div className="admin-search"><Search size={17}/><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customers"/></div></div><div className="customer-grid">{shown.map((c) => <article key={c.id}><span className="customer-avatar">{c.name.split(" ").map((x) => x[0]).join("")}</span><div><h3>{c.name}</h3><p>{c.organization}</p><a href={`mailto:${c.email}`}>{c.email}</a></div><dl><div><dt>Quotes</dt><dd>{c.quotes}</dd></div><div><dt>Lifetime value</dt><dd>{fmt.format(c.spent)}</dd></div></dl></article>)}</div></Panel>; }

function ContentPanel({ value, onSave }: { value: AdminState["content"]; onSave: (v: AdminState["content"]) => void }) { const [form, setForm] = useState(value); return <><div className="admin-grid-2 content-editor"><Panel title="Homepage content"><div className="admin-form"><TextField label="Announcement bar" value={form.announcement} onChange={(e) => setForm({ ...form, announcement: e.target.value })}/><TextField label="Hero heading" value={form.heroTitle} onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}/><TextField label="Hero description" multiline minRows={4} value={form.heroText} onChange={(e) => setForm({ ...form, heroText: e.target.value })}/></div></Panel><Panel title="Live preview"><div className="content-preview"><small>{form.announcement}</small><span>JUST AND PAIRS</span><h2>{form.heroTitle}</h2><p>{form.heroText}</p><button>Browse products</button></div></Panel></div><div className="admin-grid-2 content-editor"><Panel title="Approved customer proof"><div className="admin-form"><Alert severity="warning">Publish testimonials only with customer permission.</Alert><TextField label="Testimonial" multiline minRows={3} value={form.testimonialQuote} onChange={(e) => setForm({ ...form, testimonialQuote: e.target.value })}/><TextField label="Customer / organization attribution" value={form.testimonialName} onChange={(e) => setForm({ ...form, testimonialName: e.target.value })}/><TextField select label="Permission status" value={form.testimonialApproved ? "approved" : "draft"} onChange={(e) => setForm({ ...form, testimonialApproved: e.target.value === "approved" })}><MenuItem value="draft">Draft / no permission recorded</MenuItem><MenuItem value="approved">Approved for website</MenuItem></TextField></div></Panel><Panel title="Featured completed project"><div className="admin-form"><TextField label="Project name" value={form.featuredProjectName} onChange={(e) => setForm({ ...form, featuredProjectName: e.target.value })}/><TextField label="Project type" value={form.featuredProjectType} onChange={(e) => setForm({ ...form, featuredProjectType: e.target.value })}/><TextField label="Approved image path" value={form.featuredProjectImage} onChange={(e) => setForm({ ...form, featuredProjectImage: e.target.value })}/><TextField label="Customer policy summary" multiline minRows={3} value={form.policySummary} onChange={(e) => setForm({ ...form, policySummary: e.target.value })}/></div></Panel></div><Button variant="contained" onClick={() => onSave(form)}>Save all website content</Button></>; }
function SettingsPanel({ value, onSave }: { value: AdminState["settings"]; onSave: (v: AdminState["settings"]) => void }) { const [form, setForm] = useState(value); return <Panel title="Business settings"><div className="admin-settings-form"><Alert severity={form.verified ? "success" : "warning"}>Only mark these details verified after checking them against an authoritative business source.</Alert><TextField label="Business name" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })}/><TextField label="Business email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}/><TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}/><TextField label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}/><TextField label="Opening hours" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })}/><TextField label="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}/><TextField label="Quote reference prefix" value={form.quotePrefix} onChange={(e) => setForm({ ...form, quotePrefix: e.target.value })}/><TextField select label="Publishing status" value={form.verified ? "verified" : "draft"} onChange={(e) => setForm({ ...form, verified: e.target.value === "verified" })}><MenuItem value="draft">Draft / unverified</MenuItem><MenuItem value="verified">Verified for publishing</MenuItem></TextField><Button variant="contained" onClick={() => onSave(form)}>Save settings</Button></div></Panel>; }
function Notifications({ value, onSave }: { value: AdminState["notifications"]; onSave: (v: AdminState["notifications"]) => void }) { const [templates, setTemplates] = useState(value); const update = (id: string, patch: Partial<AdminState["notifications"][number]>) => setTemplates((all) => all.map((t) => t.id === id ? { ...t, ...patch } : t)); return <><Alert severity="info" className="admin-workflow-note">Templates are preview-only. The backend phase will connect delivery providers, consent, retries and delivery logs.</Alert><div className="notification-list">{templates.map((t) => <Panel key={t.id} title={t.name} action={<label className="admin-switch"><input type="checkbox" checked={t.enabled} onChange={(e) => update(t.id, { enabled: e.target.checked })}/><span/>{t.enabled ? "Enabled" : "Disabled"}</label>}><div className="notification-form"><TextField label="Workflow trigger" value={t.trigger} disabled/><TextField label="Subject" value={t.subject} onChange={(e) => update(t.id, { subject: e.target.value })}/><TextField label="Message" multiline minRows={3} value={t.message} onChange={(e) => update(t.id, { message: e.target.value })}/><small>Available placeholders: {"{{customer}}, {{reference}}, {{product}}"}</small></div></Panel>)}</div><Button variant="contained" onClick={() => onSave(templates)}>Save all templates</Button></>; }
function Reports({ state, quotes }: { state: AdminState; quotes: AdminQuote[] }) { const statuses = ["New", "Reviewing", "Quoted", "Won"] as QuoteStatus[]; const max = Math.max(...statuses.map((s) => quotes.filter((q) => q.status === s).length), 1); return <><div className="admin-stats"><Stat label="Pipeline value" value={fmt.format(quotes.reduce((n, q) => n + (q.value || 0), 0))} note="Across visible requests" icon={CircleDollarSign}/><Stat label="Average quote" value={fmt.format(quotes.reduce((n, q) => n + (q.value || 0), 0) / Math.max(quotes.filter((q) => q.value).length, 1))} note="Estimated value" icon={BarChart3}/><Stat label="Active customers" value={String(state.customers.length)} note="POC directory" icon={Users}/><Stat label="Orders on time" value="92%" note="Demo performance" icon={Gauge}/></div><Panel title="Quote funnel"><div className="bar-chart">{statuses.map((s) => { const count = quotes.filter((q) => q.status === s).length; return <div key={s}><span>{s}</span><div><i style={{ width: `${Math.max(8, count / max * 100)}%` }}/></div><strong>{count}</strong></div>; })}</div></Panel></>; }
function Roadmap() { const phases = [{ n: "01", title: "Static proof of concept", state: "Complete", items: ["Responsive customer storefront", "Catalog, filters and product pages", "Guided quotation journey", "Local admin operations workspace"] }, { n: "02", title: "Content and workflow refinement", state: "Now", items: ["Admin content reflected on storefront", "Quote-to-order workflow agreed", "Notification templates prepared", "Business data awaiting confirmation"] }, { n: "03", title: "Backend foundation", state: "Planned", items: ["Admin authentication and roles", "Database and secure file storage", "Catalog and content APIs", "Customer and order history"] }, { n: "04", title: "Operations and launch", state: "Planned", items: ["Email/SMS notifications", "Payments and delivery integration", "Analytics and audit logs", "Production deployment and monitoring"] }]; return <div className="roadmap"><div className="roadmap-intro"><h2>Build the complete journey first, then connect it.</h2><p>This POC makes every important screen and operating decision visible before backend work begins.</p></div>{phases.map((p) => <article key={p.n}><span>{p.n}</span><div><div className="row-between"><h3>{p.title}</h3><Status value={p.state}/></div><ul>{p.items.map((i) => <li key={i}>{i}</li>)}</ul></div></article>)}</div>; }
function Empty({ text }: { text: string }) { return <div className="admin-empty"><RefreshCw/><p>{text}</p></div>; }
