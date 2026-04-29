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

function money(v, currency = "RWF") {
  return `${normalizeCurrency(currency)} ${safeNumber(v).toLocaleString()}`;
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

function normalizeSummaryResponse(result) {
  return result?.summary || result || {};
}

function normalizeBreakdownResponse(result) {
  return result?.breakdown || result || {};
}

function normalizeLoansResponse(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.loans)) return result.loans;
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result?.data)) return result.data;
  return [];
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

function normalizeLoan(row) {
  if (!row) return null;

  const principalAmount = Number(
    row.principalAmount ?? row.principal_amount ?? row.amount ?? 0,
  );
  const repaidAmount = Number(row.repaidAmount ?? row.repaid_amount ?? 0);
  const remainingAmount =
    row.remainingAmount != null
      ? Number(row.remainingAmount)
      : row.balanceAmount != null
        ? Number(row.balanceAmount)
        : Math.max(0, principalAmount - repaidAmount);

  return {
    id: row.id ?? null,
    locationId: row.locationId ?? row.location_id ?? null,
    locationName: row.locationName ?? row.location_name ?? "",
    locationCode: row.locationCode ?? row.location_code ?? "",

    receiverType: String(
      row.receiverType ?? row.receiver_type ?? "OTHER",
    ).toUpperCase(),
    receiverName: row.receiverName ?? row.receiver_name ?? "",
    receiverPhone: row.receiverPhone ?? row.receiver_phone ?? "",
    receiverEmail: row.receiverEmail ?? row.receiver_email ?? "",
    customerId: row.customerId ?? row.customer_id ?? null,
    customerName: row.customerName ?? row.customer_name ?? "",

    principalAmount,
    repaidAmount,
    remainingAmount,
    currency: normalizeCurrency(row.currency),

    method: String(
      row.method ??
        row.disbursementMethod ??
        row.disbursement_method ??
        "OTHER",
    ).toUpperCase(),

    status: String(row.status || "OPEN").toUpperCase(),
    reference: row.reference ?? "",
    note: row.note ?? "",

    issuedAt:
      row.issuedAt ??
      row.issued_at ??
      row.disbursedAt ??
      row.disbursed_at ??
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

function displayActor(row) {
  if (safe(row?.createdByName)) return safe(row.createdByName);
  if (row?.createdByUserId != null)
    return `User #${safeNumber(row.createdByUserId)}`;
  return "-";
}

function loanReceiverLabel(loan) {
  if (String(loan?.receiverType || "").toUpperCase() === "CUSTOMER") {
    if (safe(loan?.customerName)) return safe(loan.customerName);
    if (safe(loan?.receiverName)) return safe(loan.receiverName);
    return "Customer";
  }

  if (safe(loan?.receiverName)) return safe(loan.receiverName);
  if (safe(loan?.receiverPhone)) return safe(loan.receiverPhone);
  return "Other receiver";
}

function loanReceiverSub(loan) {
  const parts = [];

  parts.push(
    String(loan?.receiverType || "").toUpperCase() === "CUSTOMER"
      ? "Customer"
      : "Other person",
  );

  if (safe(loan?.receiverPhone)) parts.push(safe(loan.receiverPhone));
  if (safe(loan?.receiverEmail)) parts.push(safe(loan.receiverEmail));

  return parts.filter(Boolean).join(" • ") || "-";
}

function getAvailableBalanceForBranchMethod(
  availabilityByBranchMethod,
  locationId,
  method,
) {
  const loc = String(locationId || "").trim();
  const m = String(method || "OTHER")
    .trim()
    .toUpperCase();

  if (!loc || !m) return 0;

  return Number(availabilityByBranchMethod?.[`${loc}__${m}`] ?? 0);
}

function getLocationNameById(locations, locationId) {
  return (
    locations.find((x) => String(x?.id) === String(locationId))?.name ||
    `Branch #${locationId}`
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
                  <div className="mt-1 text-xs text-stone-500 dark:text-stone-400">
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

function StructuredFundsWarning({
  availableBalance = 0,
  requestedAmount = 0,
  method = "OTHER",
  currency = "RWF",
  locationName = "",
}) {
  return (
    <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.14em] text-rose-700 dark:text-rose-300">
            Lending blocked
          </div>
          <h4 className="mt-1 text-base font-black text-rose-900 dark:text-rose-100">
            Not enough {methodLabel(method).toLowerCase()} balance
          </h4>
          <p className="mt-2 text-sm leading-6 text-rose-800 dark:text-rose-200">
            This loan cannot be created because the selected branch and payment
            method do not have enough money available right now.
          </p>
        </div>

        <div className="rounded-2xl border border-rose-300 bg-white/70 px-3 py-2 text-xs font-bold text-rose-800 dark:border-rose-800 dark:bg-stone-950/50 dark:text-rose-200">
          {locationName || "Selected branch"}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-rose-200 bg-white px-4 py-3 dark:border-rose-900/40 dark:bg-stone-950/50">
          <div className="text-[11px] font-black uppercase tracking-[0.12em] text-rose-600 dark:text-rose-300">
            Requested
          </div>
          <div className="mt-1 text-sm font-black text-rose-900 dark:text-rose-100">
            {money(requestedAmount, currency)}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 dark:border-emerald-900/40 dark:bg-stone-950/50">
          <div className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-300">
            Available
          </div>
          <div className="mt-1 text-sm font-black text-emerald-700 dark:text-emerald-300">
            {money(availableBalance, currency)}
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-950/50">
          <div className="text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Short by
          </div>
          <div className="mt-1 text-sm font-black text-stone-950 dark:text-stone-50">
            {money(Math.max(0, requestedAmount - availableBalance), currency)}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateLoanModal({
  open,
  locations = [],
  availabilityByBranchMethod = {},
  onClose,
  onSaved,
}) {
  if (!open) return null;

  return (
    <CreateLoanModalInner
      key={`create-loan-${locations.length}`}
      locations={locations}
      availabilityByBranchMethod={availabilityByBranchMethod}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function CreateLoanModalInner({
  locations = [],
  availabilityByBranchMethod = {},
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState({
    locationId: locations[0]?.id ? String(locations[0].id) : "",
    receiverType: "OTHER",
    customerId: "",
    receiverName: "",
    receiverPhone: "",
    receiverEmail: "",
    amount: "",
    currency: "RWF",
    method: "CASH",
    reference: "",
    note: "",
    dueDate: "",
  });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [errorText, setErrorText] = useState("");
  const [balanceErrorMeta, setBalanceErrorMeta] = useState(null);

  const availableBalance = useMemo(() => {
    return getAvailableBalanceForBranchMethod(
      availabilityByBranchMethod,
      form.locationId,
      form.method,
    );
  }, [availabilityByBranchMethod, form.locationId, form.method]);

  const requestedAmount = Number(form.amount || 0);
  const insufficientFunds =
    Number.isFinite(requestedAmount) &&
    requestedAmount > 0 &&
    requestedAmount > availableBalance;

  const liveBranchName = getLocationNameById(locations, form.locationId);

  function handleReceiverTypeChange(nextType) {
    setForm((prev) => ({
      ...prev,
      receiverType: nextType,
      customerId: "",
      receiverName: nextType === "CUSTOMER" ? "" : prev.receiverName,
      receiverPhone: nextType === "CUSTOMER" ? "" : prev.receiverPhone,
      receiverEmail: nextType === "CUSTOMER" ? "" : prev.receiverEmail,
    }));
    setSelectedCustomer(null);
    setErrorText("");
    setBalanceErrorMeta(null);
  }

  function handlePickCustomer(customer) {
    setSelectedCustomer(customer);

    setForm((prev) => ({
      ...prev,
      customerId: customer?.id ? String(customer.id) : "",
      receiverName: customer?.name || "",
      receiverPhone: customer?.phone || "",
      receiverEmail: customer?.email || "",
    }));
    setErrorText("");
    setBalanceErrorMeta(null);
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrorText("");
    setBalanceErrorMeta(null);
  }

  async function handleSave() {
    setErrorText("");
    setBalanceErrorMeta(null);

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
      setErrorText("Please choose the branch giving out the money.");
      return;
    }

    if (!form.amount || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorText("Please enter a valid amount.");
      return;
    }

    if (form.receiverType === "CUSTOMER") {
      if (
        !parsedCustomerId ||
        !Number.isFinite(parsedCustomerId) ||
        parsedCustomerId <= 0
      ) {
        setErrorText("Please search and choose an existing customer.");
        return;
      }
    }

    if (!String(form.receiverName || "").trim()) {
      setErrorText("Please enter who received the money.");
      return;
    }

    if (parsedAmount > availableBalance) {
      setBalanceErrorMeta({
        availableBalance,
        requestedAmount: parsedAmount,
        locationId: parsedLocationId,
        method: form.method,
        currency: form.currency,
      });

      setErrorText(
        `Not enough ${methodLabel(form.method).toLowerCase()} balance in this branch.`,
      );
      return;
    }

    try {
      const payload = {
        locationId: parsedLocationId,
        receiverType: form.receiverType,
        ...(parsedCustomerId ? { customerId: parsedCustomerId } : {}),
        receiverName: String(form.receiverName || "").trim(),
        ...(String(form.receiverPhone || "").trim()
          ? { receiverPhone: String(form.receiverPhone).trim() }
          : {}),
        ...(String(form.receiverEmail || "").trim()
          ? { receiverEmail: String(form.receiverEmail).trim() }
          : {}),
        principalAmount: parsedAmount,
        currency: form.currency || "RWF",
        disbursementMethod: form.method || "CASH",
        ...(String(form.reference || "").trim()
          ? { reference: String(form.reference).trim() }
          : {}),
        ...(String(form.note || "").trim()
          ? { note: String(form.note).trim() }
          : {}),
        ...(form.dueDate ? { dueDate: form.dueDate } : {}),
      };

      const result = await apiFetch("/owner-loans", {
        method: "POST",
        body: payload,
      });

      onSaved?.(result && typeof result === "object" ? result : {});
    } catch (e) {
      const meta = e?.data?.meta;
      const code = String(meta?.code || "")
        .trim()
        .toUpperCase();

      if (
        code === "INSUFFICIENT_BRANCH_METHOD_BALANCE" ||
        meta?.availableBalance != null
      ) {
        setBalanceErrorMeta({
          availableBalance: Number(meta?.availableBalance ?? 0),
          requestedAmount: Number(meta?.requestedAmount ?? parsedAmount),
          locationId: Number(meta?.locationId ?? parsedLocationId),
          method: String(meta?.method || form.method || "OTHER").toUpperCase(),
          currency: String(
            meta?.currency || form.currency || "RWF",
          ).toUpperCase(),
        });

        setErrorText(
          e?.data?.error ||
            "Not enough available balance for this branch and payment method.",
        );
        return;
      }

      setErrorText(e?.data?.error || e?.message || "Failed to create loan.");
    }
  }

  function handleLocationChange(nextLocationId) {
    setSelectedCustomer(null);
    setErrorText("");
    setBalanceErrorMeta(null);

    setForm((prev) => ({
      ...prev,
      locationId: nextLocationId,
      customerId: "",
      ...(prev.receiverType === "CUSTOMER"
        ? {
            receiverName: "",
            receiverPhone: "",
            receiverEmail: "",
          }
        : {}),
    }));
  }

  const structuredMeta = balanceErrorMeta || null;
  const structuredLocationName = structuredMeta?.locationId
    ? getLocationNameById(locations, structuredMeta.locationId)
    : liveBranchName;

  return (
    <ModalShell
      title="Record money given out"
      subtitle="Save money the business has given to someone and track what is still unpaid."
      onClose={onClose}
    >
      <AlertBox message={errorText} />

      {structuredMeta ? (
        <div className="mb-4">
          <StructuredFundsWarning
            availableBalance={structuredMeta.availableBalance}
            requestedAmount={structuredMeta.requestedAmount}
            method={structuredMeta.method}
            currency={structuredMeta.currency}
            locationName={structuredLocationName}
          />
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Branch
          </p>
          <p className="mt-2 text-sm font-bold text-stone-950 dark:text-stone-50">
            {liveBranchName || "Choose branch"}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Method
          </p>
          <p className="mt-2 text-sm font-bold text-stone-950 dark:text-stone-50">
            {methodLabel(form.method)}
          </p>
        </div>

        <div
          className={cx(
            "rounded-2xl border p-4",
            insufficientFunds
              ? "border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/20"
              : "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20",
          )}
        >
          <p
            className={cx(
              "text-[11px] font-black uppercase tracking-[0.12em]",
              insufficientFunds
                ? "text-rose-700 dark:text-rose-300"
                : "text-emerald-700 dark:text-emerald-300",
            )}
          >
            Available balance
          </p>
          <p
            className={cx(
              "mt-2 text-sm font-black",
              insufficientFunds
                ? "text-rose-900 dark:text-rose-100"
                : "text-emerald-900 dark:text-emerald-100",
            )}
          >
            {money(availableBalance, form.currency)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Branch giving out the money
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
            Who got this money?
          </label>
          <FormSelect
            value={form.receiverType}
            onChange={(e) => handleReceiverTypeChange(e.target.value)}
          >
            <option value="OTHER">Someone else</option>
            <option value="CUSTOMER">A customer already in the system</option>
          </FormSelect>
        </div>

        {form.receiverType === "CUSTOMER" ? (
          <SearchableCustomerPicker
            locationId={form.locationId}
            selectedCustomer={selectedCustomer}
            onPick={handlePickCustomer}
          />
        ) : null}

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Name of the person who got the money
          </label>
          <FormInput
            value={form.receiverName}
            onChange={(e) => updateField("receiverName", e.target.value)}
            placeholder="Enter full name"
            disabled={form.receiverType === "CUSTOMER"}
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Phone number
          </label>
          <FormInput
            value={form.receiverPhone}
            onChange={(e) => updateField("receiverPhone", e.target.value)}
            placeholder="Enter phone number"
            disabled={form.receiverType === "CUSTOMER"}
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Email address
          </label>
          <FormInput
            value={form.receiverEmail}
            onChange={(e) => updateField("receiverEmail", e.target.value)}
            placeholder="Optional email address"
            disabled={form.receiverType === "CUSTOMER"}
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            How much money was given?
          </label>
          <FormInput
            type="number"
            value={form.amount}
            onChange={(e) => updateField("amount", e.target.value)}
            placeholder="Enter amount"
          />
          {Number(form.amount || 0) > 0 ? (
            <p
              className={cx(
                "mt-1 text-xs",
                insufficientFunds
                  ? "text-rose-600 dark:text-rose-300"
                  : "text-stone-500 dark:text-stone-400",
              )}
            >
              {insufficientFunds
                ? `This is higher than the available ${methodLabel(form.method).toLowerCase()} balance.`
                : "Amount is within available balance."}
            </p>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            How was the money sent?
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
            Expected repayment date
          </label>
          <FormInput
            type="date"
            value={form.dueDate}
            onChange={(e) => updateField("dueDate", e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Reference or proof
          </label>
          <FormInput
            value={form.reference}
            onChange={(e) => updateField("reference", e.target.value)}
            placeholder="Transfer code, receipt number, or short reference"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Reason for giving out this money
          </label>
          <textarea
            value={form.note}
            onChange={(e) => updateField("note", e.target.value)}
            rows={4}
            className="w-full rounded-[18px] border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
            placeholder="Describe why this money was given and any important details"
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
          idleText="Save loan"
          loadingText="Saving..."
          successText="Saved"
          onClick={handleSave}
          disabled={insufficientFunds}
        />
      </div>
    </ModalShell>
  );
}

function RepayLoanModal({ open, loan, onClose, onSaved }) {
  if (!open || !loan) return null;

  return (
    <RepayLoanModalInner
      key={`repay-loan-${loan.id}-${loan.remainingAmount ?? 0}`}
      loan={loan}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function RepayLoanModalInner({ loan, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    amount: String(loan?.remainingAmount ?? ""),
    method: "CASH",
    reference: "",
    note: "",
  }));
  const [errorText, setErrorText] = useState("");

  async function handleSave() {
    setErrorText("");

    try {
      const payload = {
        amount: Number(form.amount),
        method: form.method,
        ...(form.reference ? { reference: form.reference } : {}),
        ...(form.note ? { note: form.note } : {}),
      };

      const result = await apiFetch(`/owner-loans/${loan.id}/repayments`, {
        method: "POST",
        body: payload,
      });

      onSaved?.(result);
    } catch (e) {
      setErrorText(
        e?.data?.error || e?.message || "Failed to record repayment",
      );
    }
  }

  return (
    <ModalShell
      title={`Record repayment for loan #${loan.id}`}
      subtitle={`Remaining balance: ${money(loan?.remainingAmount, loan?.currency)}`}
      onClose={onClose}
    >
      <AlertBox message={errorText} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Amount being paid back
          </label>
          <FormInput
            type="number"
            value={form.amount}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, amount: e.target.value }))
            }
            placeholder="0"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            How was the money received?
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

        <div className="md:col-span-2">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Reference or proof
          </label>
          <FormInput
            value={form.reference}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, reference: e.target.value }))
            }
            placeholder="Repayment reference"
          />
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
          idleText="Record repayment"
          loadingText="Recording..."
          successText="Recorded"
          onClick={handleSave}
        />
      </div>
    </ModalShell>
  );
}

function VoidLoanModal({ open, loan, onClose, onSaved }) {
  if (!open || !loan) return null;

  return (
    <VoidLoanModalInner
      key={`void-loan-${loan.id}-${loan.updatedAt || ""}`}
      loan={loan}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function VoidLoanModalInner({ loan, onClose, onSaved }) {
  const [note, setNote] = useState("");
  const [errorText, setErrorText] = useState("");

  async function handleVoid() {
    setErrorText("");

    if (!String(note || "").trim()) {
      setErrorText("Please explain why this loan is being cancelled.");
      return;
    }

    try {
      const result = await apiFetch(`/owner-loans/${loan.id}/void`, {
        method: "POST",
        body: {
          reason: String(note || "").trim(),
        },
      });

      onSaved?.(result);
    } catch (e) {
      setErrorText(e?.data?.error || e?.message || "Failed to void loan");
    }
  }

  return (
    <ModalShell
      title={`Void loan #${loan.id}`}
      subtitle="Only void a loan that should no longer count as active."
      onClose={onClose}
    >
      <AlertBox message={errorText} />

      <div className="rounded-[20px] border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
        <div className="text-sm text-rose-800 dark:text-rose-200">
          Receiver: <strong>{loanReceiverLabel(loan)}</strong>
          <br />
          Principal:{" "}
          <strong>{money(loan?.principalAmount, loan?.currency)}</strong>
          <br />
          Repaid: <strong>{money(loan?.repaidAmount, loan?.currency)}</strong>
          <br />
          Remaining:{" "}
          <strong>{money(loan?.remainingAmount, loan?.currency)}</strong>
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
          Reason for cancelling this loan
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          className="w-full rounded-[18px] border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
          placeholder="Explain why this loan should no longer count"
        />
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
          idleText="Void loan"
          loadingText="Voiding..."
          successText="Voided"
          onClick={handleVoid}
          variant="secondary"
        />
      </div>
    </ModalShell>
  );
}

export default function OwnerPaymentsGivenOutLoansTab({ locations = [] }) {
  const [loading, setLoading] = useState(true);
  const [refreshState, setRefreshState] = useState("idle");
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [loanSummary, setLoanSummary] = useState(null);
  const [loans, setLoans] = useState([]);
  const [breakdown, setBreakdown] = useState(null);

  const [locationId, setLocationId] = useState("");
  const [method, setMethod] = useState("");
  const [search, setSearch] = useState("");

  const [selectedLoanId, setSelectedLoanId] = useState(null);

  const [creatingLoan, setCreatingLoan] = useState(false);
  const [repayingLoan, setRepayingLoan] = useState(null);
  const [voidingLoan, setVoidingLoan] = useState(null);

  const locationOptions = useMemo(() => {
    return Array.isArray(locations)
      ? locations.filter(
          (row) => String(row?.status || "").toUpperCase() !== "ARCHIVED",
        )
      : [];
  }, [locations]);

  const normalizedLoans = useMemo(() => {
    return (Array.isArray(loans) ? loans : [])
      .map(normalizeLoan)
      .filter(Boolean);
  }, [loans]);

  const filteredLoans = useMemo(() => {
    const q = String(search || "")
      .trim()
      .toLowerCase();

    return normalizedLoans.filter((loan) => {
      if (locationId && String(loan?.locationId) !== String(locationId)) {
        return false;
      }

      if (method) {
        const loanMethod = String(loan?.method || "").toUpperCase();
        if (loanMethod !== String(method).toUpperCase()) return false;
      }

      if (!q) return true;

      const hay = [
        loan?.id,
        loan?.receiverType,
        loan?.receiverName,
        loan?.receiverPhone,
        loan?.receiverEmail,
        loan?.customerName,
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
  }, [normalizedLoans, search, locationId, method]);

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
      loansCount: Number(loanSummary?.loansCount ?? 0),
      openLoansCount: Number(loanSummary?.openCount ?? 0),
      partiallyRepaidCount: Number(loanSummary?.partialCount ?? 0),
      repaidLoansCount: Number(loanSummary?.repaidCount ?? 0),
      totalPrincipalAmount: Number(loanSummary?.totalPrincipalAmount ?? 0),
      totalRepaidAmount: Number(loanSummary?.totalRepaidAmount ?? 0),
      totalRemainingAmount: Number(loanSummary?.outstandingAmount ?? 0),
      overdueCount: Number(loanSummary?.overdueCount ?? 0),
      overdueAmount: Number(loanSummary?.overdueAmount ?? 0),
    };
  }, [loanSummary]);

  const byLocationMethodRows = useMemo(() => {
    return Array.isArray(breakdown?.byLocationMethod)
      ? breakdown.byLocationMethod
      : [];
  }, [breakdown]);

  const availabilityByBranchMethod = useMemo(() => {
    const map = {};

    for (const row of byLocationMethodRows) {
      const loc = String(row?.locationId ?? "").trim();
      const m = String(row?.method || "OTHER")
        .trim()
        .toUpperCase();
      const net = Number(row?.netAmount ?? 0);

      if (!loc || !m) continue;
      map[`${loc}__${m}`] = Math.max(0, net);
    }

    return map;
  }, [byLocationMethodRows]);

  const strongestFundingRows = useMemo(() => {
    return byLocationMethodRows
      .map((row) => ({
        ...row,
        netAmount: Number(row?.netAmount ?? 0),
      }))
      .filter((row) => row.netAmount > 0)
      .sort((a, b) => b.netAmount - a.netAmount)
      .slice(0, 6);
  }, [byLocationMethodRows]);

  async function loadData(locationIdOverride = null) {
    setLoading(true);
    setErrorText("");

    try {
      const effectiveLocationId = locationIdOverride || locationId;

      const loanParams = new URLSearchParams();
      if (effectiveLocationId)
        loanParams.set("locationId", effectiveLocationId);
      if (search) loanParams.set("q", search);
      loanParams.set("limit", "100");
      loanParams.set("offset", "0");

      const loanQuery = loanParams.toString();

      const movementParams = new URLSearchParams();
      if (effectiveLocationId)
        movementParams.set("locationId", effectiveLocationId);
      movementParams.set("limit", "200");
      movementParams.set("offset", "0");

      const movementQuery = movementParams.toString();

      const loanSummaryUrl = `/owner-loans/summary${loanQuery ? `?${loanQuery}` : ""}`;
      const loansUrl = `/owner-loans${loanQuery ? `?${loanQuery}` : ""}`;
      const breakdownUrl = `/owner/payments/breakdown${movementQuery ? `?${movementQuery}` : ""}`;

      const [loanSummaryRes, loansRes, breakdownRes] = await Promise.allSettled(
        [
          apiFetch(loanSummaryUrl, { method: "GET" }),
          apiFetch(loansUrl, { method: "GET" }),
          apiFetch(breakdownUrl, { method: "GET" }),
        ],
      );

      let nextError = "";

      if (loanSummaryRes.status === "fulfilled") {
        setLoanSummary(normalizeSummaryResponse(loanSummaryRes.value));
      } else {
        setLoanSummary(null);
        nextError =
          loanSummaryRes.reason?.data?.error ||
          loanSummaryRes.reason?.message ||
          "Owner loans summary request failed";
      }

      if (loansRes.status === "fulfilled") {
        const rows = normalizeLoansResponse(loansRes.value)
          .map(normalizeLoan)
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
          loansRes.reason?.data?.error ||
          loansRes.reason?.message ||
          nextError ||
          "Owner loans list request failed";
      }

      if (breakdownRes.status === "fulfilled") {
        setBreakdown(normalizeBreakdownResponse(breakdownRes.value));
      } else {
        setBreakdown(null);
        nextError =
          breakdownRes.reason?.data?.error ||
          breakdownRes.reason?.message ||
          nextError ||
          "Payments breakdown request failed";
      }

      setErrorText(nextError);
    } catch (e) {
      setLoanSummary(null);
      setLoans([]);
      setBreakdown(null);
      setSelectedLoanId(null);
      setErrorText(
        e?.data?.error || e?.message || "Failed to load owner given-out loans",
      );
    } finally {
      setLoading(false);
    }
  }

  async function refreshNow() {
    setRefreshState("loading");
    await loadData();
    setRefreshState("success");
    setTimeout(() => setRefreshState("idle"), 900);
  }

  async function handleLoanActionSaved(actionText, result) {
    setSuccessText(actionText);

    const createdLoan = result?.loan || result || null;
    const nextLoanId = createdLoan?.id ?? selectedLoanId ?? null;
    const nextLoanLocationId =
      createdLoan?.locationId != null ? String(createdLoan.locationId) : null;

    setCreatingLoan(false);
    setRepayingLoan(null);
    setVoidingLoan(null);

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
  }, [locationId, method, search]);

  return (
    <div className="space-y-5">
      {errorText ? <AlertBox tone="danger">{errorText}</AlertBox> : null}
      {successText ? <AlertBox tone="success">{successText}</AlertBox> : null}

      <SectionCard
        title="Loans given out"
        subtitle="Track business money given to customers or other people, verify available balance before lending, and watch exposure branch by branch."
        right={
          <div className="flex flex-wrap gap-2">
            <AsyncButton
              variant="secondary"
              idleText="Refresh"
              loadingText="Refreshing..."
              successText="Done"
              onClick={refreshNow}
              state={refreshState}
            />
            <AsyncButton
              idleText="Give out loan"
              loadingText="Opening..."
              successText="Ready"
              onClick={async () => setCreatingLoan(true)}
            />
          </div>
        }
      >
        <div className="grid gap-5">
          <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Loans"
                value={safeNumber(cards.loansCount)}
                sub="All visible loans"
                valueClassName="text-[17px] leading-tight"
              />
              <StatCard
                label="Open loans"
                value={safeNumber(cards.openLoansCount)}
                sub="Still unpaid"
                valueClassName="text-[17px] leading-tight text-amber-700 dark:text-amber-300"
              />
              <StatCard
                label="Total lent out"
                value={money(cards.totalPrincipalAmount)}
                sub="Principal amount"
                valueClassName="text-[17px] leading-tight text-rose-700 dark:text-rose-300"
              />
              <StatCard
                label="Still remaining"
                value={money(cards.totalRemainingAmount)}
                sub="Outstanding balance"
                valueClassName="text-[17px] leading-tight text-amber-700 dark:text-amber-300"
              />
            </div>

            <div className="rounded-[24px] border border-stone-200 bg-gradient-to-br from-stone-50 via-white to-stone-100 p-5 dark:border-stone-800 dark:bg-gradient-to-br dark:from-stone-950 dark:via-stone-900 dark:to-stone-900">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                    Funding strength
                  </div>
                  <h3 className="mt-2 text-lg font-black tracking-[-0.02em] text-stone-950 dark:text-stone-50">
                    Best branch-method balances
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">
                    Loans out should only happen where real money still exists.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {loading ? (
                  <>
                    <div className="h-16 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-800" />
                    <div className="h-16 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-800" />
                    <div className="h-16 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-800" />
                  </>
                ) : strongestFundingRows.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-white/70 px-4 py-4 text-sm text-stone-500 dark:border-stone-700 dark:bg-stone-950/50 dark:text-stone-400">
                    No positive branch-method balance available yet.
                  </div>
                ) : (
                  strongestFundingRows.map((row, idx) => (
                    <div
                      key={`${row?.locationId || "loc"}-${row?.method || "method"}-${idx}`}
                      className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 dark:border-stone-800 dark:bg-stone-950/70"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-stone-950 dark:text-stone-50">
                            {safe(row?.locationName) ||
                              `Branch #${safeNumber(row?.locationId)}`}
                            {safe(row?.locationCode)
                              ? ` (${safe(row.locationCode)})`
                              : ""}
                          </div>
                          <div className="mt-1">
                            {chip(
                              methodLabel(row?.method),
                              methodTone(row?.method),
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                            Available
                          </div>
                          <div className="mt-1 text-sm font-black text-emerald-700 dark:text-emerald-300">
                            {money(row?.netAmount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.15fr_0.75fr_0.75fr]">
            <FormInput
              placeholder="Search by receiver, phone, email, note, reference, or loan id"
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

            <FormSelect
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="">All methods</option>
              <option value="CASH">Cash</option>
              <option value="MOMO">Mobile money</option>
              <option value="BANK">Bank</option>
              <option value="CARD">Card</option>
              <option value="OTHER">Other</option>
            </FormSelect>
          </div>

          {cards.overdueCount > 0 ? (
            <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
                    Overdue exposure
                  </div>
                  <div className="mt-1 text-sm font-semibold text-amber-900 dark:text-amber-100">
                    {safeNumber(cards.overdueCount)} overdue loan(s)
                  </div>
                </div>

                <div className="text-sm font-black text-amber-900 dark:text-amber-100">
                  {money(cards.overdueAmount)}
                </div>
              </div>
            </div>
          ) : null}

          {loading ? (
            <div className="grid gap-3">
              <div className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
              <div className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
            </div>
          ) : filteredLoans.length === 0 ? (
            <EmptyState text="No owner loans found for the selected filters." />
          ) : (
            <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="grid gap-3">
                {filteredLoans.map((loan) => {
                  const isSelected =
                    selectedLoan && String(selectedLoan.id) === String(loan.id);

                  return (
                    <button
                      key={`loan-${loan.id}`}
                      type="button"
                      onClick={() => setSelectedLoanId(loan.id)}
                      className={cx(
                        "w-full rounded-[24px] border p-4 text-left transition",
                        isSelected
                          ? "border-stone-900 bg-stone-100 dark:border-stone-100 dark:bg-stone-900"
                          : "border-stone-200 bg-white hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-950 dark:hover:bg-stone-900",
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
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
                                loan?.receiverType || "OTHER",
                              ).toUpperCase() === "CUSTOMER"
                                ? "Customer"
                                : "Other person",
                              "bg-stone-100 text-stone-700 dark:bg-stone-900 dark:text-stone-300",
                            )}
                          </div>

                          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                Receiver
                              </p>
                              <p className="mt-1 text-sm font-semibold text-stone-950 dark:text-stone-50">
                                {loanReceiverLabel(loan)}
                              </p>
                              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                                {loanReceiverSub(loan)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                Branch
                              </p>
                              <p className="mt-1 text-sm font-semibold text-stone-950 dark:text-stone-50">
                                {displayBranch(loan)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                Principal
                              </p>
                              <p className="mt-1 text-sm font-semibold text-rose-700 dark:text-rose-300">
                                {money(loan?.principalAmount, loan?.currency)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                Remaining
                              </p>
                              <p className="mt-1 text-sm font-semibold text-amber-700 dark:text-amber-300">
                                {money(loan?.remainingAmount, loan?.currency)}
                              </p>
                            </div>
                          </div>

                          {(safe(loan?.reference) || safe(loan?.note)) && (
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              <div>
                                <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                  Reference
                                </p>
                                <p className="mt-1 break-words text-sm text-stone-700 dark:text-stone-300">
                                  {safe(loan?.reference) || "No reference"}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                  Note
                                </p>
                                <p className="mt-1 break-words text-sm text-stone-700 dark:text-stone-300">
                                  {safe(loan?.note) || "No note"}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                            Repaid
                          </p>
                          <p className="mt-1 text-lg font-black text-emerald-700 dark:text-emerald-300">
                            {money(loan?.repaidAmount, loan?.currency)}
                          </p>
                          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                            {safeDate(loan?.issuedAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedLoan ? (
                <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-stone-950 dark:text-stone-50">
                        Selected loan
                      </p>
                      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                        Review the receiver, exposure, repayment progress, and
                        next safe action.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {String(selectedLoan?.status || "").toUpperCase() !==
                        "REPAID" &&
                      String(selectedLoan?.status || "").toUpperCase() !==
                        "VOID" ? (
                        <AsyncButton
                          idleText="Record repayment"
                          loadingText="Opening..."
                          successText="Ready"
                          onClick={async () => setRepayingLoan(selectedLoan)}
                          variant="secondary"
                        />
                      ) : null}

                      {String(selectedLoan?.status || "").toUpperCase() !==
                        "VOID" &&
                      safeNumber(selectedLoan?.repaidAmount) <= 0 ? (
                        <AsyncButton
                          idleText="Void loan"
                          loadingText="Opening..."
                          successText="Ready"
                          onClick={async () => setVoidingLoan(selectedLoan)}
                          variant="secondary"
                        />
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <StatCard
                      label="Receiver"
                      value={loanReceiverLabel(selectedLoan)}
                      sub={loanReceiverSub(selectedLoan)}
                      valueClassName="text-[17px] leading-tight"
                    />
                    <StatCard
                      label="Branch"
                      value={displayBranch(selectedLoan)}
                      sub={safeDate(selectedLoan?.issuedAt)}
                      valueClassName="text-[17px] leading-tight"
                    />
                    <StatCard
                      label="Principal"
                      value={money(
                        selectedLoan?.principalAmount,
                        selectedLoan?.currency,
                      )}
                      sub={methodLabel(selectedLoan?.method)}
                      valueClassName="text-[17px] leading-tight text-rose-700 dark:text-rose-300"
                    />
                    <StatCard
                      label="Remaining"
                      value={money(
                        selectedLoan?.remainingAmount,
                        selectedLoan?.currency,
                      )}
                      sub={`${safeNumber(selectedLoan?.repaymentsCount)} repayment(s)`}
                      valueClassName="text-[17px] leading-tight text-amber-700 dark:text-amber-300"
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
                        Created by
                      </p>
                      <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                        {displayActor(selectedLoan)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 sm:col-span-2">
                      <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                        Reference
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
                </div>
              ) : (
                <EmptyState text="Select a loan to inspect details and take actions." />
              )}
            </div>
          )}
        </div>
      </SectionCard>

      <CreateLoanModal
        open={creatingLoan}
        locations={locationOptions}
        availabilityByBranchMethod={availabilityByBranchMethod}
        onClose={() => setCreatingLoan(false)}
        onSaved={(result) =>
          handleLoanActionSaved("Owner loan created", result)
        }
      />

      <RepayLoanModal
        open={!!repayingLoan}
        loan={repayingLoan}
        onClose={() => setRepayingLoan(null)}
        onSaved={(result) =>
          handleLoanActionSaved("Loan repayment recorded", result)
        }
      />

      <VoidLoanModal
        open={!!voidingLoan}
        loan={voidingLoan}
        onClose={() => setVoidingLoan(null)}
        onSaved={(result) => handleLoanActionSaved("Loan voided", result)}
      />
    </div>
  );
}
