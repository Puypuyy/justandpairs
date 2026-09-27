import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  Snackbar,
  TextField,
} from "@mui/material";
import {
  Check,
  ChevronDown,
  Minus,
  Plus,
  Upload,
  X,
  FileText,
  CheckCircle2,
  Ruler,
  Sparkles,
  Palette,
} from "lucide-react";
import type { Configuration, Product } from "../types/catalog";
import { finishes, occasions, products, sizeGuidance } from "../data/catalog";
import {
  Breadcrumb,
  ProductCard,
  SectionHeading,
  Action,
} from "../components/common";
import Estimate from "../components/Estimate";
import {
  localDate,
  readConfiguration,
  saveConfiguration,
  validateConfiguration,
} from "../utils/configuration";
import { estimatePrice, money } from "../utils/pricing";
export default function ProductDetail({ product }: { product: Product }) {
  const [config, setConfig] = useState<Configuration>(() =>
    readConfiguration(product),
  );
  const [view, setView] = useState("Front view");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState("");
  const [fileError, setFileError] = useState("");
  const [reading, setReading] = useState(false);
  const navigate = useNavigate();
  const estimate = estimatePrice(product, config);
  const configurable = product.type === "configurable";
  useEffect(() => {
    try {
      saveConfiguration(config);
    } catch {
      setToast(
        "Your design is available while this page stays open. Browser storage is full.",
      );
    }
  }, [config]);
  function update<K extends keyof Configuration>(
    key: K,
    value: Configuration[K],
  ) {
    setConfig((c) => ({ ...c, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }
  function request() {
    if (!configurable) {
      navigate(`/request-quote?product=${product.slug}`);
      return;
    }
    const next = validateConfiguration(config);
    setErrors(next);
    if (Object.keys(next).length) {
      document
        .getElementById(
          next.quantity ? "quantity" : next.file ? "design-upload" : "deadline",
        )
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (reading) return;
    try {
      saveConfiguration(config);
      navigate("/request-quote", { state: { config } });
    } catch {
      navigate("/request-quote", { state: { config } });
    }
  }
  async function chooseFile(file?: File) {
    if (!file) return;
    setFileError("");
    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
      setFileError("Choose a JPG, PNG or PDF file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFileError("Choose a file under 2 MB for this local preview.");
      return;
    }
    setReading(true);
    const reader = new FileReader();
    reader.onload = () => {
      update("file", {
        name: file.name,
        type: file.type,
        size: file.size,
        data: String(reader.result),
      });
      setErrors((e) => ({ ...e, file: "" }));
      setReading(false);
    };
    reader.onerror = () => {
      setFileError("We could not read that file. Please choose it again.");
      setReading(false);
    };
    reader.readAsDataURL(file);
  }
  const days = config.deadline
    ? (new Date(`${config.deadline}T12:00:00`).getTime() -
        new Date(`${localDate()}T12:00:00`).getTime()) /
      86400000
    : Infinity;
  return (
    <div
      className={`container detail-page ${configurable ? "has-mobile-cta" : ""}`}
    >
      <Breadcrumb
        current={product.name}
        parent="Awards & Plaques"
        parentTo="/awards-plaques"
      />
      <div className="detail-layout">
        <div className="gallery-column">
          <div className="gallery-sticky">
            <div
              className={`gallery-main view-${view.toLowerCase().split(" ")[0]}`}
            >
              {view === "Front view" ? (
                <img
                  src={product.image}
                  alt={`Illustrative concept for ${product.name}`}
                />
              ) : (
                <div className="gallery-placeholder">
                  <Ruler size={40} />
                  <h3>{view}</h3>
                  <p>
                    {view === "Size reference"
                      ? `${config.size} × ${config.size} inches selected. Dimensions are illustrative.`
                      : "Detailed product photography will be added here."}
                  </p>
                </div>
              )}
              <span className="image-label">
                Illustrative concept · Final design may vary
              </span>
            </div>
            <div
              className="gallery-thumbnails"
              aria-label="Product image views"
            >
              {[
                "Front view",
                "Angled view",
                "Glass detail",
                "Customized example",
                "Size reference",
              ].map((v) => (
                <button
                  key={v}
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={view === v ? "selected" : ""}
                >
                  {v === "Front view" ? (
                    <img src={product.image} alt="Front concept" />
                  ) : (
                    <Ruler size={24} />
                  )}
                  <span>{v}</span>
                </button>
              ))}
            </div>
            <p className="fine-print">
              A starting point for your own recognition piece. Product
              photography and specifications will be confirmed with your quote.
            </p>
            {configurable && (
              <div className="desktop-estimate">
                <Estimate
                  product={product}
                  config={config}
                  onRequest={request}
                />
              </div>
            )}
          </div>
        </div>
        <div className="configuration">
          <span className="eyebrow">
            {product.category === "plaques"
              ? "GLASS PLAQUE"
              : product.category.replaceAll("-", " ").toUpperCase()}
          </span>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <div className="product-highlights">
            {[
              [Sparkles, "Customizable Design"],
              [Ruler, "Multiple Sizes"],
              [Palette, "Digital or Etched Finish"],
              [CheckCircle2, "Design Approval Included"],
            ]
              .slice(0, configurable ? 4 : 1)
              .map(([Icon, label]) => {
                const I = Icon as typeof Sparkles;
                return (
                  <span key={String(label)}>
                    <I size={17} />
                    {String(label)}
                  </span>
                );
              })}
          </div>
          <div className="starting-price">
            {product.basePrice ? (
              <>
                Starting from <strong>{money(product.basePrice)}</strong>
                <small>
                  Your estimate updates as you choose your options.
                  <br />
                  Final pricing will be confirmed in your quotation.
                </small>
              </>
            ) : (
              <>
                <strong>Made for your requirements.</strong>
                <small>
                  Share your preferred sizes, quantities and design in the next
                  customer phase.
                </small>
              </>
            )}
          </div>
          {configurable ? (
            <>
              <section className="config-section">
                <h2>
                  <span>01</span>Choose your size
                </h2>
                <div className="size-options">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      className={
                        config.size === size ? "option selected" : "option"
                      }
                      aria-pressed={config.size === size}
                      onClick={() => update("size", size)}
                    >
                      {size} × {size}
                      {config.size === size && <Check size={13} />}
                    </button>
                  ))}
                </div>
                <p className="option-guidance">
                  {config.size} × {config.size} inches —{" "}
                  {sizeGuidance[config.size]}
                </p>
              </section>
              <section className="config-section">
                <h2>
                  <span>02</span>Choose your finish
                </h2>
                <div className="finish-options">
                  {finishes.map((f, i) => (
                    <button
                      className={
                        config.finish === f.name
                          ? "option finish-option selected"
                          : "option finish-option"
                      }
                      aria-pressed={config.finish === f.name}
                      key={f.name}
                      onClick={() => update("finish", f.name)}
                    >
                      <span className={`finish-swatch swatch-${i}`}>
                        <Palette size={21} />
                      </span>
                      <span>
                        <strong>{f.name}</strong>
                        <small>{f.description}</small>
                      </span>
                      {config.finish === f.name && <Check size={17} />}
                    </button>
                  ))}
                </div>
              </section>
              <section className="config-section" id="quantity">
                <h2>
                  <span>03</span>How many do you need?
                </h2>
                <div className="quantity">
                  <IconButton
                    aria-label="Decrease quantity"
                    disabled={config.quantity <= 1}
                    onClick={() =>
                      update("quantity", Math.max(1, config.quantity - 1))
                    }
                  >
                    <Minus size={18} />
                  </IconButton>
                  <input
                    aria-label="Quantity"
                    type="number"
                    min={1}
                    max={9999}
                    value={config.quantity || ""}
                    onChange={(e) => update("quantity", Number(e.target.value))}
                  />
                  <IconButton
                    aria-label="Increase quantity"
                    disabled={config.quantity >= 9999}
                    onClick={() =>
                      update("quantity", Math.min(9999, config.quantity + 1))
                    }
                  >
                    <Plus size={18} />
                  </IconButton>
                </div>
                {errors.quantity && (
                  <p className="field-error" role="alert">
                    {errors.quantity}
                  </p>
                )}
                <p className="option-guidance">
                  Ordering for a team or event? Quantity pricing may apply.
                  We'll confirm any volume rates in your quotation.
                </p>
              </section>
              <section className="config-section" id="personalization">
                <h2>
                  <span>04</span>Make it yours
                </h2>
                <p className="option-guidance">
                  What would you like on the plaque? These details are optional.
                </p>
                <div className="personalization-fields">
                  {(
                    [
                      ["title", "Award / Recognition Title"],
                      ["recipient", "Recipient Name"],
                      ["organization", "Organization"],
                      ["event", "Event / Date"],
                    ] as const
                  ).map(([key, label]) => (
                    <TextField
                      key={key}
                      label={label}
                      value={config[key]}
                      onChange={(e) => update(key, e.target.value)}
                      inputProps={{ maxLength: 150 }}
                    />
                  ))}
                  <TextField
                    className="span-two"
                    label="Message"
                    multiline
                    minRows={3}
                    value={config.message}
                    onChange={(e) => update("message", e.target.value)}
                    inputProps={{ maxLength: 2000 }}
                  />
                </div>
                <h3 className="design-heading">
                  Do you already have a design?
                </h3>
                <div className="design-options">
                  {(
                    [
                      ["upload", "I already have a design"],
                      ["help", "I need help with the design"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      className={`option ${config.design === value ? "selected" : ""}`}
                      aria-pressed={config.design === value}
                      onClick={() => update("design", value)}
                    >
                      {config.design === value && <Check size={16} />} {label}
                    </button>
                  ))}
                </div>
                {config.design === "help" ? (
                  <TextField
                    label="Describe your idea"
                    multiline
                    minRows={3}
                    value={config.idea}
                    onChange={(e) => update("idea", e.target.value)}
                    helperText="We'll prepare a design for your approval."
                    inputProps={{ maxLength: 2000 }}
                  />
                ) : (
                  <div
                    id="design-upload"
                    className="upload-area"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      void chooseFile(e.dataTransfer.files[0]);
                    }}
                  >
                    {config.file ? (
                      <div className="uploaded-file">
                        {config.file.type.startsWith("image/") ? (
                          <img
                            src={config.file.data}
                            alt="Your selected design preview"
                          />
                        ) : (
                          <FileText size={32} />
                        )}
                        <div>
                          <strong>{config.file.name}</strong>
                          <small>
                            {Math.round(config.file.size / 1024)} KB · Stored in
                            this browser session only
                          </small>
                        </div>
                        <IconButton
                          aria-label="Remove design"
                          onClick={() => update("file", undefined)}
                        >
                          <X size={18} />
                        </IconButton>
                      </div>
                    ) : (
                      <>
                        <Upload size={28} />
                        <h3>Upload your design</h3>
                        <p>Drag a file here or choose a file</p>
                      </>
                    )}
                    <Button
                      component="label"
                      variant="outlined"
                      disabled={reading}
                    >
                      {reading
                        ? "Reading design…"
                        : config.file
                          ? "Replace design"
                          : "Choose a file"}
                      <input
                        hidden
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        onChange={(e) => {
                          void chooseFile(e.target.files?.[0]);
                          e.target.value = "";
                        }}
                      />
                    </Button>
                    <small>
                      JPG · PNG · PDF · Up to 2 MB · Local preview only
                    </small>
                    {(fileError || errors.file) && (
                      <p className="field-error" role="alert">
                        {fileError || errors.file}
                      </p>
                    )}
                  </div>
                )}
              </section>
              <section className="config-section" id="deadline">
                <h2>
                  <span>05</span>When do you need it?
                </h2>
                <TextField
                  required
                  label="Requested completion date"
                  type="date"
                  value={config.deadline}
                  onChange={(e) => update("deadline", e.target.value)}
                  slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: { min: localDate() },
                  }}
                  error={!!errors.deadline}
                  helperText={
                    errors.deadline ||
                    "We'll confirm your requested completion date when we review your order."
                  }
                />
                {days >= 0 && days <= 7 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Rush production may be available depending on the design,
                    quantity and materials.
                  </Alert>
                )}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={config.rush}
                      onChange={(e) => update("rush", e.target.checked)}
                    />
                  }
                  label="Check rush availability"
                />
              </section>
              <section className="config-section">
                <h2>
                  <span>06</span>How would you like to receive it?
                </h2>
                <div className="design-options">
                  {(["Pickup", "Courier Delivery"] as const).map((d) => (
                    <button
                      key={d}
                      className={`option ${config.delivery === d ? "selected" : ""}`}
                      aria-pressed={config.delivery === d}
                      onClick={() => update("delivery", d)}
                    >
                      {config.delivery === d && <Check size={16} />} {d}
                    </button>
                  ))}
                </div>
                <p className="option-guidance">
                  {config.delivery === "Pickup"
                    ? "Collect your completed order from Just and Pairs."
                    : "Have your order released through your preferred courier."}{" "}
                  Courier fees are shouldered by the customer.
                </p>
              </section>
              <Estimate
                product={product}
                config={config}
                onRequest={request}
                onSave={() => {
                  try {
                    saveConfiguration(config);
                    setToast(
                      "Your choices are saved for this browser session.",
                    );
                  } catch {
                    setToast(
                      "Browser storage is full. Your choices remain on this page.",
                    );
                  }
                }}
              />
              <Link to="/help" className="help-link">
                Need help choosing? Explore our help guide.
              </Link>
            </>
          ) : (
            <Action to={`/request-quote?product=${product.slug}`}>
              Request a Quote
            </Action>
          )}
        </div>
      </div>
      <section className="section">
        <SectionHeading title="The details, thoughtfully considered." />
        <div className="details-accordions">
          {[
            [
              "Product Details",
              `A made-to-order ${product.name.toLowerCase()}. Materials, construction and final dimensions are confirmed with your quotation.`,
            ],
            [
              "Customization",
              "Personalize the design with your logo, award title, recipient names, message and selected color accents.",
            ],
            [
              "Files & Artwork",
              "JPG, PNG and PDF are supported in this local preview. Use the clearest original file available. Design assistance is available if you need a hand.",
            ],
            [
              "Production & Lead Time",
              "Production starts after quotation acceptance, the required deposit and design approval. Timing and rush availability are confirmed for each request.",
            ],
            [
              "Pickup & Delivery",
              "Arrange pickup or your preferred courier once your order is ready. Courier fees are shouldered by the customer.",
            ],
            [
              "Care",
              "Handle glass pieces carefully with both hands. Clean gently with a soft microfiber cloth and avoid abrasive cleaners.",
            ],
          ].map(([title, text]) => (
            <Accordion key={title} elevation={0} disableGutters>
              <AccordionSummary expandIcon={<ChevronDown size={18} />}>
                <h3>{title}</h3>
              </AccordionSummary>
              <AccordionDetails>
                <p>{text}</p>
              </AccordionDetails>
            </Accordion>
          ))}
        </div>
      </section>
      <section className="next-steps">
        <h2>What happens after you send your request?</h2>
        <p>
          Once quote requests are available, we review your details, confirm
          your quotation, and prepare a design for your approval. Production
          follows your approval and deposit, with a quality check before
          release.
        </p>
      </section>
      <section className="section">
        <SectionHeading title="Made for moments like these." />
        <div className="occasion-links">
          {occasions.slice(0, 4).map((o) => (
            <Link key={o.slug} to={`/occasions/${o.slug}`}>
              {o.name} →
            </Link>
          ))}
        </div>
      </section>
      <section className="section related">
        <SectionHeading title="You may also like" />
        <div className="product-grid">
          {products
            .filter((p) => p.id !== product.id)
            .slice(0, 4)
            .map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
        </div>
      </section>
      {configurable && (
        <div className="mobile-product-cta">
          <div>
            <small>Estimated total</small>
            <strong>
              {estimate ? money(estimate.total) : "Choose options"}
            </strong>
          </div>
          <Button variant="contained" onClick={request}>
            Request Quote
          </Button>
        </div>
      )}
      <Snackbar
        open={!!toast}
        message={toast}
        autoHideDuration={6000}
        onClose={() => setToast("")}
      />
    </div>
  );
}
