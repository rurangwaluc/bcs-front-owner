"use client";

import {
  AlertBox,
  EmptyState,
  FormInput,
  FormSelect,
  SectionCard,
  StatCard,
  safe,
  safeDate,
  safeNumber,
} from "./../OwnerShared";
import { useEffect, useMemo, useState } from "react";

import AsyncButton from "../../AsyncButton";
import { apiFetch } from "../../../lib/api";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function normalizeCurrency(v) {
  const s = String(v || "RWF")
    .trim()
    .toUpperCase();
  return s || "RWF";
}

function nonNegativeNumber(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, n);
}

function money(v, currency = "RWF") {
  return `${normalizeCurrency(currency)} ${nonNegativeNumber(v).toLocaleString()}`;
}

function chip(text, className = "") {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {text}
    </span>
  );
}

function methodLabel(value) {
  const v = String(value || "")
    .trim()
    .toUpperCase();

  if (v === "MOMO") return "Mobile money";
  if (v === "CARD") return "Card";
  if (v === "BANK") return "Bank";
  if (v === "CASH") return "Cash";
  if (v === "OTHER") return "Other";
  return safe(value) || "-";
}

function methodTone(value) {
  const v = String(value || "")
    .trim()
    .toUpperCase();

  if (v === "CASH") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
  if (v === "BANK") {
    return "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";
  }
  if (v === "MOMO") {
    return "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300";
  }
  if (v === "CARD") {
    return "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300";
  }
  return "bg-stone-100 text-stone-700 dark:bg-stone-900 dark:text-stone-300";
}

function statusTone(status) {
  const v = String(status || "")
    .trim()
    .toUpperCase();

  if (v === "OPEN") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }
  if (v === "PARTIALLY_REPAID") {
    return "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300";
  }
  if (v === "REPAID") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
  if (v === "VOID") {
    return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
  }
  return "bg-stone-100 text-stone-700 dark:bg-stone-900 dark:text-stone-300";
}

function displayBranch(row) {
  if (safe(row?.locationName)) {
    return safe(row?.locationCode)
      ? `${safe(row.locationName)} (${safe(row.locationCode)})`
      : safe(row.locationName);
  }

  if (row?.locationId != null && String(row.locationId).trim()) {
    return `Branch #${row.locationId}`;
  }

  return "-";
}

function getLocationNameById(locations, locationId) {
  return (
    (Array.isArray(locations) ? locations : []).find(
      (row) => String(row?.id) === String(locationId),
    )?.name || (locationId ? `Branch #${locationId}` : "Selected branch")
  );
}

function normalizeLocationOption(row) {
  if (!row) return null;

  const id =
    row.id ??
    row.locationId ??
    row.location_id ??
    row.branchId ??
    row.branch_id ??
    "";
  const idText = String(id || "").trim();
  if (!idText) return null;

  return {
    id: idText,
    name:
      safe(row.name) ||
      safe(row.locationName) ||
      safe(row.location_name) ||
      safe(row.branchName) ||
      safe(row.branch_name) ||
      `Branch #${idText}`,
    code:
      safe(row.code) ||
      safe(row.locationCode) ||
      safe(row.location_code) ||
      safe(row.branchCode) ||
      safe(row.branch_code) ||
      "",
    status: safe(row.status || row.locationStatus || row.location_status),
  };
}

function locationOptionLabel(row) {
  const name = safe(row?.name) || `Branch #${safe(row?.id) || "-"}`;
  const code = safe(row?.code);
  return code ? `${name} (${code})` : name;
}

function buildFallbackLocationOptions(rows) {
  const map = new Map();

  for (const row of Array.isArray(rows) ? rows : []) {
    const option = normalizeLocationOption(row);
    if (!option) continue;
    if (!map.has(option.id)) map.set(option.id, option);
  }

  return Array.from(map.values()).sort((a, b) =>
    locationOptionLabel(a).localeCompare(locationOptionLabel(b)),
  );
}

function normalizeCustomersResponse(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.customers)) return result.customers;
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function normalizeCustomer(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    name: row.name ?? row.customerName ?? row.customer_name ?? "",
    phone: row.phone ?? row.customerPhone ?? row.customer_phone ?? "",
    email: row.email ?? row.customerEmail ?? row.customer_email ?? "",
  };
}

function normalizeBusinessLoansResponse(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result?.loans)) return result.loans;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function normalizeBusinessLoanSummaryResponse(result) {
  return result?.summary || result || {};
}

function normalizeBusinessLoan(row) {
  if (!row) return null;

  const principalAmount = Number(
    row.principalAmount ?? row.principal_amount ?? row.amount ?? 0,
  );
  const repaidAmount = Number(row.repaidAmount ?? row.repaid_amount ?? 0);
  const remainingAmount =
    row.remainingAmount != null
      ? Number(row.remainingAmount)
      : Math.max(0, principalAmount - repaidAmount);

  return {
    id: row.id ?? null,
    locationId: row.locationId ?? row.location_id ?? null,
    locationName: row.locationName ?? row.location_name ?? "",
    locationCode: row.locationCode ?? row.location_code ?? "",
    lenderType: String(
      row.lenderType ?? row.lender_type ?? "OTHER",
    ).toUpperCase(),
    customerId: row.customerId ?? row.customer_id ?? null,
    lenderName: row.lenderName ?? row.lender_name ?? "",
    lenderPhone: row.lenderPhone ?? row.lender_phone ?? "",
    lenderEmail: row.lenderEmail ?? row.lender_email ?? "",
    principalAmount,
    repaidAmount,
    remainingAmount,
    currency: normalizeCurrency(row.currency),
    method: String(
      row.method ?? row.receiptMethod ?? row.receipt_method ?? "OTHER",
    ).toUpperCase(),
    status: String(row.status || "OPEN").toUpperCase(),
    reference: row.reference ?? "",
    note: row.note ?? "",
    issueDate:
      row.issueDate ??
      row.issue_date ??
      row.receivedAt ??
      row.received_at ??
      row.createdAt ??
      row.created_at ??
      null,
    dueDate: row.dueDate ?? row.due_date ?? null,
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
    createdByUserId: row.createdByUserId ?? row.created_by_user_id ?? null,
    createdByName: row.createdByName ?? row.created_by_name ?? "",
    repaymentsCount: Number(row.repaymentsCount ?? row.repayments_count ?? 0),
  };
}

function lenderLabel(loan) {
  if (String(loan?.lenderType || "").toUpperCase() === "CUSTOMER") {
    if (safe(loan?.lenderName)) return safe(loan.lenderName);
    return "Customer";
  }

  if (safe(loan?.lenderName)) return safe(loan.lenderName);
  if (safe(loan?.lenderPhone)) return safe(loan.lenderPhone);
  return "Other lender";
}

function lenderSub(loan) {
  const parts = [];
  parts.push(
    String(loan?.lenderType || "").toUpperCase() === "CUSTOMER"
      ? "Customer"
      : "Other person",
  );
  if (safe(loan?.lenderPhone)) parts.push(safe(loan.lenderPhone));
  if (safe(loan?.lenderEmail)) parts.push(safe(loan.lenderEmail));
  return parts.filter(Boolean).join(" • ") || "-";
}

function LoanMoneyEffectCard({
  title,
  actionText,
  amount = 0,
  method = "OTHER",
  currency = "RWF",
  branchName = "",
  direction = "IN",
  availableBefore = null,
  balanceAfter = null,
}) {
  const isIn = String(direction || "").toUpperCase() === "IN";
  const amountValue = nonNegativeNumber(amount);
  const beforeValue =
    availableBefore == null ? null : nonNegativeNumber(availableBefore);
  const afterValue =
    balanceAfter == null
      ? beforeValue == null
        ? null
        : isIn
          ? beforeValue + amountValue
          : Math.max(0, beforeValue - amountValue)
      : nonNegativeNumber(balanceAfter);
  const hasBeforeAfter = beforeValue != null && afterValue != null;
  const toneClass = isIn
    ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-100"
    : "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-100";
  const badgeClass = isIn
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
    : "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300";

  return (
    <div className={cx("rounded-[24px] border p-4", toneClass)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] opacity-75">
            Money effect
          </p>
          <h4 className="mt-1 text-base font-black">{title}</h4>
          <p className="mt-2 text-sm leading-6 opacity-90">{actionText}</p>
        </div>
        <span
          className={cx(
            "rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em]",
            badgeClass,
          )}
        >
          {isIn ? "Balance increases" : "Balance decreases"}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-stone-950/40">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] opacity-70">
            Amount
          </p>
          <p className="mt-1 text-sm font-black">
            {money(amountValue, currency)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-stone-950/40">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] opacity-70">
            Method affected
          </p>
          <p className="mt-1 text-sm font-black">{methodLabel(method)}</p>
        </div>
        <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-stone-950/40">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] opacity-70">
            Branch affected
          </p>
          <p className="mt-1 break-words text-sm font-black">
            {branchName || "Selected branch"}
          </p>
        </div>
      </div>

      {hasBeforeAfter ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-stone-950/40">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] opacity-70">
              Available now
            </p>
            <p className="mt-1 text-sm font-black">
              {money(beforeValue, currency)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-stone-950/40">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] opacity-70">
              This action
            </p>
            <p className="mt-1 text-sm font-black">
              {isIn ? "+" : "-"} {money(amountValue, currency)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-stone-950/40">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] opacity-70">
              Balance after save
            </p>
            <p className="mt-1 text-sm font-black">
              {money(afterValue, currency)}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-950/50 p-4 backdrop-blur-[2px]">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-stone-200 bg-white shadow-[0_30px_80px_rgba(2,6,23,0.22)] dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 p-5 dark:border-stone-800">
          <div>
            <h3 className="text-xl font-black text-stone-950 dark:text-stone-50">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                {subtitle}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 text-stone-600 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            ×
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function SearchableCustomerPicker({
  disabled = false,
  locationId = "",
  selectedCustomer = null,
  onPick,
}) {
  const [query, setQuery] = useState(selectedCustomer?.name || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    setQuery(selectedCustomer?.name || "");
  }, [selectedCustomer?.id, selectedCustomer?.name]);

  useEffect(() => {
    if (disabled) {
      setResults([]);
      setOpen(false);
      setErrorText("");
      return;
    }

    const q = String(query || "").trim();
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      setErrorText("");
      return;
    }

    if (!locationId) {
      setResults([]);
      setOpen(false);
      setErrorText("Choose the branch first.");
      return;
    }

    let alive = true;

    const timer = setTimeout(async () => {
      setLoading(true);
      setErrorText("");

      try {
        const result = await apiFetch(
          `/customers/search?q=${encodeURIComponent(q)}&locationId=${encodeURIComponent(locationId)}&limit=10`,
          { method: "GET" },
        );

        if (!alive) return;

        const rows = normalizeCustomersResponse(result)
          .map(normalizeCustomer)
          .filter(Boolean);

        setResults(rows);
        setOpen(true);
      } catch (e) {
        if (!alive) return;
        setResults([]);
        setOpen(false);
        setErrorText(
          e?.data?.error || e?.message || "Failed to search customers",
        );
      } finally {
        if (alive) setLoading(false);
      }
    }, 250);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query, disabled, locationId]);

  return (
    <div className="relative md:col-span-2">
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
        Find customer
      </label>

      <FormInput
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        placeholder="Search by customer name or phone number"
        disabled={disabled || !locationId}
      />

      {selectedCustomer?.id ? (
        <div className="mt-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200">
          Chosen customer: <b>{selectedCustomer.name || "Unnamed customer"}</b>
          {selectedCustomer.phone ? ` • ${selectedCustomer.phone}` : ""}
          {selectedCustomer.email ? ` • ${selectedCustomer.email}` : ""}
        </div>
      ) : null}

      {errorText ? (
        <div className="mt-2 text-xs text-rose-600 dark:text-rose-300">
          {errorText}
        </div>
      ) : null}

      {open && !disabled && !!locationId ? (
        <div className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-stone-200 bg-white p-2 shadow-xl dark:border-stone-800 dark:bg-stone-950">
          {loading ? (
            <div className="px-3 py-3 text-sm text-stone-500 dark:text-stone-400">
              Looking for customers...
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-3 text-sm text-stone-500 dark:text-stone-400">
              No matching customer found
            </div>
          ) : (
            <div className="grid gap-2">
              {results.map((customer) => (
                <button
                  key={String(customer.id)}
                  type="button"
                  onClick={() => {
                    onPick?.(customer);
                    setQuery(customer.name || customer.phone || "");
                    setOpen(false);
                  }}
                  className="rounded-xl border border-stone-200 px-3 py-3 text-left transition hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-900"
                >
                  <div className="text-sm font-semibold text-stone-950 dark:text-stone-50">
                    {customer.name || "Unnamed customer"}
                  </div>
                  <div className="mt-1 break-words text-xs leading-5 text-stone-500 dark:text-stone-400">
                    {customer.phone || "No phone"}
                    {customer.email ? ` • ${customer.email}` : ""}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function CreateBusinessLoanModal({ open, locations = [], onClose, onSaved }) {
  if (!open) return null;

  return (
    <CreateBusinessLoanModalInner
      key={`create-business-loan-${locations.length}`}
      locations={locations}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function CreateBusinessLoanModalInner({ locations = [], onClose, onSaved }) {
  const todayValue = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const [form, setForm] = useState({
    locationId: locations[0]?.id ? String(locations[0].id) : "",
    lenderType: "OTHER",
    customerId: "",
    lenderName: "",
    lenderPhone: "",
    lenderEmail: "",
    amount: "",
    currency: "RWF",
    method: "CASH",
    issueDate: todayValue,
    note: "",
    dueDate: "",
  });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [errorText, setErrorText] = useState("");

  function handleLenderTypeChange(nextType) {
    setForm((prev) => ({
      ...prev,
      lenderType: nextType,
      customerId: "",
      lenderName: nextType === "CUSTOMER" ? "" : prev.lenderName,
      lenderPhone: nextType === "CUSTOMER" ? "" : prev.lenderPhone,
      lenderEmail: nextType === "CUSTOMER" ? "" : prev.lenderEmail,
    }));
    setSelectedCustomer(null);
  }

  function handlePickCustomer(customer) {
    setSelectedCustomer(customer);

    setForm((prev) => ({
      ...prev,
      customerId: customer?.id ? String(customer.id) : "",
      lenderName: customer?.name || "",
      lenderPhone: customer?.phone || "",
      lenderEmail: customer?.email || "",
    }));
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setErrorText("");

    const parsedLocationId = Number(form.locationId);
    const parsedCustomerId =
      form.customerId === "" || form.customerId == null
        ? null
        : Number(form.customerId);
    const parsedAmount = Number(form.amount);

    if (
      !form.locationId ||
      !Number.isFinite(parsedLocationId) ||
      parsedLocationId <= 0
    ) {
      setErrorText("Please choose the branch receiving the money.");
      return;
    }

    if (!form.amount || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorText("Please enter a valid amount.");
      return;
    }

    if (form.lenderType === "CUSTOMER") {
      if (
        !parsedCustomerId ||
        !Number.isFinite(parsedCustomerId) ||
        parsedCustomerId <= 0
      ) {
        setErrorText("Please search and choose an existing customer.");
        return;
      }
    }

    if (!String(form.lenderName || "").trim()) {
      setErrorText("Please enter who gave the money.");
      return;
    }

    if (!String(form.issueDate || "").trim()) {
      setErrorText("Please choose the issue date.");
      return;
    }

    try {
      const payload = {
        locationId: parsedLocationId,
        lenderType: form.lenderType,
        ...(parsedCustomerId ? { customerId: parsedCustomerId } : {}),
        lenderName: String(form.lenderName || "").trim(),
        ...(String(form.lenderPhone || "").trim()
          ? { lenderPhone: String(form.lenderPhone).trim() }
          : {}),
        ...(String(form.lenderEmail || "").trim()
          ? { lenderEmail: String(form.lenderEmail).trim() }
          : {}),
        principalAmount: parsedAmount,
        currency: form.currency || "RWF",
        receiptMethod: form.method || "CASH",
        issueDate: form.issueDate,
        ...(String(form.note || "").trim()
          ? { note: String(form.note).trim() }
          : {}),
        ...(form.dueDate ? { dueDate: form.dueDate } : {}),
      };

      const result = await apiFetch("/owner/business-loans", {
        method: "POST",
        body: payload,
      });

      onSaved?.(result && typeof result === "object" ? result : {});
    } catch (e) {
      setErrorText(
        e?.data?.error || e?.message || "Failed to record incoming loan.",
      );
    }
  }

  function handleLocationChange(nextLocationId) {
    setSelectedCustomer(null);

    setForm((prev) => ({
      ...prev,
      locationId: nextLocationId,
      customerId: "",
      ...(prev.lenderType === "CUSTOMER"
        ? {
            lenderName: "",
            lenderPhone: "",
            lenderEmail: "",
          }
        : {}),
    }));
  }

  return (
    <ModalShell
      title="Record money received"
      subtitle="Save money the business received as a loan and track what still must be paid back."
      onClose={onClose}
    >
      <AlertBox message={errorText} />

      <div className="mb-4">
        <LoanMoneyEffectCard
          title="Business money will come in"
          actionText="Saving this received loan immediately increases the selected branch and payment method balance."
          amount={form.amount}
          method={form.method}
          currency={form.currency}
          branchName={getLocationNameById(locations, form.locationId)}
          direction="IN"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Branch receiving the money
          </label>
          <FormSelect
            value={form.locationId}
            onChange={(e) => handleLocationChange(e.target.value)}
          >
            <option value="">Choose branch</option>
            {locations.map((row) => (
              <option key={row?.id} value={String(row?.id)}>
                {safe(row?.name)}
                {safe(row?.code) ? ` (${safe(row.code)})` : ""}
              </option>
            ))}
          </FormSelect>
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Who gave the money?
          </label>
          <FormSelect
            value={form.lenderType}
            onChange={(e) => handleLenderTypeChange(e.target.value)}
          >
            <option value="OTHER">Someone else</option>
            <option value="CUSTOMER">A customer already in the system</option>
          </FormSelect>
        </div>

        {form.lenderType === "CUSTOMER" ? (
          <SearchableCustomerPicker
            locationId={form.locationId}
            selectedCustomer={selectedCustomer}
            onPick={handlePickCustomer}
          />
        ) : null}

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Name of the lender
          </label>
          <FormInput
            value={form.lenderName}
            onChange={(e) => updateField("lenderName", e.target.value)}
            placeholder="Enter full name"
            disabled={form.lenderType === "CUSTOMER"}
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Phone number
          </label>
          <FormInput
            value={form.lenderPhone}
            onChange={(e) => updateField("lenderPhone", e.target.value)}
            placeholder="Enter phone number"
            disabled={form.lenderType === "CUSTOMER"}
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Email address
          </label>
          <FormInput
            value={form.lenderEmail}
            onChange={(e) => updateField("lenderEmail", e.target.value)}
            placeholder="Optional email address"
            disabled={form.lenderType === "CUSTOMER"}
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            How much money was received?
          </label>
          <FormInput
            type="number"
            min="1"
            step="1"
            value={form.amount}
            onChange={(e) => updateField("amount", e.target.value)}
            placeholder="Enter amount"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            How was the money received?
          </label>
          <FormSelect
            value={form.method}
            onChange={(e) => updateField("method", e.target.value)}
          >
            <option value="CASH">Cash</option>
            <option value="MOMO">Mobile money</option>
            <option value="BANK">Bank transfer</option>
            <option value="CARD">Card</option>
            <option value="OTHER">Other</option>
          </FormSelect>
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Currency
          </label>
          <FormSelect
            value={form.currency}
            onChange={(e) => updateField("currency", e.target.value)}
          >
            <option value="RWF">RWF</option>
            <option value="USD">USD</option>
          </FormSelect>
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Issue date
          </label>
          <FormInput
            type="date"
            value={form.issueDate}
            onChange={(e) => updateField("issueDate", e.target.value)}
          />
          <p className="mt-1 break-words text-xs leading-5 text-stone-500 dark:text-stone-400">
            The real date the business received this money.
          </p>
        </div>

        <div className="md:col-span-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
          <b>Reference / proof:</b> This will be generated automatically after
          save, for example <b>BLR-BRANCH-001</b>.
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Expected payback date
          </label>
          <FormInput
            type="date"
            value={form.dueDate}
            onChange={(e) => updateField("dueDate", e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Reason for receiving this money
          </label>
          <textarea
            value={form.note}
            onChange={(e) => updateField("note", e.target.value)}
            rows={4}
            className="w-full rounded-[18px] border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
            placeholder="Describe why this money was received and any important details"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-[18px] border border-stone-300 px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          Cancel
        </button>

        <AsyncButton
          idleText="Save received loan"
          loadingText="Saving..."
          successText="Saved"
          onClick={handleSave}
        />
      </div>
    </ModalShell>
  );
}

function RepayBusinessLoanModal({ open, loan, onClose, onSaved }) {
  if (!open || !loan) return null;

  return (
    <RepayBusinessLoanModalInner
      key={`repay-business-loan-${loan.id}-${loan.remainingAmount ?? 0}`}
      loan={loan}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function RepayBusinessLoanModalInner({ loan, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    amount: String(loan?.remainingAmount ?? ""),
    method: "CASH",
    note: "",
  }));
  const [errorText, setErrorText] = useState("");

  const remainingAmount = nonNegativeNumber(loan?.remainingAmount ?? 0);
  const requestedAmount = Number(form.amount);
  const invalidAmount =
    !Number.isFinite(requestedAmount) || requestedAmount <= 0;
  const exceedsRemaining =
    Number.isFinite(requestedAmount) &&
    requestedAmount > 0 &&
    requestedAmount > remainingAmount;
  const repaymentBlocked =
    invalidAmount || exceedsRemaining || remainingAmount <= 0;

  async function handleSave() {
    setErrorText("");

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setErrorText("Enter a valid repayment amount greater than zero.");
      return;
    }

    if (remainingAmount <= 0) {
      setErrorText("This received loan has no remaining balance to repay.");
      return;
    }

    if (amount > remainingAmount) {
      setErrorText(
        `Repayment cannot exceed the remaining balance (${money(
          remainingAmount,
          loan?.currency,
        )}).`,
      );
      return;
    }

    try {
      const payload = {
        amount,
        method: form.method,
        ...(form.note ? { note: form.note } : {}),
      };

      const result = await apiFetch(
        `/owner/business-loans/${loan.id}/repayments`,
        {
          method: "POST",
          body: payload,
        },
      );

      onSaved?.(result);
    } catch (e) {
      setErrorText(
        e?.data?.error ||
          e?.message ||
          "Failed to record repayment. Confirm this payment method has enough available money and try again.",
      );
    }
  }

  return (
    <ModalShell
      title={`Repay received loan #${loan.id}`}
      subtitle={`Remaining balance: ${money(remainingAmount, loan?.currency)}`}
      onClose={onClose}
    >
      <AlertBox message={errorText} />

      <div className="mb-4">
        <LoanMoneyEffectCard
          title="Business money will go out"
          actionText="Recording this repayment immediately decreases the selected payment method balance for this branch."
          amount={form.amount}
          method={form.method}
          currency={loan?.currency}
          branchName={displayBranch(loan)}
          direction="OUT"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Amount being paid out
          </label>
          <FormInput
            type="number"
            min="1"
            step="1"
            value={form.amount}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, amount: e.target.value }))
            }
            placeholder="0"
          />
          {exceedsRemaining ? (
            <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">
              Repayment cannot be greater than the remaining balance.
            </p>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            How is the money going out?
          </label>
          <FormSelect
            value={form.method}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, method: e.target.value }))
            }
          >
            <option value="CASH">Cash</option>
            <option value="MOMO">Mobile money</option>
            <option value="BANK">Bank</option>
            <option value="CARD">Card</option>
            <option value="OTHER">Other</option>
          </FormSelect>
        </div>

        <div className="md:col-span-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
          <b>Reference / proof:</b> Repayment reference is generated
          automatically by the backend when you save.
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Note
          </label>
          <textarea
            value={form.note}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, note: e.target.value }))
            }
            rows={4}
            className="w-full rounded-[18px] border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
            placeholder="Add anything important about this repayment"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-[18px] border border-stone-300 px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          Cancel
        </button>

        <AsyncButton
          idleText="Record business repayment"
          loadingText="Recording..."
          successText="Recorded"
          onClick={handleSave}
        />
      </div>
    </ModalShell>
  );
}

function PremiumHeroCard({ children }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_18px_60px_rgba(28,25,23,0.08)] dark:border-stone-800 dark:bg-stone-950">
      {children}
    </div>
  );
}

export default function OwnerPaymentsReceivedLoansTab({ locations = [] }) {
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [summary, setSummary] = useState(null);
  const [loans, setLoans] = useState([]);

  const [locationId, setLocationId] = useState("");
  const [search, setSearch] = useState("");

  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [creatingLoan, setCreatingLoan] = useState(false);
  const [repayingLoan, setRepayingLoan] = useState(null);

  const officialLocationOptions = useMemo(() => {
    return Array.isArray(locations)
      ? locations
          .map(normalizeLocationOption)
          .filter(Boolean)
          .filter(
            (row) => String(row?.status || "").toUpperCase() !== "ARCHIVED",
          )
      : [];
  }, [locations]);

  const normalizedLoans = useMemo(() => {
    return (Array.isArray(loans) ? loans : [])
      .map(normalizeBusinessLoan)
      .filter(Boolean);
  }, [loans]);

  const locationOptions = useMemo(() => {
    if (officialLocationOptions.length > 0) return officialLocationOptions;
    return buildFallbackLocationOptions(normalizedLoans);
  }, [officialLocationOptions, normalizedLoans]);

  const filteredLoans = useMemo(() => {
    const q = String(search || "")
      .trim()
      .toLowerCase();

    return normalizedLoans.filter((loan) => {
      if (locationId && String(loan?.locationId) !== String(locationId)) {
        return false;
      }

      if (!q) return true;

      const hay = [
        loan?.id,
        loan?.lenderType,
        loan?.lenderName,
        loan?.lenderPhone,
        loan?.lenderEmail,
        loan?.reference,
        loan?.note,
        loan?.method,
        loan?.status,
        loan?.locationName,
        loan?.locationCode,
        loan?.principalAmount,
        loan?.repaidAmount,
        loan?.remainingAmount,
      ]
        .map((x) => String(x ?? ""))
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [normalizedLoans, search, locationId]);

  const selectedLoan = useMemo(() => {
    if (selectedLoanId == null) return filteredLoans[0] || null;
    return (
      filteredLoans.find(
        (loan) => String(loan.id) === String(selectedLoanId),
      ) || null
    );
  }, [filteredLoans, selectedLoanId]);

  const cards = useMemo(() => {
    return {
      loansCount: nonNegativeNumber(summary?.loansCount ?? 0),
      openLoansCount: nonNegativeNumber(summary?.openCount ?? 0),
      partiallyRepaidCount: nonNegativeNumber(
        summary?.partiallyRepaidCount ?? summary?.partialCount ?? 0,
      ),
      repaidLoansCount: nonNegativeNumber(summary?.repaidCount ?? 0),
      totalPrincipalAmount: nonNegativeNumber(
        summary?.principalTotal ?? summary?.totalPrincipalAmount ?? 0,
      ),
      totalRepaidAmount: nonNegativeNumber(
        summary?.repaidTotal ?? summary?.totalRepaidAmount ?? 0,
      ),
      totalRemainingAmount: nonNegativeNumber(
        summary?.remainingTotal ?? summary?.outstandingAmount ?? 0,
      ),
    };
  }, [summary]);

  async function loadData(locationIdOverride = null) {
    setLoading(true);
    setErrorText("");

    try {
      const params = new URLSearchParams();
      const effectiveLocationId = locationIdOverride || locationId;

      if (effectiveLocationId) params.set("locationId", effectiveLocationId);
      if (search) params.set("q", search);
      params.set("limit", "100");

      const suffix = params.toString() ? `?${params.toString()}` : "";

      const [summaryRes, listRes] = await Promise.allSettled([
        apiFetch(`/owner/business-loans/summary${suffix}`, {
          method: "GET",
        }),
        apiFetch(`/owner/business-loans${suffix}`, {
          method: "GET",
        }),
      ]);

      let nextError = "";

      if (summaryRes.status === "fulfilled") {
        setSummary(normalizeBusinessLoanSummaryResponse(summaryRes.value));
      } else {
        setSummary(null);
        nextError =
          summaryRes.reason?.data?.error ||
          summaryRes.reason?.message ||
          "Business loans summary request failed";
      }

      if (listRes.status === "fulfilled") {
        const rows = normalizeBusinessLoansResponse(listRes.value)
          .map(normalizeBusinessLoan)
          .filter(Boolean);

        setLoans(rows);
        setSelectedLoanId((prev) =>
          prev && rows.some((x) => String(x.id) === String(prev))
            ? prev
            : (rows[0]?.id ?? null),
        );
      } else {
        setLoans([]);
        setSelectedLoanId(null);
        nextError =
          listRes.reason?.data?.error ||
          listRes.reason?.message ||
          nextError ||
          "Business loans list request failed";
      }

      setErrorText(nextError);
    } catch (e) {
      setSummary(null);
      setLoans([]);
      setSelectedLoanId(null);
      setErrorText(
        e?.data?.error ||
          e?.message ||
          "Failed to load received business loans",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSaved(actionText, result) {
    setSuccessText(actionText);

    const createdLoan = result?.loan || result || null;
    const nextLoanId = createdLoan?.id ?? selectedLoanId ?? null;
    const nextLoanLocationId =
      createdLoan?.locationId != null ? String(createdLoan.locationId) : null;

    setCreatingLoan(false);
    setRepayingLoan(null);

    if (nextLoanLocationId) {
      setLocationId(nextLoanLocationId);
    }

    await loadData(nextLoanLocationId);

    if (nextLoanId != null) {
      setSelectedLoanId(nextLoanId);
    }

    setTimeout(() => setSuccessText(""), 2200);
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadData();
    }, 220);

    return () => clearTimeout(timeout);
  }, [locationId, search]);

  return (
    <div className="space-y-5">
      {errorText ? <AlertBox tone="danger">{errorText}</AlertBox> : null}
      {successText ? <AlertBox tone="success">{successText}</AlertBox> : null}

      <PremiumHeroCard>
        <div className="border-b border-stone-200 bg-gradient-to-b from-white via-emerald-50/70 to-stone-100 px-5 py-6 dark:border-stone-800 dark:bg-gradient-to-br dark:from-stone-950 dark:via-stone-900 dark:to-stone-800 sm:px-6 sm:py-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400">
                Receive loans
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-stone-950 dark:text-white sm:text-3xl">
                Money received by the business
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600 dark:text-stone-300">
                Track outside money that entered the business as debt, see what
                is still unpaid, and record repayment cleanly without mixing it
                with daily movement noise.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <AsyncButton
                idleText="Receive loan"
                loadingText="Opening..."
                successText="Ready"
                onClick={async () => setCreatingLoan(true)}
              />
            </div>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
            <FormInput
              placeholder="Search by lender, note, reference, phone, email, or loan id"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <FormSelect
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
            >
              <option value="">All branches</option>
              {locationOptions.map((row) => (
                <option key={row?.id} value={String(row?.id)}>
                  {safe(row?.name)}
                  {safe(row?.code) ? ` (${safe(row.code)})` : ""}
                </option>
              ))}
            </FormSelect>
          </div>
        </div>
      </PremiumHeroCard>

      <SectionCard
        title="Liability snapshot"
        subtitle="Fast owner view of how much was received, how much was repaid, and how much still remains."
      >
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
          <StatCard
            label="Received loans"
            value={safeNumber(cards.loansCount)}
            sub="All visible incoming loans"
            valueClassName="text-[17px] leading-tight"
          />
          <StatCard
            label="Open liabilities"
            value={safeNumber(cards.openLoansCount)}
            sub="Still unpaid by the business"
            valueClassName="text-[17px] leading-tight text-amber-700 dark:text-amber-300"
          />
          <StatCard
            label="Total received"
            value={money(cards.totalPrincipalAmount)}
            sub="Principal amount received"
            valueClassName="text-[17px] leading-tight text-emerald-700 dark:text-emerald-300"
          />
          <StatCard
            label="Still to repay"
            value={money(cards.totalRemainingAmount)}
            sub="Outstanding liability"
            valueClassName="text-[17px] leading-tight text-rose-700 dark:text-rose-300"
          />
        </div>
      </SectionCard>

      <div className="grid gap-5 2xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="Received loan records"
          subtitle="Every row shows who gave the money, where it landed, how much remains, and the current status."
        >
          {loading ? (
            <div className="grid gap-3">
              <div className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
              <div className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
              <div className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
            </div>
          ) : filteredLoans.length === 0 ? (
            <EmptyState text="No received-business-loan records found for the selected filters." />
          ) : (
            <div className="grid gap-3">
              {filteredLoans.map((loan) => {
                const isSelected =
                  selectedLoan && String(selectedLoan.id) === String(loan.id);

                return (
                  <button
                    key={`business-loan-${loan.id}`}
                    type="button"
                    onClick={() => setSelectedLoanId(loan.id)}
                    className={cx(
                      "w-full rounded-[24px] border p-4 text-left transition",
                      isSelected
                        ? "border-stone-900 bg-stone-100 dark:border-stone-100 dark:bg-stone-900"
                        : "border-stone-200 bg-white hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-950 dark:hover:bg-stone-900",
                    )}
                  >
                    <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {chip(
                            String(loan?.status || "OPEN"),
                            statusTone(loan?.status),
                          )}
                          {chip(
                            methodLabel(loan?.method),
                            methodTone(loan?.method),
                          )}
                          {chip(
                            String(
                              loan?.lenderType || "OTHER",
                            ).toUpperCase() === "CUSTOMER"
                              ? "Customer"
                              : "Other person",
                            "bg-stone-100 text-stone-700 dark:bg-stone-900 dark:text-stone-300",
                          )}
                        </div>

                        <div className="mt-3 grid gap-2 sm:grid-cols-2 2xl:grid-cols-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                              Lender
                            </p>
                            <p className="mt-1 break-words text-sm font-semibold leading-5 text-stone-950 dark:text-stone-50">
                              {lenderLabel(loan)}
                            </p>
                            <p className="mt-1 break-words text-xs leading-5 text-stone-500 dark:text-stone-400">
                              {lenderSub(loan)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                              Branch
                            </p>
                            <p className="mt-1 break-words text-sm font-semibold leading-5 text-stone-950 dark:text-stone-50">
                              {displayBranch(loan)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                              Principal
                            </p>
                            <p className="mt-1 break-words text-sm font-semibold leading-5 text-emerald-700 dark:text-emerald-300">
                              {money(loan?.principalAmount, loan?.currency)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                              Remaining
                            </p>
                            <p className="mt-1 break-words text-sm font-semibold leading-5 text-rose-700 dark:text-rose-300">
                              {money(loan?.remainingAmount, loan?.currency)}
                            </p>
                          </div>
                        </div>

                        {(safe(loan?.reference) || safe(loan?.note)) && (
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                Reference / proof
                              </p>
                              <p className="mt-1 break-words text-sm leading-5 text-stone-700 dark:text-stone-300">
                                {safe(loan?.reference) || "No reference"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                Note
                              </p>
                              <p className="mt-1 break-words text-sm leading-5 text-stone-700 dark:text-stone-300">
                                {safe(loan?.note) || "No note"}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="w-full shrink-0 rounded-2xl border border-stone-200 bg-stone-50 p-3 text-left dark:border-stone-800 dark:bg-stone-950 2xl:w-[150px] 2xl:text-right">
                        <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                          Repaid
                        </p>
                        <p className="mt-1 text-lg font-black text-amber-700 dark:text-amber-300">
                          {money(loan?.repaidAmount, loan?.currency)}
                        </p>
                        <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                          {safeDate(loan?.issueDate)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </SectionCard>

        {selectedLoan ? (
          <SectionCard
            title="Selected received loan"
            subtitle="Review the liability profile and record repayment when money goes back out."
            right={
              String(selectedLoan?.status || "").toUpperCase() !== "REPAID" &&
              String(selectedLoan?.status || "").toUpperCase() !== "VOID" ? (
                <AsyncButton
                  idleText="Repay loan"
                  loadingText="Opening..."
                  successText="Ready"
                  onClick={async () => setRepayingLoan(selectedLoan)}
                  variant="secondary"
                />
              ) : null
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard
                label="Principal"
                value={money(
                  selectedLoan?.principalAmount,
                  selectedLoan?.currency,
                )}
                sub="Money originally received"
                valueClassName="text-[17px] leading-tight text-emerald-700 dark:text-emerald-300"
              />
              <StatCard
                label="Repaid"
                value={money(
                  selectedLoan?.repaidAmount,
                  selectedLoan?.currency,
                )}
                sub="Money already paid back"
                valueClassName="text-[17px] leading-tight text-amber-700 dark:text-amber-300"
              />
              <StatCard
                label="Remaining"
                value={money(
                  selectedLoan?.remainingAmount,
                  selectedLoan?.currency,
                )}
                sub={`${safeNumber(selectedLoan?.repaymentsCount)} repayment(s)`}
                valueClassName="text-[17px] leading-tight text-rose-700 dark:text-rose-300"
              />
              <StatCard
                label="Lender"
                value={lenderLabel(selectedLoan)}
                sub={displayBranch(selectedLoan)}
                valueClassName="text-[17px] leading-tight"
              />
            </div>

            <div className="mt-4">
              <LoanMoneyEffectCard
                title="Original loan increased available funds"
                actionText="When this loan was received, the selected branch and payment method balance went up. Repayments send money back out."
                amount={selectedLoan?.principalAmount}
                method={selectedLoan?.method}
                currency={selectedLoan?.currency}
                branchName={displayBranch(selectedLoan)}
                direction="IN"
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  Status
                </p>
                <div className="mt-2">
                  {chip(
                    String(selectedLoan?.status || "OPEN"),
                    statusTone(selectedLoan?.status),
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  Issue date
                </p>
                <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                  {safeDate(selectedLoan?.issueDate)}
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  Reference / proof
                </p>
                <p className="mt-2 break-words text-sm font-semibold text-stone-950 dark:text-stone-50">
                  {safe(selectedLoan?.reference) || "No reference"}
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  Note
                </p>
                <p className="mt-2 break-words text-sm font-semibold text-stone-950 dark:text-stone-50">
                  {safe(selectedLoan?.note) || "No note recorded"}
                </p>
              </div>
            </div>
          </SectionCard>
        ) : (
          <SectionCard
            title="Selected received loan"
            subtitle="This panel becomes active after you choose a loan."
          >
            <EmptyState text="Select a received loan to inspect details and repay it." />
          </SectionCard>
        )}
      </div>

      <CreateBusinessLoanModal
        open={creatingLoan}
        locations={locationOptions}
        onClose={() => setCreatingLoan(false)}
        onSaved={(result) =>
          handleSaved("Business loan received saved.", result)
        }
      />

      <RepayBusinessLoanModal
        open={!!repayingLoan}
        loan={repayingLoan}
        onClose={() => setRepayingLoan(null)}
        onSaved={(result) =>
          handleSaved("Business loan repayment recorded.", result)
        }
      />
    </div>
  );
}
