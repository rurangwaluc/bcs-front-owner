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
} from "../OwnerShared";
import { useEffect, useMemo, useState } from "react";

import AsyncButton from "../../AsyncButton";
import { apiFetch } from "../../../lib/api";

const PAGE_SIZE = 20;
const PAYMENT_METHOD_OPTIONS = ["BANK", "MOMO", "CASH", "CARD"];

function normalizeCurrency(v) {
  const s = String(v || "RWF")
    .trim()
    .toUpperCase();
  return s || "RWF";
}

function money(v, currency = "RWF") {
  return `${normalizeCurrency(currency)} ${safeNumber(v).toLocaleString()}`;
}

function normalizeSupplier(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    name: row.name ?? "",
    contactName: row.contactName ?? row.contact_name ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    country: row.country ?? "",
    city: row.city ?? "",
    sourceType: row.sourceType ?? row.source_type ?? "LOCAL",
    defaultCurrency: normalizeCurrency(
      row.defaultCurrency ?? row.default_currency ?? "RWF",
    ),
    address: row.address ?? "",
    notes: row.notes ?? "",
    isActive: row.isActive ?? row.is_active ?? true,
    billsCount: Number(row.billsCount ?? row.bills_count ?? 0),
    totalBilled: Number(row.totalBilled ?? row.total_billed ?? 0),
    totalPaid: Number(row.totalPaid ?? row.total_paid ?? 0),
    balanceDue: Number(row.balanceDue ?? row.balance_due ?? 0),
    overdueBillsCount: Number(
      row.overdueBillsCount ?? row.overdue_bills_count ?? 0,
    ),
    overdueAmount: Number(row.overdueAmount ?? row.overdue_amount ?? 0),
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
  };
}

function normalizeProfile(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    supplierId: row.supplierId ?? row.supplier_id ?? null,
    preferredPaymentMethod:
      row.preferredPaymentMethod ?? row.preferred_payment_method ?? "BANK",
    acceptedPaymentMethods: Array.isArray(row.acceptedPaymentMethods)
      ? row.acceptedPaymentMethods
      : Array.isArray(row.accepted_payment_methods)
        ? row.accepted_payment_methods
        : [],
    paymentTermsLabel:
      row.paymentTermsLabel ?? row.payment_terms_label ?? "IMMEDIATE",
    paymentTermsDays: Number(
      row.paymentTermsDays ?? row.payment_terms_days ?? 0,
    ),
    creditLimit: Number(row.creditLimit ?? row.credit_limit ?? 0),
    bankName: row.bankName ?? row.bank_name ?? "",
    bankAccountName: row.bankAccountName ?? row.bank_account_name ?? "",
    bankAccountNumber: row.bankAccountNumber ?? row.bank_account_number ?? "",
    bankBranch: row.bankBranch ?? row.bank_branch ?? "",
    momoName: row.momoName ?? row.momo_name ?? "",
    momoPhone: row.momoPhone ?? row.momo_phone ?? "",
    taxId: row.taxId ?? row.tax_id ?? "",
    paymentInstructions:
      row.paymentInstructions ?? row.payment_instructions ?? "",
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
  };
}

function paymentMethodTone(method) {
  const v = safe(method).toUpperCase();
  if (v === "BANK") {
    return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300";
  }
  if (v === "MOMO") {
    return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-900/40 dark:bg-fuchsia-950/20 dark:text-fuchsia-300";
  }
  if (v === "CASH") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300";
  }
  if (v === "CARD") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300";
  }
  return "border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300";
}

function supplierTone(sourceType) {
  const v = safe(sourceType).toUpperCase();
  if (v === "ABROAD") {
    return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/40 dark:bg-violet-950/20 dark:text-violet-300";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300";
}

function activeTone(isActive) {
  return isActive
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
    : "border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300";
}

function neutralBadgeTone() {
  return "border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300";
}

function profileDefaults(profile) {
  return {
    preferredPaymentMethod: safe(profile?.preferredPaymentMethod) || "BANK",
    acceptedPaymentMethods: Array.isArray(profile?.acceptedPaymentMethods)
      ? profile.acceptedPaymentMethods
      : [],
    paymentTermsLabel: safe(profile?.paymentTermsLabel) || "IMMEDIATE",
    paymentTermsDays: String(profile?.paymentTermsDays ?? 0),
    creditLimit: String(profile?.creditLimit ?? 0),
    bankName: safe(profile?.bankName) || "",
    bankAccountName: safe(profile?.bankAccountName) || "",
    bankAccountNumber: safe(profile?.bankAccountNumber) || "",
    bankBranch: safe(profile?.bankBranch) || "",
    momoName: safe(profile?.momoName) || "",
    momoPhone: safe(profile?.momoPhone) || "",
    taxId: safe(profile?.taxId) || "",
    paymentInstructions: safe(profile?.paymentInstructions) || "",
  };
}

function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-stone-950 dark:text-stone-50">
        {value || "-"}
      </p>
    </div>
  );
}

function ProfileCard({ supplier, profile, active, onSelect }) {
  const preferredMethod = safe(profile?.preferredPaymentMethod) || "Not set";
  const acceptedMethods =
    Array.isArray(profile?.acceptedPaymentMethods) &&
    profile.acceptedPaymentMethods.length > 0
      ? profile.acceptedPaymentMethods.join(", ")
      : "Not set";

  return (
    <button
      type="button"
      onClick={() => onSelect?.(supplier?.id)}
      className={
        "group w-full overflow-hidden rounded-[28px] border text-left transition-all duration-200 " +
        (active
          ? "border-stone-900 bg-stone-900 text-white shadow-lg dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950"
          : "border-stone-200 bg-white hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700")
      }
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-bold sm:text-lg">
                {safe(supplier?.name) || "-"}
              </h3>

              <Badge
                className={
                  active
                    ? "border-white/10 bg-white/10 text-white dark:border-stone-900/10 dark:bg-stone-900/10 dark:text-stone-950"
                    : supplierTone(supplier?.sourceType)
                }
              >
                {safe(supplier?.sourceType) || "LOCAL"}
              </Badge>

              <Badge
                className={
                  active
                    ? "border-white/10 bg-white/10 text-white dark:border-stone-900/10 dark:bg-stone-900/10 dark:text-stone-950"
                    : activeTone(!!supplier?.isActive)
                }
              >
                {supplier?.isActive ? "Active" : "Inactive"}
              </Badge>

              <Badge
                className={
                  active
                    ? "border-white/10 bg-white/10 text-white dark:border-stone-900/10 dark:bg-stone-900/10 dark:text-stone-950"
                    : neutralBadgeTone()
                }
              >
                {normalizeCurrency(supplier?.defaultCurrency)}
              </Badge>
            </div>

            <div
              className={
                "mt-3 grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-4 " +
                (active
                  ? "text-stone-200 dark:text-stone-700"
                  : "text-stone-600 dark:text-stone-400")
              }
            >
              <p className="truncate">
                <span className="font-medium">Phone:</span>{" "}
                {safe(supplier?.phone) || "-"}
              </p>
              <p className="truncate">
                <span className="font-medium">Email:</span>{" "}
                {safe(supplier?.email) || "-"}
              </p>
              <p className="truncate">
                <span className="font-medium">Terms:</span>{" "}
                {safe(profile?.paymentTermsLabel) || "-"}
              </p>
              <p className="truncate">
                <span className="font-medium">Tax ID:</span>{" "}
                {safe(profile?.taxId) || "-"}
              </p>
            </div>
          </div>

          <div
            className={
              "rounded-2xl border px-4 py-3 xl:min-w-[230px] " +
              (active
                ? "border-white/10 bg-white/5 dark:border-stone-900/10 dark:bg-stone-900/5"
                : "border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950")
            }
          >
            <p
              className={
                "text-[11px] font-semibold uppercase tracking-[0.18em] " +
                (active
                  ? "text-stone-300 dark:text-stone-600"
                  : "text-stone-500 dark:text-stone-400")
              }
            >
              Preferred payment
            </p>
            <p className="mt-2 text-xl font-black sm:text-2xl">
              {preferredMethod}
            </p>
            <p
              className={
                "mt-1 text-xs " +
                (active
                  ? "text-stone-300 dark:text-stone-600"
                  : "text-stone-500 dark:text-stone-400")
              }
            >
              Accepted: {acceptedMethods}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}

function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-stone-200 bg-white p-5 shadow-2xl dark:border-stone-800 dark:bg-stone-900 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
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

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function SupplierProfileModal({ open, supplier, profile, onClose, onSaved }) {
  if (!open || !supplier) return null;

  return (
    <SupplierProfileModalInner
      key={`profile-${supplier.id}-${profile?.id || "new"}`}
      supplier={supplier}
      profile={profile}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function SupplierProfileModalInner({ supplier, profile, onClose, onSaved }) {
  const [form, setForm] = useState(() => profileDefaults(profile));
  const [errorText, setErrorText] = useState("");

  function toggleAcceptedMethod(method) {
    setForm((prev) => {
      const exists = prev.acceptedPaymentMethods.includes(method);
      return {
        ...prev,
        acceptedPaymentMethods: exists
          ? prev.acceptedPaymentMethods.filter((x) => x !== method)
          : [...prev.acceptedPaymentMethods, method],
      };
    });
  }

  async function handleSave() {
    setErrorText("");

    const payload = {
      preferredPaymentMethod: String(form.preferredPaymentMethod || "BANK")
        .trim()
        .toUpperCase(),
      acceptedPaymentMethods: form.acceptedPaymentMethods,
      paymentTermsLabel: String(form.paymentTermsLabel || "IMMEDIATE").trim(),
      paymentTermsDays: Number(form.paymentTermsDays || 0),
      creditLimit: Number(form.creditLimit || 0),
      bankName: String(form.bankName || "").trim() || undefined,
      bankAccountName: String(form.bankAccountName || "").trim() || undefined,
      bankAccountNumber:
        String(form.bankAccountNumber || "").trim() || undefined,
      bankBranch: String(form.bankBranch || "").trim() || undefined,
      momoName: String(form.momoName || "").trim() || undefined,
      momoPhone: String(form.momoPhone || "").trim() || undefined,
      taxId: String(form.taxId || "").trim() || undefined,
      paymentInstructions:
        String(form.paymentInstructions || "").trim() || undefined,
    };

    try {
      const result = await apiFetch(`/owner/suppliers/${supplier.id}/profile`, {
        method: profile?.id ? "PATCH" : "POST",
        body: payload,
      });
      onSaved?.(result);
    } catch (e) {
      setErrorText(
        e?.data?.error || e?.message || "Failed to save supplier profile",
      );
    }
  }

  return (
    <ModalShell
      title="Edit supplier profile"
      subtitle={`Payment setup for ${safe(supplier?.name) || "supplier"}.`}
      onClose={onClose}
    >
      <AlertBox message={errorText} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Preferred payment method
          </label>
          <FormSelect
            value={form.preferredPaymentMethod}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                preferredPaymentMethod: e.target.value,
              }))
            }
          >
            {PAYMENT_METHOD_OPTIONS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </FormSelect>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Payment terms label
          </label>
          <FormInput
            value={form.paymentTermsLabel}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                paymentTermsLabel: e.target.value,
              }))
            }
            placeholder="IMMEDIATE / NET 7 / NET 30"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Payment terms days
          </label>
          <FormInput
            type="number"
            value={form.paymentTermsDays}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, paymentTermsDays: e.target.value }))
            }
            placeholder="0"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Credit limit
          </label>
          <FormInput
            type="number"
            value={form.creditLimit}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, creditLimit: e.target.value }))
            }
            placeholder="0"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Accepted payment methods
          </label>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHOD_OPTIONS.map((method) => {
              const active = form.acceptedPaymentMethods.includes(method);
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => toggleAcceptedMethod(method)}
                  className={
                    "rounded-full border px-4 py-2 text-sm font-semibold transition " +
                    (active
                      ? "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950"
                      : "border-stone-300 bg-white text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200")
                  }
                >
                  {method}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Bank name
          </label>
          <FormInput
            value={form.bankName}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, bankName: e.target.value }))
            }
            placeholder="Bank name"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Bank branch
          </label>
          <FormInput
            value={form.bankBranch}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, bankBranch: e.target.value }))
            }
            placeholder="Bank branch"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Bank account name
          </label>
          <FormInput
            value={form.bankAccountName}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                bankAccountName: e.target.value,
              }))
            }
            placeholder="Account name"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Bank account number
          </label>
          <FormInput
            value={form.bankAccountNumber}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                bankAccountNumber: e.target.value,
              }))
            }
            placeholder="Account number"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            MoMo name
          </label>
          <FormInput
            value={form.momoName}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, momoName: e.target.value }))
            }
            placeholder="MoMo account name"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            MoMo phone
          </label>
          <FormInput
            value={form.momoPhone}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, momoPhone: e.target.value }))
            }
            placeholder="MoMo phone"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Tax ID / TIN
          </label>
          <FormInput
            value={form.taxId}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, taxId: e.target.value }))
            }
            placeholder="Tax ID"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Payment instructions
          </label>
          <textarea
            value={form.paymentInstructions}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                paymentInstructions: e.target.value,
              }))
            }
            rows={4}
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
            placeholder="Instructions for how this supplier should be paid"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          Cancel
        </button>

        <AsyncButton
          idleText="Save profile"
          loadingText="Saving..."
          successText="Saved"
          onClick={handleSave}
        />
      </div>
    </ModalShell>
  );
}

export default function OwnerSupplierProfilesTab() {
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState({
    supplier: null,
    profile: null,
  });

  const [q, setQ] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [active, setActive] = useState("");
  const [hasProfile, setHasProfile] = useState("");

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [editingProfile, setEditingProfile] = useState(false);

  const detailSupplier = normalizeSupplier(selectedDetail?.supplier);
  const detailProfile = normalizeProfile(selectedDetail?.profile);

  const filteredRows = useMemo(() => {
    const query = String(q || "")
      .trim()
      .toLowerCase();

    return suppliers.filter((item) => {
      const supplier = item?.supplier;
      const profile = item?.profile;

      if (
        sourceType &&
        safe(supplier?.sourceType).toUpperCase() !== sourceType
      ) {
        return false;
      }

      if (active === "true" && !supplier?.isActive) return false;
      if (active === "false" && supplier?.isActive) return false;

      if (hasProfile === "yes" && !profile) return false;
      if (hasProfile === "no" && !!profile) return false;

      if (!query) return true;

      const haystack = [
        supplier?.name,
        supplier?.contactName,
        supplier?.phone,
        supplier?.email,
        supplier?.country,
        supplier?.city,
        profile?.preferredPaymentMethod,
        profile?.paymentTermsLabel,
        profile?.bankName,
        profile?.momoName,
        profile?.taxId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [suppliers, q, sourceType, active, hasProfile]);

  const overview = useMemo(() => {
    let total = 0;
    let withProfile = 0;
    let bankPreferred = 0;
    let momoPreferred = 0;
    let cashPreferred = 0;
    let cardPreferred = 0;

    for (const row of filteredRows) {
      total += 1;
      if (row?.profile) withProfile += 1;

      const method = safe(row?.profile?.preferredPaymentMethod).toUpperCase();
      if (method === "BANK") bankPreferred += 1;
      if (method === "MOMO") momoPreferred += 1;
      if (method === "CASH") cashPreferred += 1;
      if (method === "CARD") cardPreferred += 1;
    }

    return {
      total,
      withProfile,
      missingProfile: Math.max(0, total - withProfile),
      bankPreferred,
      momoPreferred,
      cashPreferred,
      cardPreferred,
    };
  }, [filteredRows]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [q, sourceType, active, hasProfile]);

  async function load() {
    setLoading(true);
    setErrorText("");

    try {
      const result = await apiFetch("/owner/suppliers?limit=300", {
        method: "GET",
      });

      const supplierRows = Array.isArray(result?.suppliers)
        ? result.suppliers.map(normalizeSupplier).filter(Boolean)
        : [];

      const detailResults = await Promise.all(
        supplierRows.map(async (supplier) => {
          try {
            const detail = await apiFetch(`/owner/suppliers/${supplier.id}`, {
              method: "GET",
            });

            return {
              supplier: normalizeSupplier(detail?.supplier || supplier),
              profile: normalizeProfile(detail?.profile),
            };
          } catch {
            return {
              supplier,
              profile: null,
            };
          }
        }),
      );

      setSuppliers(detailResults);
      setSelectedSupplierId((prev) =>
        prev &&
        detailResults.some((x) => String(x?.supplier?.id) === String(prev))
          ? prev
          : (detailResults[0]?.supplier?.id ?? null),
      );
    } catch (e) {
      setSuppliers([]);
      setSelectedSupplierId(null);
      setSelectedDetail({ supplier: null, profile: null });
      setErrorText(
        e?.data?.error || e?.message || "Failed to load supplier profiles",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id) {
    if (!id) {
      setSelectedDetail({ supplier: null, profile: null });
      return;
    }

    setDetailLoading(true);
    try {
      const detail = await apiFetch(`/owner/suppliers/${id}`, {
        method: "GET",
      });

      setSelectedDetail({
        supplier: detail?.supplier || null,
        profile: detail?.profile || null,
      });
    } catch (e) {
      setSelectedDetail({ supplier: null, profile: null });
      setErrorText(
        e?.data?.error ||
          e?.message ||
          "Failed to load supplier profile detail",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    loadDetail(selectedSupplierId);
  }, [selectedSupplierId]);

  async function handleSaved(message) {
    setSuccessText(message);
    const nextId = selectedSupplierId;

    setEditingProfile(false);
    await load();

    if (nextId) {
      setSelectedSupplierId(nextId);
      await loadDetail(nextId);
    }

    setTimeout(() => setSuccessText(""), 2500);
  }

  const visibleRows = filteredRows.slice(0, visibleCount);

  return (
    <div className="space-y-6">
      <AlertBox message={errorText} />
      <AlertBox message={successText} tone="success" />

      {loading ? (
        <SectionCard
          title="Supplier profiles"
          subtitle="Loading supplier payment setup and terms."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-3xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-800"
              />
            ))}
          </div>
        </SectionCard>
      ) : (
        <>
          <SectionCard
            title="Profile overview"
            subtitle="See which suppliers have usable payment setup and terms."
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
              <StatCard
                label="Suppliers"
                value={safeNumber(overview?.total)}
                sub="Current filtered rows"
              />
              <StatCard
                label="With profile"
                value={safeNumber(overview?.withProfile)}
                sub="Payment setup exists"
              />
              <StatCard
                label="Missing profile"
                value={safeNumber(overview?.missingProfile)}
                sub="Needs owner setup"
              />
              <StatCard
                label="Bank preferred"
                value={safeNumber(overview?.bankPreferred)}
                sub="Preferred method"
              />
              <StatCard
                label="MoMo preferred"
                value={safeNumber(overview?.momoPreferred)}
                sub="Preferred method"
              />
              <StatCard
                label="Cash preferred"
                value={safeNumber(overview?.cashPreferred)}
                sub="Preferred method"
              />
              <StatCard
                label="Card preferred"
                value={safeNumber(overview?.cardPreferred)}
                sub="Preferred method"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Profile filters"
            subtitle="Filter suppliers by source, active state, and whether payment setup exists."
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <FormInput
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search supplier, bank, momo, tax id, terms"
              />

              <FormSelect
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
              >
                <option value="">All source types</option>
                <option value="LOCAL">Local</option>
                <option value="ABROAD">Abroad</option>
              </FormSelect>

              <FormSelect
                value={active}
                onChange={(e) => setActive(e.target.value)}
              >
                <option value="">All activity states</option>
                <option value="true">Active only</option>
                <option value="false">Inactive only</option>
              </FormSelect>

              <FormSelect
                value={hasProfile}
                onChange={(e) => setHasProfile(e.target.value)}
              >
                <option value="">All profile states</option>
                <option value="yes">Has profile</option>
                <option value="no">Missing profile</option>
              </FormSelect>
            </div>
          </SectionCard>

          <div className="grid gap-6 2xl:grid-cols-[1.05fr_0.95fr]">
            <SectionCard
              title="Supplier profile directory"
              subtitle="Select a supplier to inspect and manage payment setup."
            >
              {filteredRows.length === 0 ? (
                <EmptyState text="No supplier profiles match the current filters." />
              ) : (
                <div className="space-y-4">
                  {visibleRows.map((row) => (
                    <ProfileCard
                      key={row?.supplier?.id}
                      supplier={row?.supplier}
                      profile={row?.profile}
                      active={
                        String(row?.supplier?.id) === String(selectedSupplierId)
                      }
                      onSelect={setSelectedSupplierId}
                    />
                  ))}
                </div>
              )}

              {visibleCount < filteredRows.length ? (
                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                  >
                    Load 20 more
                  </button>
                </div>
              ) : null}
            </SectionCard>

            {detailSupplier ? (
              <SectionCard
                title="Selected profile detail"
                subtitle="Dedicated owner view of supplier payment setup and terms."
                right={
                  <AsyncButton
                    idleText={detailProfile ? "Edit profile" : "Create profile"}
                    loadingText="Opening..."
                    successText="Ready"
                    onClick={async () => setEditingProfile(true)}
                    variant="secondary"
                  />
                }
              >
                {detailLoading ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-28 animate-pulse rounded-3xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-800"
                      />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <StatCard
                        label="Supplier"
                        value={safe(detailSupplier?.name) || "-"}
                        sub={
                          safe(detailSupplier?.contactName) || "No contact name"
                        }
                      />
                      <StatCard
                        label="Preferred method"
                        value={
                          safe(detailProfile?.preferredPaymentMethod) || "-"
                        }
                        sub="Primary payment route"
                      />
                      <StatCard
                        label="Terms"
                        value={safe(detailProfile?.paymentTermsLabel) || "-"}
                        sub={`${safeNumber(detailProfile?.paymentTermsDays)} days`}
                      />
                      <StatCard
                        label={`Credit limit (${normalizeCurrency(
                          detailSupplier?.defaultCurrency,
                        )})`}
                        value={money(
                          detailProfile?.creditLimit,
                          detailSupplier?.defaultCurrency,
                        )}
                        sub="Configured supplier ceiling"
                      />
                    </div>

                    <div className="mt-5 grid gap-4 xl:grid-cols-2">
                      <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                          Supplier identity
                        </p>

                        <div className="mt-4 grid gap-3">
                          <InfoTile
                            label="Supplier"
                            value={safe(detailSupplier?.name) || "-"}
                          />
                          <div className="grid gap-3 sm:grid-cols-2">
                            <InfoTile
                              label="Phone"
                              value={safe(detailSupplier?.phone) || "-"}
                            />
                            <InfoTile
                              label="Email"
                              value={safe(detailSupplier?.email) || "-"}
                            />
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <InfoTile
                              label="Country / City"
                              value={
                                [
                                  safe(detailSupplier?.country),
                                  safe(detailSupplier?.city),
                                ]
                                  .filter(Boolean)
                                  .join(" / ") || "-"
                              }
                            />
                            <InfoTile
                              label="Default currency"
                              value={normalizeCurrency(
                                detailSupplier?.defaultCurrency,
                              )}
                            />
                          </div>
                          <InfoTile
                            label="Address"
                            value={safe(detailSupplier?.address) || "-"}
                          />
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                          Payment setup
                        </p>

                        {detailProfile ? (
                          <div className="mt-4 grid gap-3">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <InfoTile
                                label="Preferred payment method"
                                value={
                                  safe(detailProfile?.preferredPaymentMethod) ||
                                  "-"
                                }
                              />
                              <InfoTile
                                label="Accepted payment methods"
                                value={
                                  Array.isArray(
                                    detailProfile?.acceptedPaymentMethods,
                                  ) &&
                                  detailProfile.acceptedPaymentMethods.length >
                                    0
                                    ? detailProfile.acceptedPaymentMethods.join(
                                        ", ",
                                      )
                                    : "-"
                                }
                              />
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <InfoTile
                                label="Payment terms label"
                                value={
                                  safe(detailProfile?.paymentTermsLabel) || "-"
                                }
                              />
                              <InfoTile
                                label="Payment terms days"
                                value={String(
                                  detailProfile?.paymentTermsDays ?? 0,
                                )}
                              />
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <InfoTile
                                label={`Credit limit (${normalizeCurrency(
                                  detailSupplier?.defaultCurrency,
                                )})`}
                                value={money(
                                  detailProfile?.creditLimit,
                                  detailSupplier?.defaultCurrency,
                                )}
                              />
                              <InfoTile
                                label="Tax ID / TIN"
                                value={safe(detailProfile?.taxId) || "-"}
                              />
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <InfoTile
                                label="Bank name"
                                value={safe(detailProfile?.bankName) || "-"}
                              />
                              <InfoTile
                                label="Bank branch"
                                value={safe(detailProfile?.bankBranch) || "-"}
                              />
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <InfoTile
                                label="Bank account name"
                                value={
                                  safe(detailProfile?.bankAccountName) || "-"
                                }
                              />
                              <InfoTile
                                label="Bank account number"
                                value={
                                  safe(detailProfile?.bankAccountNumber) || "-"
                                }
                              />
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <InfoTile
                                label="MoMo name"
                                value={safe(detailProfile?.momoName) || "-"}
                              />
                              <InfoTile
                                label="MoMo phone"
                                value={safe(detailProfile?.momoPhone) || "-"}
                              />
                            </div>

                            <InfoTile
                              label="Payment instructions"
                              value={
                                safe(detailProfile?.paymentInstructions) ||
                                "No payment instructions recorded"
                              }
                            />

                            <div className="grid gap-3 sm:grid-cols-2">
                              <InfoTile
                                label="Profile created"
                                value={safeDate(detailProfile?.createdAt)}
                              />
                              <InfoTile
                                label="Profile updated"
                                value={safeDate(detailProfile?.updatedAt)}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4">
                            <EmptyState text="This supplier does not have a payment profile yet." />
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </SectionCard>
            ) : (
              <SectionCard
                title="Selected profile detail"
                subtitle="This section appears after a supplier is selected."
              >
                <EmptyState text="Select a supplier profile card above to inspect payment setup and terms." />
              </SectionCard>
            )}
          </div>
        </>
      )}

      <SupplierProfileModal
        open={editingProfile}
        supplier={detailSupplier}
        profile={detailProfile}
        onClose={() => setEditingProfile(false)}
        onSaved={() => handleSaved("Supplier profile saved")}
      />
    </div>
  );
}
