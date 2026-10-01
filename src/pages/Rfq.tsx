import { useCallback, useMemo, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { createId } from "../utils/id";
import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  TextField,
} from "@mui/material";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import {
  ApiError,
  formatSize,
  type Configuration,
  type RfqDraft,
  type RfqEntry,
  type RfqFile,
  type RfqPolicy,
} from "../api";
import {
  useApi,
  usePriceEstimate,
  useRequest,
  useSiteData,
} from "../api/react";
import { useRfqAutosave } from "../api/useRfqAutosave";
import {
  firstInvalidRfqStep,
  nextRfqStep,
  rfqSteps,
  selectRfqProduct,
  todayLocal,
  validateRfq,
} from "../domain/rfq";
import { readConfiguration } from "../utils/configuration";
import { money } from "../utils/formatting";
import { Breadcrumb } from "../components/common";
import RfqSummary from "../components/RfqSummary";
import "./rfq.css";

export default function Rfq() {
  const api = useApi();
  const { products } = useSiteData();
  const location = useLocation();
  const [params] = useSearchParams();
  const product = products.find((p) => p.slug === params.get("product"));
  const incoming = location.state?.config as Configuration | undefined;
  const mode = params.get("mode");
  const entry = useMemo<RfqEntry>(() => {
    const selected =
      product ?? products.find((p) => p.id === incoming?.productId);
    // Only apply configuration from router state. Session-storage fallback on every
    // open was re-handing off after refresh and overwriting in-progress RFQ drafts.
    const routerHandoff = !!(location.state?.config || location.state?.rfqEntryId);
    const variantId =
      params.get("variant") || location.state?.variantId || undefined;
    const stableKey = selected
      ? `product:${selected.id}:${variantId || ""}`
      : mode === "custom" || mode === "bulk"
        ? `mode:${mode}`
        : undefined;
    return {
      productId: selected?.id,
      variantId,
      configuration: incoming,
      mode: mode === "custom" || mode === "bulk" ? mode : undefined,
      sourceKey: routerHandoff
        ? String(location.state?.rfqEntryId || `handoff:${stableKey}`)
        : stableKey,
    };
  }, [product, products, incoming, params, mode, location.state]);
  const key = JSON.stringify(entry);
  const load = useCallback(
    (signal: AbortSignal) =>
      Promise.all([
        api.rfq.openDraft(JSON.parse(key), { signal }),
        api.rfq.getPolicy({ signal }),
      ]),
    [api, key],
  );
  const result = useRequest(load);
  if (params.get("product") && !product)
    return (
      <div className="container section">
        <Alert severity="warning">
          This product is no longer in the catalog.
        </Alert>
        <Button component={Link} to="/project-details" replace>
          Choose another product
        </Button>
      </div>
    );
  if (result.loading)
    return (
      <div className="container section" role="status">
        <CircularProgress size={24} />
        <p>Preparing your saved request…</p>
      </div>
    );
  if (result.error || !result.data)
    return (
      <div className="container section">
        <Alert severity="error">
          {result.error?.message || "Could not open this draft."}
        </Alert>
        <Button onClick={result.retry}>Try again</Button>
        <Button component={Link} to="/products">
          Return to catalog
        </Button>
      </div>
    );
  return (
    <RfqForm
      key={`${result.data[0].id}:${key}`}
      initial={result.data[0]}
      policy={result.data[1]}
      bulk={mode === "bulk"}
    />
  );
}

function RfqForm({
  initial,
  policy,
  bulk,
}: {
  initial: RfqDraft;
  policy: RfqPolicy;
  bulk: boolean;
}) {
  const api = useApi();
  const navigate = useNavigate();
  const { products } = useSiteData();
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const submissionLock = useRef(false);
  const autosave = useRfqAutosave(draft);
  const product = products.find((p) => p.id === draft.productId);
  const pricing = usePriceEstimate(
    product?.type === "configurable" && draft.details.size
      ? {
          productId: product.id,
          size: draft.details.size,
          finish: draft.details.finish,
          quantity: draft.quantity,
        }
      : undefined,
  );
  const isAward =
    !!product &&
    ["plaques", "glass-awards", "trophies-medals"].includes(product.category);
  function update(next: Partial<RfqDraft>) {
    setDraft((d) => ({
      ...d,
      ...next,
      acknowledged: next.acknowledged ?? false,
    }));
    setErrors({});
    setFailure("");
  }
  function detail(
    key: keyof RfqDraft["details"],
    value: string | number | null,
  ) {
    update({ details: { ...draft.details, [key]: value } });
  }
  function go(step: number) {
    setDraft((d) => ({ ...d, step }));
    setErrors({});
    setTimeout(() => {
      heading.current?.focus();
      heading.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 0);
  }
  function next() {
    const invalid = validateRfq(draft, products, policy, draft.step);
    if (Object.keys(invalid).length) {
      setErrors(invalid);
      heading.current?.focus();
      return;
    }
    go(nextRfqStep(draft, products, policy));
  }
  const fieldProps = (key: string) => ({
    error: !!errors[key],
    helperText: errors[key],
    inputProps: { maxLength: 2000 },
  });
  async function chooseFiles(files: FileList | null) {
    if (!files?.length) return;
    const selected = Array.from(files);
    const total = [...draft.artwork.files, ...selected].reduce(
      (sum, f) => sum + f.size,
      0,
    );
    if (
      draft.artwork.files.length + selected.length > policy.maxFiles ||
      total > policy.maxTotalBytes ||
      selected.some(
        (f) =>
          !policy.mimeTypes.includes(f.type) ||
          f.size <= 0 ||
          f.size > policy.maxFileBytes,
      )
    ) {
      setErrors({
        files: `Select JPG, PNG or PDF files: up to ${policy.maxFiles} files and ${policy.maxTotalBytes / 1024 / 1024} MB combined.`,
      });
      return;
    }
    setReading(true);
    setErrors({});
    try {
      const previews = await Promise.all(
        selected.map(
          (file) =>
            new Promise<RfqFile>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () =>
                resolve({
                  id: createId(),
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  data: String(reader.result),
                });
              reader.onerror = () =>
                reject(
                  new Error(
                    "Could not read that file. Please choose it again.",
                  ),
                );
              reader.readAsDataURL(file);
            }),
        ),
      );
      update({
        artwork: {
          ...draft.artwork,
          files: [...draft.artwork.files, ...previews],
        },
      });
    } catch (e) {
      setErrors({
        files: e instanceof Error ? e.message : "Could not read the file.",
      });
    } finally {
      setReading(false);
    }
  }
  async function submit() {
    if (submissionLock.current) return;
    const invalid = validateRfq(draft, products, policy);
    if (Object.keys(invalid).length) {
      go(firstInvalidRfqStep(draft, products, policy));
      setErrors(invalid);
      return;
    }
    submissionLock.current = true;
    setBusy(true);
    setFailure("");
    try {
      const saved = await autosave.saveNow();
      const record = await api.rfq.submit(saved);
      autosave.complete();
      navigate(`/project-details/confirmation/${record.id}`, { replace: true });
    } catch (e) {
      setFailure(
        e instanceof Error
          ? e.message
          : "The local demo could not be saved. Please try again.",
      );
      if (e instanceof ApiError) setErrors(e.fieldErrors);
    } finally {
      submissionLock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="container rfq-page">
      <Breadcrumb current="Request a Quote" />
      <div className="rfq-title">
        <span className="eyebrow">LET’S MAKE IT PERSONAL</span>
        <h1>Tell us about your next moment.</h1>
        <p>
          {bulk
            ? "Plan a request for your team, school or organization."
            : "Choose your details. Review everything before creating a local demo request."}
        </p>
      </div>
      <Alert severity="info">
        Local demo only. Online submission is not connected to Just and Pairs.
        Your details and files stay in this browser and are not sent to the
        business.
      </Alert>
      <div className="rfq-layout">
        <aside className="rfq-sidebar">
          <nav aria-label="Request steps">
            <ol>
              {rfqSteps.map((label, i) => (
                <li key={label}>
                  <button
                    type="button"
                    disabled={busy || reading || i > draft.step}
                    aria-current={draft.step === i ? "step" : undefined}
                    onClick={() => go(i)}
                  >
                    <span>
                      {i < draft.step ? <CheckCircle2 size={18} /> : i + 1}
                    </span>
                    {label}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
          <p role="status" className="fine-print">
            {autosave.status}
          </p>
          <p className="fine-print">
            Progress is saved on this device. Clearing browser data removes your
            draft and demo requests.
          </p>
          {product && (
            <Button
              component={Link}
              to={
                product.type === "configurable"
                  ? "/quote-preview"
                  : `/quote-preview?product=${product.slug}&variant=${encodeURIComponent(draft.variantId)}`
              }
              state={{
                config: product
                  ? {
                      ...readConfiguration(product),
                      size: draft.details.size ?? 0,
                      finish: draft.details.finish,
                      quantity: draft.quantity,
                      title: draft.details.title,
                      recipient: draft.details.recipient,
                      organization: draft.details.organization,
                      event: draft.details.event,
                      message: draft.details.message,
                      design:
                        draft.artwork.choice === "design" ? "upload" : "help",
                      idea: draft.artwork.idea,
                      file: draft.artwork.files[0],
                      deadline: draft.deadline.flexible
                        ? ""
                        : draft.deadline.date,
                      rush: draft.deadline.rush,
                      delivery: draft.delivery.method,
                    }
                  : undefined,
              }}
              size="small"
            >
              Original quote preview
            </Button>
          )}
        </aside>
        <div className="rfq-panel">
          <p className="eyebrow">STEP {draft.step + 1} OF 7</p>
          <h2 ref={heading} tabIndex={-1}>
            {rfqSteps[draft.step]}
          </h2>
          {autosave.error && (
            <Alert
              severity="error"
              action={
                <Button
                  onClick={() => {
                    void autosave.saveNow().catch(() => {});
                  }}
                >
                  Retry save
                </Button>
              }
            >
              {autosave.error.message}
            </Alert>
          )}
          {failure && <Alert severity="error">{failure}</Alert>}
          {!!Object.keys(errors).length && (
            <Alert severity="error" role="alert">
              Please check the highlighted fields before continuing.
            </Alert>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (draft.step === 6) void submit();
              else next();
            }}
            noValidate
          >
            <fieldset disabled={busy || reading} className="rfq-fields">
              {draft.step === 0 && (
                <>
                  <p>
                    Choose a catalog design, or tell us about something custom.
                  </p>
                  {!products.length && (
                    <Alert severity="info">
                      The catalog is empty. You can still start a custom
                      request.
                    </Alert>
                  )}
                  <TextField
                    select
                    label="Product"
                    value={
                      draft.selection === "custom"
                        ? "custom"
                        : (draft.productId ?? "")
                    }
                    {...fieldProps("productId")}
                    onChange={(e) => {
                      const next = selectRfqProduct(
                        draft,
                        products.find((p) => p.id === e.target.value),
                      );
                      update(next);
                    }}
                  >
                    <MenuItem value="" disabled>
                      Choose a product
                    </MenuItem>
                    <MenuItem value="custom">Something Custom</MenuItem>
                    {products.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  {product && (
                    <div className="rfq-chosen">
                      <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
                      <div>
                        <h3>{product.name}</h3>
                        <p>{product.shortDescription}</p>
                      </div>
                    </div>
                  )}
                  {!!product?.variants?.length && (
                    <TextField
                      select
                      label="Design option"
                      value={draft.variantId}
                      {...fieldProps("variantId")}
                      onChange={(e) => update({ variantId: e.target.value })}
                    >
                      {product.variants.map((v) => (
                        <MenuItem key={v.id} value={v.id}>
                          {v.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                </>
              )}
              {draft.step === 1 && (
                <>
                  <div className="row-between">
                    <p>{product?.name || "Something Custom"}</p>
                    <Button onClick={() => go(0)}>Change product</Button>
                  </div>
                  {product?.sizes.length ? (
                    <TextField
                      select
                      label="Size"
                      value={draft.details.size ?? ""}
                      {...fieldProps("size")}
                      onChange={(e) => detail("size", Number(e.target.value))}
                    >
                      {product.sizes.map((s) => (
                        <MenuItem key={s} value={s}>
                          {formatSize(s)}
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : (
                    <TextField
                      label="Preferred size or dimensions (optional)"
                      value={draft.details.requestedSize}
                      {...fieldProps("requestedSize")}
                      onChange={(e) => detail("requestedSize", e.target.value)}
                      helperText={
                        errors.requestedSize ||
                        "A preference only; available dimensions will need confirmation."
                      }
                    />
                  )}
                  {product?.finishes.length ? (
                    <TextField
                      select
                      label="Finish"
                      value={draft.details.finish}
                      {...fieldProps("finish")}
                      onChange={(e) => detail("finish", e.target.value)}
                    >
                      {product.finishes.map((f) => (
                        <MenuItem key={f} value={f}>
                          {f}
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : (
                    <TextField
                      label="Preferred finish or colors (optional)"
                      value={draft.details.requestedFinish}
                      {...fieldProps("requestedFinish")}
                      onChange={(e) =>
                        detail("requestedFinish", e.target.value)
                      }
                      helperText={
                        errors.requestedFinish ||
                        "Your preference does not confirm process availability."
                      }
                    />
                  )}
                  {isAward && (
                    <div className="rfq-grid">
                      {(
                        [
                          ["title", "Recognition title"],
                          ["recipient", "Recipient name"],
                          ["organization", "Organization"],
                          ["event", "Event / Date"],
                        ] as const
                      ).map(([key, label]) => (
                        <TextField
                          key={key}
                          label={`${label} (optional)`}
                          value={draft.details[key]}
                          {...fieldProps(key)}
                          onChange={(e) => detail(key, e.target.value)}
                        />
                      ))}
                      <TextField
                        className="rfq-full"
                        label="Message on the award (optional)"
                        multiline
                        minRows={3}
                        value={draft.details.message}
                        {...fieldProps("message")}
                        onChange={(e) => detail("message", e.target.value)}
                      />
                    </div>
                  )}
                  <TextField
                    label={
                      draft.selection === "custom"
                        ? "What would you like made?"
                        : isAward
                          ? "Other details (optional)"
                          : "Tell us about your design, material preferences or size breakdown (optional)"
                    }
                    required={draft.selection === "custom"}
                    multiline
                    minRows={3}
                    value={draft.details.description}
                    {...fieldProps("description")}
                    onChange={(e) => detail("description", e.target.value)}
                  />
                </>
              )}
              {draft.step === 2 && (
                <>
                  <p>How many pieces do you need?</p>
                  <div className="rfq-quantity">
                    <Button
                      aria-label="Decrease quantity"
                      disabled={draft.quantity <= 1}
                      onClick={() =>
                        update({ quantity: Math.max(1, draft.quantity - 1) })
                      }
                    >
                      <Minus size={18} />
                    </Button>
                    <TextField
                      label="Quantity"
                      type="number"
                      value={draft.quantity || ""}
                      {...fieldProps("quantity")}
                      inputProps={{ min: 1, max: 9999, step: 1 }}
                      onChange={(e) =>
                        update({ quantity: Number(e.target.value) })
                      }
                    />
                    <Button
                      aria-label="Increase quantity"
                      disabled={draft.quantity >= 9999}
                      onClick={() =>
                        update({ quantity: Math.min(9999, draft.quantity + 1) })
                      }
                    >
                      <Plus size={18} />
                    </Button>
                  </div>
                  <p>
                    Ordering for a team or event? Any volume rates will be
                    confirmed in your quotation.
                  </p>
                  <PricePreview pricing={pricing} />
                </>
              )}
              {draft.step === 3 && (
                <>
                  <TextField
                    select
                    label="Artwork preparation"
                    value={draft.artwork.choice}
                    {...fieldProps("artwork")}
                    onChange={(e) =>
                      update({
                        artwork: {
                          ...draft.artwork,
                          choice: e.target
                            .value as RfqDraft["artwork"]["choice"],
                        },
                      })
                    }
                  >
                    <MenuItem value="design">I already have my design</MenuItem>
                    <MenuItem value="reference">
                      I have a reference or idea
                    </MenuItem>
                    <MenuItem value="help">
                      I need help with the design
                    </MenuItem>
                  </TextField>
                  <TextField
                    label="Describe your idea (optional with a reference file)"
                    multiline
                    minRows={3}
                    value={draft.artwork.idea}
                    {...fieldProps("idea")}
                    onChange={(e) =>
                      update({
                        artwork: { ...draft.artwork, idea: e.target.value },
                      })
                    }
                  />
                  <div className="rfq-file-picker">
                    <label htmlFor="rfq-files">
                      Choose local design or reference files
                    </label>
                    <input
                      id="rfq-files"
                      type="file"
                      multiple
                      accept={policy.mimeTypes.join(",")}
                      onChange={(e) => {
                        void chooseFiles(e.target.files);
                        e.target.value = "";
                      }}
                    />
                    <p>
                      JPG, PNG or PDF. Up to {policy.maxFiles} files,{" "}
                      {policy.maxTotalBytes / 1024 / 1024} MB combined. Local
                      previews only; nothing is uploaded.
                    </p>
                    {errors.files && (
                      <p className="field-error" role="alert">
                        {errors.files}
                      </p>
                    )}
                    {!draft.artwork.files.length && (
                      <p className="fine-print">No files selected.</p>
                    )}
                  </div>
                  {reading && <p role="status">Preparing local previews…</p>}
                  {draft.artwork.files.map((f) => (
                    <div className="rfq-file" key={f.id}>
                      {f.type.startsWith("image/") ? (
                        <img src={f.data} alt={`Local preview of ${f.name}`} decoding="async" />
                      ) : (
                        <FileText size={32} />
                      )}
                      <div>
                        <strong>{f.name}</strong>
                        <p>{Math.ceil(f.size / 1024)} KB · Local preview</p>
                        {f.type === "application/pdf" && (
                          <details>
                            <summary>Preview PDF</summary>
                            <object
                              type="application/pdf"
                              data={f.data}
                              aria-label={`Local preview of ${f.name}`}
                            >
                              <p>
                                PDF preview is unavailable in this browser. Your
                                file remains selected.
                              </p>
                            </object>
                          </details>
                        )}
                      </div>
                      <Button
                        aria-label={`Remove ${f.name}`}
                        onClick={() =>
                          update({
                            artwork: {
                              ...draft.artwork,
                              files: draft.artwork.files.filter(
                                (x) => x.id !== f.id,
                              ),
                            },
                          })
                        }
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  ))}
                </>
              )}
              {draft.step === 4 && (
                <>
                  <TextField
                    label="Requested completion date"
                    type="date"
                    disabled={draft.deadline.flexible}
                    required={!draft.deadline.flexible}
                    slotProps={{
                      inputLabel: { shrink: true },
                      htmlInput: { min: todayLocal() },
                    }}
                    value={draft.deadline.date}
                    {...fieldProps("date")}
                    onChange={(e) =>
                      update({
                        deadline: { ...draft.deadline, date: e.target.value },
                      })
                    }
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={draft.deadline.flexible}
                        onChange={(e) =>
                          update({
                            deadline: {
                              ...draft.deadline,
                              flexible: e.target.checked,
                            },
                          })
                        }
                      />
                    }
                    label="My date is flexible"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={draft.deadline.rush}
                        onChange={(e) =>
                          update({
                            deadline: {
                              ...draft.deadline,
                              rush: e.target.checked,
                            },
                          })
                        }
                      />
                    }
                    label="Please check rush availability"
                  />
                  <p>
                    Requested dates and rush availability require confirmation.
                    Selecting a date does not reserve production.
                  </p>
                </>
              )}
              {draft.step === 5 && (
                <>
                  <TextField
                    select
                    label="How would you like to receive it?"
                    value={draft.delivery.method}
                    {...fieldProps("delivery")}
                    onChange={(e) =>
                      update({
                        delivery: {
                          ...draft.delivery,
                          method: e.target
                            .value as RfqDraft["delivery"]["method"],
                        },
                      })
                    }
                  >
                    <MenuItem value="Pickup">Pickup</MenuItem>
                    <MenuItem value="Courier Delivery">
                      Courier Delivery
                    </MenuItem>
                  </TextField>
                  <h3>Your contact details</h3>
                  <div className="rfq-grid">
                    {(
                      [
                        ["name", "Full name", "text"],
                        ["mobile", "Mobile number", "tel"],
                        ["email", "Email", "email"],
                        [
                          "organization",
                          "Company / School / Organization (optional)",
                          "text",
                        ],
                      ] as const
                    ).map(([key, label, type]) => (
                      <TextField
                        key={key}
                        label={label}
                        type={type}
                        required={key !== "organization"}
                        autoComplete={
                          key === "name"
                            ? "name"
                            : key === "mobile"
                              ? "tel"
                              : key === "email"
                                ? "email"
                                : "organization"
                        }
                        value={draft.contact[key]}
                        {...fieldProps(key)}
                        onChange={(e) =>
                          update({
                            contact: {
                              ...draft.contact,
                              [key]: e.target.value,
                            },
                          })
                        }
                      />
                    ))}
                  </div>
                  {draft.delivery.method === "Courier Delivery" && (
                    <>
                      <h3>Delivery address</h3>
                      <div className="rfq-grid">
                        {(
                          [
                            ["recipient", "Recipient"],
                            ["address", "Street / Building / Barangay"],
                            ["city", "City"],
                            ["province", "Province"],
                            ["notes", "Delivery notes (optional)"],
                          ] as const
                        ).map(([key, label]) => (
                          <TextField
                            key={key}
                            label={label}
                            required={key !== "notes"}
                            value={draft.delivery[key]}
                            {...fieldProps(`delivery.${key}`)}
                            onChange={(e) =>
                              update({
                                delivery: {
                                  ...draft.delivery,
                                  [key]: e.target.value,
                                },
                              })
                            }
                          />
                        ))}
                      </div>
                      <p>
                        Courier fees are shouldered by the customer and
                        confirmed separately.
                      </p>
                    </>
                  )}
                </>
              )}
              {draft.step === 6 && (
                <>
                  <RfqSummary
                    draft={draft}
                    product={product}
                    estimate={pricing.data}
                    onEdit={go}
                  />
                  <PricePreview pricing={pricing} />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={draft.acknowledged}
                        onChange={(e) =>
                          update({ acknowledged: e.target.checked })
                        }
                      />
                    }
                    label="I understand this creates a local demo only. Nothing is sent to Just and Pairs, and no production or payment is started."
                  />
                  {errors.acknowledged && (
                    <p className="field-error" role="alert">
                      {errors.acknowledged}
                    </p>
                  )}
                </>
              )}
            </fieldset>
            <div className="rfq-actions">
              <Button
                disabled={busy || reading || draft.step === 0}
                startIcon={<ArrowLeft size={17} />}
                onClick={() => go(draft.step - 1)}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={busy || reading}
                endIcon={
                  busy ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <ArrowRight size={17} />
                  )
                }
              >
                {busy
                  ? "Saving local demo…"
                  : draft.step === 6
                    ? "Create Local Demo Request"
                    : "Continue"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function PricePreview({
  pricing,
}: {
  pricing: ReturnType<typeof usePriceEstimate>;
}) {
  return (
    <div className="rfq-estimate" aria-live="polite">
      {pricing.loading ? (
        <p>Updating estimate…</p>
      ) : pricing.error ? (
        <Alert
          severity="warning"
          action={<Button onClick={pricing.retry}>Retry</Button>}
        >
          The estimate is unavailable. You can still create a demo request.
        </Alert>
      ) : pricing.data ? (
        <>
          <span>Illustrative estimated total</span>
          <strong>{money(pricing.data.total)}</strong>
          <small>Final pricing requires a quotation.</small>
        </>
      ) : (
        <p>
          Pricing to be confirmed. No price has been assumed for these
          requirements.
        </p>
      )}
    </div>
  );
}

export function RfqConfirmation() {
  const api = useApi();
  const { id = "" } = useParams();
  const request = useCallback(
    (signal: AbortSignal) => api.rfq.getRecord(id, { signal }),
    [api, id],
  );
  const result = useRequest(request);
  if (result.loading)
    return (
      <div className="container section" role="status">
        Loading local demo confirmation…
      </div>
    );
  if (result.error || !result.data)
    return (
      <div className="container section">
        <Alert severity="warning">
          {result.error?.message || "No local request found."}
        </Alert>
        <Button onClick={result.retry}>Try again</Button>
        <Button component={Link} to="/project-details">
          Start a request
        </Button>
      </div>
    );
  const record = result.data;
  return (
    <div className="container rfq-page rfq-confirmation">
      <CheckCircle2 size={38} />
      <span className="eyebrow">LOCAL DEMO CONFIRMATION</span>
      <h1>Your demo request is saved.</h1>
      <p className="rfq-reference">{record.reference}</p>
      <Alert severity="info">
        This is a local demo reference, not a business acknowledgment. Nothing
        has been sent to Just and Pairs. Online submission is not connected yet.
      </Alert>
      <p>
        Your request summary is saved only in this browser. Contact Just and
        Pairs through your usual channel to continue with a real quotation. No
        production or payment has started.
      </p>
      <RfqSummary
        draft={record.draft}
        product={record.productSnapshot}
        estimate={record.estimate}
      />
      <p className="fine-print">
        File names are retained in this summary. Preview file contents are
        removed after submission and were never uploaded.
      </p>
      <div className="button-row">
        <Button component={Link} to="/project-details" variant="contained">
          Start another request
        </Button>
        <Button component={Link} to="/products" variant="outlined">
          Back to products
        </Button>
      </div>
    </div>
  );
}
