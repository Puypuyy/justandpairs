import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Tab,
  Tabs,
  TextField,
} from "@mui/material";
import { ExternalLink, FileText, Plus, Printer, X } from "lucide-react";
import type { RfqRecord } from "../api";

type Quote = {
  id: string; reference: string; customer: string; email: string; product: string;
  quantity: number; due: string; value: number | null;
  status: "New" | "Reviewing" | "Quoted" | "Won" | "Declined";
  createdAt: string; internalNotes?: string; depositPercent?: number; validityDays?: number;
};
type Order = {
  id: string; customer: string; item: string; total: number; due: string;
  status: "Awaiting artwork" | "Design approval" | "In production" | "Ready" | "Completed";
  paymentStatus?: "Unpaid" | "Deposit paid" | "Paid";
  fulfillment?: "Pickup" | "Courier Delivery";
  checklist?: { label: string; done: boolean }[];
  revisions?: { label: string; date: string; status: string }[];
  notes?: string;
};
const money = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

function findRecord(id: string) {
  try {
    const state = JSON.parse(localStorage.getItem("jp_rfq_state_v1") || "{}") as { records?: RfqRecord[] };
    return state.records?.find((record) => record.id === id) || null;
  } catch { return null; }
}

export function QuoteWorkspace({ quote, onClose, onSave }: { quote: Quote | null; onClose: () => void; onSave: (quote: Quote) => void }) {
  const [draft, setDraft] = useState<Quote | null>(quote);
  const [tab, setTab] = useState(0);
  useEffect(() => { setDraft(quote); setTab(0); }, [quote]);
  const record = useMemo(() => quote ? findRecord(quote.id) : null, [quote]);
  if (!draft) return null;
  const details = record?.draft;
  return <Dialog open onClose={onClose} fullWidth maxWidth="lg" className="workspace-dialog">
    <DialogTitle className="row-between"><div><small>QUOTE WORKSPACE</small><h2>{draft.reference}</h2></div><IconButton aria-label="Close quote workspace" onClick={onClose}><X/></IconButton></DialogTitle>
    <DialogContent>
      <div className="workspace-summary"><div><span>Customer</span><strong>{draft.customer}</strong><small>{draft.email}</small></div><div><span>Requirement</span><strong>{draft.product}</strong><small>Quantity {draft.quantity}</small></div><div><span>Deadline</span><strong>{draft.due}</strong><small>{details?.deadline.rush ? "Rush requested" : "Standard timing"}</small></div><div><span>Status</span><strong>{draft.status}</strong><small>Created {draft.createdAt}</small></div></div>
      <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable"><Tab label="Request details"/><Tab label="Build quotation"/><Tab label="Internal notes"/><Tab label="Customer preview"/></Tabs>
      {tab === 0 && <div className="workspace-pane">{details ? <div className="detail-columns"><Detail title="Customer & organization" rows={[["Name", details.contact.name], ["Email", details.contact.email], ["Mobile", details.contact.mobile], ["Organization", details.contact.organization || "—"]]}/><Detail title="Specifications" rows={[["Product", draft.product], ["Size", details.details.size ? `${details.details.size} cm` : details.details.requestedSize || "To confirm"], ["Finish", details.details.finish || details.details.requestedFinish || "To confirm"], ["Quantity", String(details.quantity)], ["Inscription", details.details.message || "—"]]}/><Detail title="Delivery" rows={[["Method", details.delivery.method], ["Recipient", details.delivery.recipient || details.contact.name], ["Address", [details.delivery.address, details.delivery.city, details.delivery.province].filter(Boolean).join(", ") || "Pickup"], ["Notes", details.delivery.notes || "—"]]}/><Detail title="Artwork" rows={[["Support", details.artwork.choice], ["Brief", details.artwork.idea || "—"], ["Files", details.artwork.files.map((f) => f.name).join(", ") || "None"]]}/></div> : <Alert severity="info">This seeded demonstration request has summary data only. Customer-submitted requests show their complete specifications, contact, delivery and artwork metadata here.</Alert>}</div>}
      {tab === 1 && <div className="workspace-pane quote-builder"><Alert severity="warning">Amounts are a local quotation preview and are not sent to the customer.</Alert><div className="admin-form-row"><TextField label="Quoted total" type="number" value={draft.value ?? ""} onChange={(e) => setDraft({ ...draft, value: e.target.value ? Number(e.target.value) : null })}/><TextField label="Deposit percentage" type="number" value={draft.depositPercent ?? 50} onChange={(e) => setDraft({ ...draft, depositPercent: Number(e.target.value) })}/><TextField label="Validity (days)" type="number" value={draft.validityDays ?? 14} onChange={(e) => setDraft({ ...draft, validityDays: Number(e.target.value) })}/><TextField select label="Quotation status" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Quote["status"] })}>{["New", "Reviewing", "Quoted", "Won", "Declined"].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></div><div className="quote-total"><span>Customer total</span><strong>{draft.value ? money.format(draft.value) : "To be confirmed"}</strong><small>{draft.value ? `${draft.depositPercent ?? 50}% deposit: ${money.format(draft.value * (draft.depositPercent ?? 50) / 100)}` : "Enter the confirmed quotation amount."}</small></div></div>}
      {tab === 2 && <div className="workspace-pane"><TextField label="Private internal notes" multiline minRows={8} value={draft.internalNotes || ""} onChange={(e) => setDraft({ ...draft, internalNotes: e.target.value })} helperText="Visible only in the future authenticated admin workspace."/></div>}
      {tab === 3 && <div className="workspace-pane"><div className="customer-document"><span>JUST AND PAIRS · QUOTATION PREVIEW</span><h2>{draft.product}</h2><p>Prepared for <strong>{draft.customer}</strong></p><div><span>Reference</span><strong>{draft.reference}</strong></div><div><span>Quantity</span><strong>{draft.quantity}</strong></div><div><span>Requested date</span><strong>{draft.due}</strong></div><div><span>Total</span><strong>{draft.value ? money.format(draft.value) : "To be confirmed"}</strong></div><small>This preview is not a binding quotation until issued through an authorized channel.</small></div><Button component={Link} to={`/quotation/${draft.id}`} target="_blank" endIcon={<ExternalLink size={16}/>}>Open customer view</Button></div>}
    </DialogContent>
    <DialogActions><Button onClick={onClose}>Cancel</Button><Button variant="contained" onClick={() => onSave(draft)}>Save quotation</Button></DialogActions>
  </Dialog>;
}

const defaultChecklist = ["Requirements confirmed", "Artwork received", "Design approved", "Materials prepared", "Production complete", "Quality checked", "Packed for release"].map((label) => ({ label, done: false }));
export function OrderWorkspace({ order, onClose, onSave }: { order: Order | null; onClose: () => void; onSave: (order: Order) => void }) {
  const [draft, setDraft] = useState<Order | null>(order);
  const [revision, setRevision] = useState("");
  useEffect(() => setDraft(order ? { ...order, checklist: order.checklist || defaultChecklist, revisions: order.revisions || [{ label: "Initial design proof", date: new Date().toISOString().slice(0, 10), status: "Awaiting review" }] } : null), [order]);
  if (!draft) return null;
  return <Dialog open onClose={onClose} fullWidth maxWidth="lg" className="workspace-dialog print-job-sheet">
    <DialogTitle className="row-between"><div><small>ORDER WORKSPACE</small><h2>{draft.id}</h2></div><div><IconButton aria-label="Print job sheet" onClick={() => window.print()}><Printer/></IconButton><IconButton aria-label="Close order workspace" onClick={onClose}><X/></IconButton></div></DialogTitle>
    <DialogContent><div className="workspace-summary"><div><span>Customer</span><strong>{draft.customer}</strong></div><div><span>Order</span><strong>{draft.item}</strong></div><div><span>Due</span><strong>{draft.due}</strong></div><div><span>Total</span><strong>{money.format(draft.total)}</strong></div></div>
      <div className="order-detail-grid"><section><h3>Production checklist</h3>{draft.checklist?.map((item, index) => <FormControlLabel key={item.label} control={<Checkbox checked={item.done} onChange={(e) => setDraft({ ...draft, checklist: draft.checklist?.map((x, i) => i === index ? { ...x, done: e.target.checked } : x) })}/>} label={item.label}/>)}</section><section><h3>Order controls</h3><TextField select label="Production stage" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Order["status"] })}>{["Awaiting artwork", "Design approval", "In production", "Ready", "Completed"].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField><TextField select label="Payment status" value={draft.paymentStatus || "Unpaid"} onChange={(e) => setDraft({ ...draft, paymentStatus: e.target.value as Order["paymentStatus"] })}>{["Unpaid", "Deposit paid", "Paid"].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField><TextField select label="Fulfillment" value={draft.fulfillment || "Pickup"} onChange={(e) => setDraft({ ...draft, fulfillment: e.target.value as Order["fulfillment"] })}><MenuItem value="Pickup">Pickup</MenuItem><MenuItem value="Courier Delivery">Courier delivery</MenuItem></TextField><TextField label="Production / release notes" multiline minRows={4} value={draft.notes || ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })}/></section><section className="revision-panel"><h3>Design revisions & approval</h3>{draft.revisions?.map((item) => <div className="revision-item" key={`${item.date}-${item.label}`}><FileText size={17}/><div><strong>{item.label}</strong><small>{item.date} · {item.status}</small></div></div>)}<div className="revision-add"><TextField label="Revision note" value={revision} onChange={(e) => setRevision(e.target.value)}/><Button startIcon={<Plus size={16}/>} disabled={!revision.trim()} onClick={() => { setDraft({ ...draft, revisions: [...(draft.revisions || []), { label: revision, date: new Date().toISOString().slice(0, 10), status: "Awaiting review" }] }); setRevision(""); }}>Add</Button></div><Button component={Link} to={`/design-approval/${encodeURIComponent(draft.id)}`} target="_blank" endIcon={<ExternalLink size={16}/>}>Customer approval preview</Button></section></div>
    </DialogContent><DialogActions><Button onClick={() => window.print()} startIcon={<Printer size={16}/>}>Print job sheet</Button><Button onClick={onClose}>Cancel</Button><Button variant="contained" onClick={() => onSave(draft)}>Save order</Button></DialogActions>
  </Dialog>;
}

function Detail({ title, rows }: { title: string; rows: [string, string][] }) { return <section className="workspace-detail"><h3>{title}</h3><dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>; }
