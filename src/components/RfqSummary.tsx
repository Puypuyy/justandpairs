import { Button } from "@mui/material";
import type { Product, RfqDraft, PriceEstimate } from "../api";
import { formatSize } from "../api";
import { money } from "../utils/formatting";

export default function RfqSummary({
  draft: d,
  product,
  estimate,
  onEdit,
}: {
  draft: RfqDraft;
  product?: Product | null;
  estimate?: PriceEstimate | null;
  onEdit?: (step: number) => void;
}) {
  const details = d.details;
  const groups: { title: string; step: number; rows: [string, string][] }[] = [
    {
      title: "Product",
      step: 0,
      rows: [
        [
          "Product",
          product?.name ??
            (d.selection === "custom"
              ? "Something Custom"
              : "Product unavailable"),
        ],
        [
          "Design option",
          product?.variants?.find((v) => v.id === d.variantId)?.name ?? "",
        ],
      ],
    },
    {
      title: "Specifications",
      step: 1,
      rows: [
        [
          "Size",
          details.size
            ? formatSize(details.size)
            : details.requestedSize || "To be confirmed",
        ],
        [
          "Finish",
          details.finish || details.requestedFinish || "To be confirmed",
        ],
        ["Your request", details.description],
        ["Recognition title", details.title],
        ["Recipient", details.recipient],
        ["Organization", details.organization],
        ["Event / Date", details.event],
        ["Message", details.message],
      ],
    },
    { title: "Quantity", step: 2, rows: [["Pieces", String(d.quantity)]] },
    {
      title: "Artwork",
      step: 3,
      rows: [
        [
          "Design",
          d.artwork.choice === "design"
            ? "I already have my design"
            : d.artwork.choice === "reference"
              ? "I have a reference or idea"
              : "I need help with the design",
        ],
        ["Idea", d.artwork.idea],
        [
          "Local files",
          d.artwork.files.map((f) => f.name).join(", ") || "No files selected",
        ],
      ],
    },
    {
      title: "Deadline",
      step: 4,
      rows: [
        [
          "Requested date",
          d.deadline.flexible
            ? "Flexible date"
            : d.deadline.date || "Not selected",
        ],
        [
          "Rush availability",
          d.deadline.rush ? "Please check — not guaranteed" : "Not requested",
        ],
      ],
    },
    {
      title: "Delivery & Contact",
      step: 5,
      rows: [
        ["Receive by", d.delivery.method],
        ...(d.delivery.method === "Courier Delivery"
          ? ([
              ["Delivery recipient", d.delivery.recipient],
              [
                "Address",
                [d.delivery.address, d.delivery.city, d.delivery.province]
                  .filter(Boolean)
                  .join(", "),
              ],
              ["Delivery notes", d.delivery.notes],
            ] as [string, string][])
          : []),
        ["Full name", d.contact.name],
        ["Mobile", d.contact.mobile],
        ["Email", d.contact.email],
        ["Organization", d.contact.organization],
      ],
    },
  ];
  return (
    <div className="rfq-review">
      {groups.map((g) => (
        <section className="rfq-review-section" key={g.title}>
          <div className="row-between">
            <h3>{g.title}</h3>
            {onEdit && (
              <Button
                onClick={() => onEdit(g.step)}
                aria-label={`Edit ${g.title}`}
              >
                Edit
              </Button>
            )}
          </div>
          <dl>
            {g.rows
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
          </dl>
        </section>
      ))}
      <section className="rfq-review-section">
        <h3>Estimated pricing</h3>
        {estimate ? (
          <>
            <strong>{money(estimate.total)}</strong>
            <p>
              {money(estimate.unit)} per piece. Illustrative estimate only;
              final pricing requires a quotation.
            </p>
          </>
        ) : (
          <p>
            Pricing will be confirmed after your requirements are reviewed. No
            confirmed price is available.
          </p>
        )}
        <p className="fine-print">
          This request does not start production or require payment. Online
          submission is not connected to Just and Pairs.
        </p>
      </section>
    </div>
  );
}
