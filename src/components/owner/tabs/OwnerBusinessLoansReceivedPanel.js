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

function normalizeCustomer(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    name: row.name ?? row.customerName ?? row.customer_name ?? "",
    phone: row.phone ?? row.customerPhone ?? row.customer_phone ?? "",
    email: row.email ?? row.customerEmail ?? row.customer_email ?? "",
  };
}

function normalizeCustomersResponse(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.customers)) return result.customers;
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result?.data)) return result.data;
  return [];
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
    dueDate: row.dueDate ?? row.due_date ?? null,
    receivedAt:
      row.receivedAt ??
      row.received_at ??
      row.createdAt ??
      row.created_at ??
      null,
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

      const result = await apiFetch("/owner/payments/business-loans", {
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
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
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

  async function handleSave() {
    setErrorText("");

    try {
      const payload = {
        amount: Number(form.amount),
        method: form.method,
        ...(form.note ? { note: form.note } : {}),
      };

      const result = await apiFetch(
        `/owner/payments/business-loans/${loan.id}/repayments`,
        {
          method: "POST",
          body: payload,
        },
      );

      onSaved?.(result);
    } catch (e) {
      setErrorText(
        e?.data?.error || e?.message || "Failed to record repayment",
      );
    }
  }

  return (
    <ModalShell
      title={`Repay received loan #${loan.id}`}
      subtitle={`Remaining balance: ${money(loan?.remainingAmount, loan?.currency)}`}
      onClose={onClose}
    >
      <AlertBox message={errorText} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Amount being paid out
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

export default function OwnerBusinessLoansReceivedPanel({ locations = [] }) {
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

  const locationOptions = useMemo(() => {
    return Array.isArray(locations)
      ? locations.filter(
          (row) => String(row?.status || "").toUpperCase() !== "ARCHIVED",
        )
      : [];
  }, [locations]);

  const normalizedLoans = useMemo(() => {
    return (Array.isArray(loans) ? loans : [])
      .map(normalizeBusinessLoan)
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
      loansCount: Number(summary?.loansCount ?? 0),
      openLoansCount: Number(summary?.openCount ?? 0),
      partiallyRepaidCount: Number(summary?.partiallyRepaidCount ?? 0),
      repaidLoansCount: Number(summary?.repaidCount ?? 0),
      totalPrincipalAmount: Number(summary?.principalTotal ?? 0),
      totalRepaidAmount: Number(summary?.repaidTotal ?? 0),
      totalRemainingAmount: Number(summary?.remainingTotal ?? 0),
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
        apiFetch(`/owner/payments/business-loans/summary${suffix}`, {
          method: "GET",
        }),
        apiFetch(`/owner/payments/business-loans${suffix}`, {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId, search]);

  return (
    <>
      {errorText ? <AlertBox tone="danger">{errorText}</AlertBox> : null}
      {successText ? <AlertBox tone="success">{successText}</AlertBox> : null}

      <SectionCard
        title="Money received as loans"
        subtitle="Track money other people gave to the business, how much has been paid back, and what still remains to be repaid."
        right={
          <AsyncButton
            idleText="Receive loan"
            loadingText="Opening..."
            successText="Ready"
            onClick={async () => setCreatingLoan(true)}
          />
        }
      >
        <div className="grid gap-4">
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

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

          {loading ? (
            <div className="grid gap-3">
              <div className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
              <div className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
            </div>
          ) : filteredLoans.length === 0 ? (
            <EmptyState text="No received-business-loan records found for the selected filters." />
          ) : (
            <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
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
                                loan?.lenderType || "OTHER",
                              ).toUpperCase() === "CUSTOMER"
                                ? "Customer"
                                : "Other person",
                              "bg-stone-100 text-stone-700 dark:bg-stone-900 dark:text-stone-300",
                            )}
                          </div>

                          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                Lender
                              </p>
                              <p className="mt-1 text-sm font-semibold text-stone-950 dark:text-stone-50">
                                {lenderLabel(loan)}
                              </p>
                              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                                {lenderSub(loan)}
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
                              <p className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                {money(loan?.principalAmount, loan?.currency)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                Remaining
                              </p>
                              <p className="mt-1 text-sm font-semibold text-rose-700 dark:text-rose-300">
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
                          <p className="mt-1 text-lg font-black text-amber-700 dark:text-amber-300">
                            {money(loan?.repaidAmount, loan?.currency)}
                          </p>
                          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                            {safeDate(loan?.receivedAt)}
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
                        Selected received loan
                      </p>
                      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                        Review business debt profile and record repayment when
                        money goes back out.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {String(selectedLoan?.status || "").toUpperCase() !==
                        "REPAID" &&
                      String(selectedLoan?.status || "").toUpperCase() !==
                        "VOID" ? (
                        <AsyncButton
                          idleText="Repay loan"
                          loadingText="Opening..."
                          successText="Ready"
                          onClick={async () => setRepayingLoan(selectedLoan)}
                          variant="secondary"
                        />
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
                        {safeDate(selectedLoan?.receivedAt)}
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
                </div>
              ) : (
                <EmptyState text="Select a received loan to inspect details and repay it." />
              )}
            </div>
          )}
        </div>
      </SectionCard>

      <CreateBusinessLoanModal
        open={creatingLoan}
        locations={locations}
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
    </>
  );
}
