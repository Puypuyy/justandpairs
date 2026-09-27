import { formatSize } from "../api";
import { Alert, Button } from "@mui/material";
import { ArrowRight } from "lucide-react";
import type { Configuration, Product } from "../api";
import { money } from "../utils/formatting";
import type { ApiResult } from "../api/react";
import type { PriceEstimate } from "../api";
export default function Estimate({
  product,
  config,
  pricing,
  onRequest,
  onSave,
}: {
  product: Product;
  config: Configuration;
  pricing: ApiResult<PriceEstimate | null>;
  onRequest?: () => void;
  onSave?: () => void;
}) {
  const estimate = pricing.data;
  return (
    <div className="estimate">
      <span className="eyebrow">YOUR ESTIMATE</span>
      {pricing.loading && <p role="status">Updating your estimate…</p>}
      {pricing.error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={pricing.retry}>
              Retry
            </Button>
          }
        >
          Your estimate is temporarily unavailable.
        </Alert>
      )}
      <h3>{product.name}</h3>
      <p>
        {formatSize(config.size)} · {config.finish}
        <br />
        {config.quantity || "—"} {config.quantity === 1 ? "piece" : "pieces"}
      </p>
      <div className="estimate-line">
        <span>Estimated total</span>
        <strong aria-live="polite">
          {estimate ? money(estimate.total) : "—"}
        </strong>
      </div>
      <div className="estimate-line">
        <span>Estimated 50% deposit</span>
        <b>{estimate ? money(estimate.deposit) : "—"}</b>
      </div>
      <p className="fine-print">
        Sample pricing only. Final pricing will be confirmed in your quotation.
        A 50% deposit is due after quotation approval.
      </p>
      {onRequest && (
        <Button
          fullWidth
          variant="contained"
          onClick={onRequest}
          endIcon={<ArrowRight size={18} />}
        >
          Request This Order
        </Button>
      )}
      {onSave && (
        <Button fullWidth onClick={onSave}>
          Save for Later
        </Button>
      )}
    </div>
  );
}
