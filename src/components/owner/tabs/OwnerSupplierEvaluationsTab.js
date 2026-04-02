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
    defaultCurrency: row.defaultCurrency ?? row.default_currency ?? "RWF",
    address: row.address ?? "",
    notes: row.notes ?? "",
    isActive: row.isActive ?? row.is_active ?? true,
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
  };
}

function normalizeEvaluation(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    supplierId: row.supplierId ?? row.supplier_id ?? null,
    reliabilityRating: Number(
      row.reliabilityRating ?? row.reliability_rating ?? 0,
    ),
    priceRating: Number(row.priceRating ?? row.price_rating ?? 0),
    qualityRating: Number(row.qualityRating ?? row.quality_rating ?? 0),
    speedRating: Number(row.speedRating ?? row.speed_rating ?? 0),
    communicationRating: Number(
      row.communicationRating ?? row.communication_rating ?? 0,
    ),
    issueCount: Number(row.issueCount ?? row.issue_count ?? 0),
    lastIssueAt: row.lastIssueAt ?? row.last_issue_at ?? null,
    isPreferred: !!(row.isPreferred ?? row.is_preferred),
    isWatchlist: !!(row.isWatchlist ?? row.is_watchlist),
    overallScore: Number(row.overallScore ?? row.overall_score ?? 0),
    riskLevel: row.riskLevel ?? row.risk_level ?? "MEDIUM",
    ownerAssessmentNote:
      row.ownerAssessmentNote ?? row.owner_assessment_note ?? "",
    evaluatedByUserId:
      row.evaluatedByUserId ?? row.evaluated_by_user_id ?? null,
    evaluatedAt: row.evaluatedAt ?? row.evaluated_at ?? null,
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
  };
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

function riskTone(level) {
  const v = safe(level).toUpperCase();
  if (v === "LOW") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300";
  }
  if (v === "HIGH") {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300";
  }
  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300";
}

function evaluationDefaults(evaluation) {
  return {
    reliabilityRating: String(evaluation?.reliabilityRating ?? 0),
    priceRating: String(evaluation?.priceRating ?? 0),
    qualityRating: String(evaluation?.qualityRating ?? 0),
    speedRating: String(evaluation?.speedRating ?? 0),
    communicationRating: String(evaluation?.communicationRating ?? 0),
    issueCount: String(evaluation?.issueCount ?? 0),
    lastIssueAt: evaluation?.lastIssueAt
      ? String(evaluation.lastIssueAt).slice(0, 10)
      : "",
    isPreferred: !!evaluation?.isPreferred,
    isWatchlist: !!evaluation?.isWatchlist,
    riskLevel: safe(evaluation?.riskLevel) || "MEDIUM",
    ownerAssessmentNote: safe(evaluation?.ownerAssessmentNote) || "",
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

function Stars({ value }) {
  const score = Math.max(0, Math.min(5, Number(value || 0)));
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={
            n <= score
              ? "text-base text-amber-500"
              : "text-base text-stone-300 dark:text-stone-700"
          }
        >
          ★
        </span>
      ))}
      <span className="ml-1 text-xs font-semibold text-stone-500 dark:text-stone-400">
        {score}/5
      </span>
    </div>
  );
}

function EvaluationCard({ supplier, evaluation, active, onSelect }) {
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

              {evaluation?.isPreferred ? (
                <Badge
                  className={
                    active
                      ? "border-white/10 bg-white/10 text-white dark:border-stone-900/10 dark:bg-stone-900/10 dark:text-stone-950"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
                  }
                >
                  Preferred
                </Badge>
              ) : null}

              {evaluation?.isWatchlist ? (
                <Badge
                  className={
                    active
                      ? "border-white/10 bg-white/10 text-white dark:border-stone-900/10 dark:bg-stone-900/10 dark:text-stone-950"
                      : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300"
                  }
                >
                  Watchlist
                </Badge>
              ) : null}
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
                <span className="font-medium">Reliability:</span>{" "}
                {safeNumber(evaluation?.reliabilityRating)}/5
              </p>
              <p className="truncate">
                <span className="font-medium">Quality:</span>{" "}
                {safeNumber(evaluation?.qualityRating)}/5
              </p>
              <p className="truncate">
                <span className="font-medium">Price:</span>{" "}
                {safeNumber(evaluation?.priceRating)}/5
              </p>
              <p className="truncate">
                <span className="font-medium">Issues:</span>{" "}
                {safeNumber(evaluation?.issueCount)}
              </p>
            </div>
          </div>

          <div
            className={
              "rounded-2xl border px-4 py-3 xl:min-w-[220px] " +
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
              Overall score
            </p>
            <p className="mt-2 text-xl font-black sm:text-2xl">
              {safeNumber(evaluation?.overallScore)}/500
            </p>
            <div className="mt-2">
              <Badge
                className={
                  active
                    ? "border-white/10 bg-white/10 text-white dark:border-stone-900/10 dark:bg-stone-900/10 dark:text-stone-950"
                    : riskTone(evaluation?.riskLevel)
                }
              >
                Risk {safe(evaluation?.riskLevel) || "MEDIUM"}
              </Badge>
            </div>
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

function SupplierEvaluationModal({
  open,
  supplier,
  evaluation,
  onClose,
  onSaved,
}) {
  if (!open || !supplier) return null;

  return (
    <SupplierEvaluationModalInner
      key={`evaluation-${supplier.id}-${evaluation?.id || "new"}`}
      supplier={supplier}
      evaluation={evaluation}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function SupplierEvaluationModalInner({
  supplier,
  evaluation,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(() => evaluationDefaults(evaluation));
  const [errorText, setErrorText] = useState("");

  async function handleSave() {
    setErrorText("");

    const payload = {
      reliabilityRating: Number(form.reliabilityRating || 0),
      priceRating: Number(form.priceRating || 0),
      qualityRating: Number(form.qualityRating || 0),
      speedRating: Number(form.speedRating || 0),
      communicationRating: Number(form.communicationRating || 0),
      issueCount: Number(form.issueCount || 0),
      lastIssueAt: form.lastIssueAt || undefined,
      isPreferred: !!form.isPreferred,
      isWatchlist: !!form.isWatchlist,
      riskLevel: String(form.riskLevel || "MEDIUM")
        .trim()
        .toUpperCase(),
      ownerAssessmentNote:
        String(form.ownerAssessmentNote || "").trim() || undefined,
    };

    try {
      const result = await apiFetch(
        `/owner/suppliers/${supplier.id}/evaluation`,
        {
          method: evaluation?.id ? "PATCH" : "POST",
          body: payload,
        },
      );
      onSaved?.(result);
    } catch (e) {
      setErrorText(
        e?.data?.error || e?.message || "Failed to save supplier evaluation",
      );
    }
  }

  function ratingField(label, key) {
    return (
      <div>
        <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
          {label}
        </label>
        <FormSelect
          value={form[key]}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, [key]: e.target.value }))
          }
        >
          <option value="0">0</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </FormSelect>
      </div>
    );
  }

  return (
    <ModalShell
      title="Edit supplier evaluation"
      subtitle={`Owner evaluation for ${safe(supplier?.name) || "supplier"}.`}
      onClose={onClose}
    >
      <AlertBox message={errorText} />

      <div className="grid gap-4 md:grid-cols-2">
        {ratingField("Reliability", "reliabilityRating")}
        {ratingField("Price", "priceRating")}
        {ratingField("Quality", "qualityRating")}
        {ratingField("Speed", "speedRating")}
        {ratingField("Communication", "communicationRating")}

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Issue count
          </label>
          <FormInput
            type="number"
            value={form.issueCount}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, issueCount: e.target.value }))
            }
            placeholder="0"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Last issue date
          </label>
          <FormInput
            type="date"
            value={form.lastIssueAt}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, lastIssueAt: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Risk level
          </label>
          <FormSelect
            value={form.riskLevel}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, riskLevel: e.target.value }))
            }
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </FormSelect>
        </div>

        <div className="flex flex-col gap-3 md:justify-end">
          <label className="flex items-center gap-2 rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200">
            <input
              type="checkbox"
              checked={form.isPreferred}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, isPreferred: e.target.checked }))
              }
            />
            Preferred supplier
          </label>

          <label className="flex items-center gap-2 rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200">
            <input
              type="checkbox"
              checked={form.isWatchlist}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, isWatchlist: e.target.checked }))
              }
            />
            Watchlist
          </label>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Owner assessment note
          </label>
          <textarea
            value={form.ownerAssessmentNote}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                ownerAssessmentNote: e.target.value,
              }))
            }
            rows={5}
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
            placeholder="Write the real owner assessment of this supplier"
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
          idleText="Save evaluation"
          loadingText="Saving..."
          successText="Saved"
          onClick={handleSave}
        />
      </div>
    </ModalShell>
  );
}

export default function OwnerSupplierEvaluationsTab() {
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState({
    supplier: null,
    evaluation: null,
  });

  const [q, setQ] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [active, setActive] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [preferredOnly, setPreferredOnly] = useState("");
  const [watchlistOnly, setWatchlistOnly] = useState("");

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [editingEvaluation, setEditingEvaluation] = useState(false);

  const detailSupplier = normalizeSupplier(selectedDetail?.supplier);
  const detailEvaluation = normalizeEvaluation(selectedDetail?.evaluation);

  const filteredRows = useMemo(() => {
    const query = String(q || "")
      .trim()
      .toLowerCase();

    return suppliers.filter((item) => {
      const supplier = item?.supplier;
      const evaluation = item?.evaluation;

      if (
        sourceType &&
        safe(supplier?.sourceType).toUpperCase() !== sourceType
      ) {
        return false;
      }

      if (active === "true" && !supplier?.isActive) return false;
      if (active === "false" && supplier?.isActive) return false;

      if (
        riskLevel &&
        safe(evaluation?.riskLevel).toUpperCase() !== riskLevel
      ) {
        return false;
      }

      if (preferredOnly === "yes" && !evaluation?.isPreferred) return false;
      if (preferredOnly === "no" && !!evaluation?.isPreferred) return false;

      if (watchlistOnly === "yes" && !evaluation?.isWatchlist) return false;
      if (watchlistOnly === "no" && !!evaluation?.isWatchlist) return false;

      if (!query) return true;

      const haystack = [
        supplier?.name,
        supplier?.contactName,
        supplier?.phone,
        supplier?.email,
        supplier?.country,
        supplier?.city,
        evaluation?.riskLevel,
        evaluation?.ownerAssessmentNote,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [
    suppliers,
    q,
    sourceType,
    active,
    riskLevel,
    preferredOnly,
    watchlistOnly,
  ]);

  const overview = useMemo(() => {
    let total = 0;
    let withEvaluation = 0;
    let preferred = 0;
    let watchlist = 0;
    let lowRisk = 0;
    let mediumRisk = 0;
    let highRisk = 0;

    for (const row of filteredRows) {
      const evaluation = row?.evaluation;
      total += 1;
      if (evaluation) withEvaluation += 1;
      if (evaluation?.isPreferred) preferred += 1;
      if (evaluation?.isWatchlist) watchlist += 1;

      const risk = safe(evaluation?.riskLevel).toUpperCase();
      if (risk === "LOW") lowRisk += 1;
      else if (risk === "HIGH") highRisk += 1;
      else if (evaluation) mediumRisk += 1;
    }

    return {
      total,
      withEvaluation,
      missingEvaluation: Math.max(0, total - withEvaluation),
      preferred,
      watchlist,
      lowRisk,
      mediumRisk,
      highRisk,
    };
  }, [filteredRows]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [q, sourceType, active, riskLevel, preferredOnly, watchlistOnly]);

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
              evaluation: normalizeEvaluation(detail?.evaluation),
            };
          } catch {
            return {
              supplier,
              evaluation: null,
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
      setSelectedDetail({ supplier: null, evaluation: null });
      setErrorText(
        e?.data?.error || e?.message || "Failed to load supplier evaluations",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id) {
    if (!id) {
      setSelectedDetail({ supplier: null, evaluation: null });
      return;
    }

    setDetailLoading(true);
    try {
      const detail = await apiFetch(`/owner/suppliers/${id}`, {
        method: "GET",
      });

      setSelectedDetail({
        supplier: detail?.supplier || null,
        evaluation: detail?.evaluation || null,
      });
    } catch (e) {
      setSelectedDetail({ supplier: null, evaluation: null });
      setErrorText(
        e?.data?.error ||
          e?.message ||
          "Failed to load supplier evaluation detail",
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
    setEditingEvaluation(false);

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
          title="Supplier evaluations"
          subtitle="Loading owner performance and risk scoring."
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
            title="Evaluation overview"
            subtitle="See supplier confidence, risk, and owner preference clearly."
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
              <StatCard
                label="Suppliers"
                value={safeNumber(overview?.total)}
                sub="Current filtered rows"
              />
              <StatCard
                label="With evaluation"
                value={safeNumber(overview?.withEvaluation)}
                sub="Owner score exists"
              />
              <StatCard
                label="Missing evaluation"
                value={safeNumber(overview?.missingEvaluation)}
                sub="Needs owner judgment"
              />
              <StatCard
                label="Preferred"
                value={safeNumber(overview?.preferred)}
                sub="Trusted suppliers"
              />
              <StatCard
                label="Watchlist"
                value={safeNumber(overview?.watchlist)}
                sub="Needs caution"
              />
              <StatCard
                label="Low risk"
                value={safeNumber(overview?.lowRisk)}
                sub="Healthy supplier base"
              />
              <StatCard
                label="Medium risk"
                value={safeNumber(overview?.mediumRisk)}
                sub="Needs monitoring"
              />
              <StatCard
                label="High risk"
                value={safeNumber(overview?.highRisk)}
                sub="Immediate attention"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Evaluation filters"
            subtitle="Filter by supplier type, risk, preference, and watchlist state."
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <FormInput
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search supplier, note, risk"
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
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value)}
              >
                <option value="">All risks</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </FormSelect>

              <FormSelect
                value={preferredOnly}
                onChange={(e) => setPreferredOnly(e.target.value)}
              >
                <option value="">All preferred states</option>
                <option value="yes">Preferred only</option>
                <option value="no">Not preferred</option>
              </FormSelect>

              <FormSelect
                value={watchlistOnly}
                onChange={(e) => setWatchlistOnly(e.target.value)}
              >
                <option value="">All watchlist states</option>
                <option value="yes">Watchlist only</option>
                <option value="no">Not watchlist</option>
              </FormSelect>
            </div>
          </SectionCard>

          <div className="grid gap-6 2xl:grid-cols-[1.05fr_0.95fr]">
            <SectionCard
              title="Supplier evaluation directory"
              subtitle="Select a supplier to inspect and manage owner scoring."
            >
              {filteredRows.length === 0 ? (
                <EmptyState text="No supplier evaluations match the current filters." />
              ) : (
                <div className="space-y-4">
                  {visibleRows.map((row) => (
                    <EvaluationCard
                      key={row?.supplier?.id}
                      supplier={row?.supplier}
                      evaluation={row?.evaluation}
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
                title="Selected evaluation detail"
                subtitle="Dedicated owner view of supplier quality, trust, and risk."
                right={
                  <AsyncButton
                    idleText={
                      detailEvaluation ? "Edit evaluation" : "Create evaluation"
                    }
                    loadingText="Opening..."
                    successText="Ready"
                    onClick={async () => setEditingEvaluation(true)}
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
                        label="Overall score"
                        value={`${safeNumber(detailEvaluation?.overallScore)}/500`}
                        sub="Calculated owner score"
                      />
                      <StatCard
                        label="Risk"
                        value={safe(detailEvaluation?.riskLevel) || "-"}
                        sub="Current owner risk label"
                      />
                      <StatCard
                        label="Issues"
                        value={safeNumber(detailEvaluation?.issueCount)}
                        sub="Recorded supplier issues"
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
                              label="Source type"
                              value={safe(detailSupplier?.sourceType) || "-"}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                          Evaluation flags
                        </p>

                        {detailEvaluation ? (
                          <div className="mt-4 grid gap-3">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <InfoTile
                                label="Preferred supplier"
                                value={
                                  detailEvaluation?.isPreferred ? "Yes" : "No"
                                }
                              />
                              <InfoTile
                                label="Watchlist"
                                value={
                                  detailEvaluation?.isWatchlist ? "Yes" : "No"
                                }
                              />
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <InfoTile
                                label="Risk level"
                                value={safe(detailEvaluation?.riskLevel) || "-"}
                              />
                              <InfoTile
                                label="Last issue"
                                value={safeDate(detailEvaluation?.lastIssueAt)}
                              />
                            </div>

                            <InfoTile
                              label="Evaluated at"
                              value={safeDate(detailEvaluation?.evaluatedAt)}
                            />
                          </div>
                        ) : (
                          <div className="mt-4">
                            <EmptyState text="This supplier does not have an owner evaluation yet." />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                        Ratings
                      </p>

                      {detailEvaluation ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                            <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                              Reliability
                            </p>
                            <div className="mt-2">
                              <Stars
                                value={detailEvaluation?.reliabilityRating}
                              />
                            </div>
                          </div>

                          <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                            <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                              Price
                            </p>
                            <div className="mt-2">
                              <Stars value={detailEvaluation?.priceRating} />
                            </div>
                          </div>

                          <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                            <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                              Quality
                            </p>
                            <div className="mt-2">
                              <Stars value={detailEvaluation?.qualityRating} />
                            </div>
                          </div>

                          <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                            <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                              Speed
                            </p>
                            <div className="mt-2">
                              <Stars value={detailEvaluation?.speedRating} />
                            </div>
                          </div>

                          <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 sm:col-span-2 xl:col-span-2">
                            <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                              Communication
                            </p>
                            <div className="mt-2">
                              <Stars
                                value={detailEvaluation?.communicationRating}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4">
                          <EmptyState text="No evaluation ratings recorded yet." />
                        </div>
                      )}
                    </div>

                    <div className="mt-5 rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                        Owner assessment
                      </p>

                      {detailEvaluation ? (
                        <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 text-sm font-semibold text-stone-900 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100">
                          {safe(detailEvaluation?.ownerAssessmentNote) ||
                            "No owner assessment note recorded."}
                        </div>
                      ) : (
                        <div className="mt-4">
                          <EmptyState text="No assessment note recorded yet." />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </SectionCard>
            ) : (
              <SectionCard
                title="Selected evaluation detail"
                subtitle="This section appears after a supplier is selected."
              >
                <EmptyState text="Select a supplier evaluation card above to inspect risk and performance detail." />
              </SectionCard>
            )}
          </div>
        </>
      )}

      <SupplierEvaluationModal
        open={editingEvaluation}
        supplier={detailSupplier}
        evaluation={detailEvaluation}
        onClose={() => setEditingEvaluation(false)}
        onSaved={() => handleSaved("Supplier evaluation saved")}
      />
    </div>
  );
}
