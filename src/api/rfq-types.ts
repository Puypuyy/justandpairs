import type { Configuration, Product } from "./types.ts";
import type { PriceEstimate, RequestOptions } from "./contracts.ts";

export type RfqFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string;
};
export type RfqDetails = {
  size: number | null;
  finish: string;
  requestedSize: string;
  requestedFinish: string;
  title: string;
  recipient: string;
  organization: string;
  event: string;
  message: string;
  description: string;
};
export type RfqDraft = {
  schemaVersion: 1;
  id: string;
  sourceKey: string;
  revision: number;
  updatedAt: string;
  step: number;
  selection: "" | "catalog" | "custom";
  productId: string | null;
  variantId: string;
  details: RfqDetails;
  quantity: number;
  // Extension point for merchandise size/color breakdowns; no invented options in this MVP.
  quantityBreakdown?: { label: string; quantity: number }[];
  artwork: {
    choice: "help" | "design" | "reference";
    idea: string;
    files: RfqFile[];
  };
  deadline: { date: string; flexible: boolean; rush: boolean };
  delivery: {
    method: "Pickup" | "Courier Delivery";
    recipient: string;
    address: string;
    city: string;
    province: string;
    notes: string;
  };
  contact: {
    name: string;
    mobile: string;
    email: string;
    organization: string;
  };
  acknowledged: boolean;
};
export type RfqEntry = {
  productId?: string;
  variantId?: string;
  configuration?: Configuration;
  mode?: "custom" | "bulk";
  sourceKey?: string;
};
export type RfqRecord = {
  id: string;
  reference: string;
  status: "LOCAL_DEMO";
  createdAt: string;
  draft: RfqDraft;
  productSnapshot: Product | null;
  estimate: PriceEstimate | null;
};
export type RfqPolicy = {
  maxFiles: number;
  maxFileBytes: number;
  maxTotalBytes: number;
  mimeTypes: string[];
};
export interface RfqApi {
  getPolicy(options?: RequestOptions): Promise<RfqPolicy>;
  openDraft(entry?: RfqEntry, options?: RequestOptions): Promise<RfqDraft>;
  saveDraft(draft: RfqDraft, options?: RequestOptions): Promise<RfqDraft>;
  discardDraft(options?: RequestOptions): Promise<void>;
  submit(draft: RfqDraft, options?: RequestOptions): Promise<RfqRecord>;
  getRecord(id: string, options?: RequestOptions): Promise<RfqRecord>;
}
