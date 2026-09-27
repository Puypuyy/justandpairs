import { Button } from "@mui/material";
import { ArrowRight } from "lucide-react";
import type { Configuration, Product } from "../types/catalog";
import { estimatePrice, money } from "../utils/pricing";
export default function Estimate({
  product,
  config,
  onRequest,
  onSave,
}: {
  product: Product;
  config: Configuration;
  onRequest?: () => void;
  onSave?: () => void;
}) {
  const estimate = estimatePrice(product, config);
  return (
    <div className="estimate">
      <span className="eyebrow">YOUR ESTIMATE</span>
      <h3>{product.name}</h3>
      <p>
        {config.size} × {config.size} inches · {config.finish}
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
