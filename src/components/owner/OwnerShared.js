"use client";

export function safe(v) {
  return String(v ?? "").trim();
}

export function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function pad2(v) {
  return String(v).padStart(2, "0");
}

export function safeDate(v) {
  if (!v) return "-";

  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);

    const year = d.getUTCFullYear();
    const month = pad2(d.getUTCMonth() + 1);
    const day = pad2(d.getUTCDate());
    const hour = pad2(d.getUTCHours());
    const minute = pad2(d.getUTCMinutes());

    return `${year}-${month}-${day} ${hour}:${minute} UTC`;
  } catch {
    return String(v);
  }
}

export function money(v) {
  return safeNumber(v).toLocaleString();
}

export function statusTone(status) {
  const s = safe(status).toUpperCase();

  if (s === "ACTIVE") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300";
  }

  if (s === "CLOSED") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300";
  }

  if (s === "ARCHIVED") {
    return "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
  }

  return "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
}

export function userActiveTone(isActive) {
  return isActive
    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
    : "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
}

export function downloadCSV(filename, rows) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell == null ? "" : String(cell);
          return `"${value.replaceAll('"', '""')}"`;
        })
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function AlertBox({ message, tone = "error" }) {
  if (!message) return null;

  const classes =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
      : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300";

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${classes}`}>
      {message}
    </div>
  );
}

export function SectionCard({ title, subtitle, right = null, children }) {
  return (
    <section className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 dark:border-stone-800 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
            {title}
          </p>
          {subtitle ? (
            <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
              {subtitle}
            </p>
          ) : null}
        </div>

        {right ? <div className="shrink-0">{right}</div> : null}
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

export function StatCard({ label, value, sub, valueClassName = "" }) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
        {label}
      </p>
      <p
        className={`mt-3 break-words text-3xl font-black text-stone-950 dark:text-stone-50 ${valueClassName}`}
      >
        {value}
      </p>
      {sub ? (
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">{sub}</p>
      ) : null}
    </div>
  );
}

export function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm text-stone-600 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-300">
      {text}
    </div>
  );
}

export function FieldLabel({ htmlFor, children }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-semibold text-stone-800 dark:text-stone-200"
    >
      {children}
    </label>
  );
}

export function FormInput(props) {
  return (
    <input
      {...props}
      className={
        "h-12 w-full rounded-2xl border border-stone-300 bg-white px-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-stone-500 dark:focus:ring-stone-800 " +
        (props.className || "")
      }
    />
  );
}

export function FormTextarea(props) {
  return (
    <textarea
      {...props}
      className={
        "min-h-[120px] w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-stone-500 dark:focus:ring-stone-800 " +
        (props.className || "")
      }
    />
  );
}

export function FormSelect(props) {
  return (
    <select
      {...props}
      className={
        "h-12 w-full rounded-2xl border border-stone-300 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500 dark:focus:ring-stone-800 " +
        (props.className || "")
      }
    />
  );
}

export function OverlayModal({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer = null,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/45">
      <div className="flex min-h-screen items-start justify-center overflow-y-auto px-4 py-4 sm:px-6 sm:py-8">
        <div className="my-auto flex w-full max-w-xl flex-col overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-2xl dark:border-stone-800 dark:bg-stone-900 max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)]">
          <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-5 py-5 dark:border-stone-800 sm:px-6">
            <div>
              <h3 className="text-xl font-black text-stone-950 dark:text-stone-50">
                {title}
              </h3>
              {subtitle ? (
                <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
                  {subtitle}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-300 bg-white text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 dark:text-stone-100 sm:px-6">
            {children}
          </div>

          {footer ? (
            <div className="flex flex-col-reverse gap-3 border-t border-stone-200 px-5 py-5 dark:border-stone-800 sm:flex-row sm:justify-end sm:px-6">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function LocationCard({ row, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(row)}
      className={
        "w-full rounded-[24px] border p-4 text-left transition " +
        (active
          ? "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950"
          : "border-stone-200 bg-white hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={
              "text-xs uppercase tracking-[0.18em] " +
              (active
                ? "text-stone-300 dark:text-stone-600"
                : "text-stone-500 dark:text-stone-400")
            }
          >
            Branch
          </p>
          <h3 className="mt-2 text-lg font-bold break-words">
            {safe(row?.name) || "Unnamed branch"}
          </h3>
          <p
            className={
              "mt-1 text-sm " +
              (active
                ? "text-stone-200 dark:text-stone-700"
                : "text-stone-600 dark:text-stone-300")
            }
          >
            Code: {safe(row?.code) || "-"}
          </p>
        </div>

        <span
          className={
            "rounded-full px-3 py-1 text-xs font-semibold " +
            (active
              ? "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950"
              : statusTone(row?.status))
          }
        >
          {safe(row?.status) || "-"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Users", value: safeNumber(row?.usersCount) },
          { label: "Products", value: safeNumber(row?.productsCount) },
          { label: "Sales", value: safeNumber(row?.salesCount) },
          { label: "Payments", value: safeNumber(row?.paymentsCount) },
        ].map((item) => (
          <div
            key={item.label}
            className={
              "rounded-2xl border p-3 " +
              (active
                ? "border-white/10 bg-white/5 dark:border-stone-300 dark:bg-stone-200"
                : "border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950")
            }
          >
            <p
              className={
                "text-xs uppercase tracking-[0.15em] " +
                (active
                  ? "text-stone-300 dark:text-stone-600"
                  : "text-stone-500 dark:text-stone-400")
              }
            >
              {item.label}
            </p>
            <p className="mt-2 text-base font-bold">{item.value}</p>
          </div>
        ))}
      </div>
    </button>
  );
}

export function StaffRowCard({ row, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(row)}
      className={
        "w-full rounded-[24px] border p-4 text-left transition " +
        (active
          ? "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950"
          : "border-stone-200 bg-white hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700")
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p
            className={
              "text-lg font-bold break-words " +
              (active
                ? "text-white dark:text-stone-950"
                : "text-stone-950 dark:text-stone-50")
            }
          >
            {safe(row?.name) || "-"}
          </p>
          <p
            className={
              "mt-1 text-sm break-words " +
              (active
                ? "text-stone-200 dark:text-stone-700"
                : "text-stone-600 dark:text-stone-300")
            }
          >
            {safe(row?.email) || "-"}
          </p>
          <p
            className={
              "mt-2 text-sm " +
              (active
                ? "text-stone-200 dark:text-stone-700"
                : "text-stone-600 dark:text-stone-300")
            }
          >
            {safe(row?.location?.name || "-")}
            {safe(row?.location?.code) ? ` (${safe(row.location.code)})` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={
              "rounded-full px-3 py-1 text-xs font-semibold " +
              (active
                ? "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950"
                : "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300")
            }
          >
            {safe(row?.role || "-")}
          </span>
          <span
            className={
              "rounded-full px-3 py-1 text-xs font-semibold " +
              (active
                ? "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950"
                : userActiveTone(!!row?.isActive))
            }
          >
            {row?.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>
    </button>
  );
}
