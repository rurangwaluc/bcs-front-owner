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

const PAGE_SIZE = 20;

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

function normalizeListResponse(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.movements)) return result.movements;
  if (Array.isArray(result?.payments)) return result.payments;
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function normalizeSummaryResponse(result) {
  return result?.summary || result || {};
}

function normalizeMovement(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    movementType: row.movementType ?? row.movement_type ?? "",
    direction: String(row.direction || "").toUpperCase(),

    saleId: row.saleId ?? row.sale_id ?? null,
    billId: row.billId ?? row.bill_id ?? null,
    expenseId: row.expenseId ?? row.expense_id ?? null,
    refundId: row.refundId ?? row.refund_id ?? null,
    depositId: row.depositId ?? row.deposit_id ?? null,
    ownerLoanId: row.ownerLoanId ?? row.owner_loan_id ?? null,
    repaymentId: row.repaymentId ?? row.repayment_id ?? null,

    locationId: row.location?.id ?? row.locationId ?? row.location_id ?? null,

    locationName:
      row.location?.name ?? row.locationName ?? row.location_name ?? "",

    locationCode:
      row.location?.code ?? row.locationCode ?? row.location_code ?? "",

    actorUserId: row.actorUserId ?? row.actor_user_id ?? null,
    actorName: row.actorName ?? row.actor_name ?? "",

    cashierId: row.cashierId ?? row.cashier_id ?? null,
    cashierName: row.cashierName ?? row.cashier_name ?? "",

    customerName: row.customerName ?? row.customer_name ?? "",
    customerPhone: row.customerPhone ?? row.customer_phone ?? "",

    supplierName: row.supplierName ?? row.supplier_name ?? "",
    payeeName: row.payeeName ?? row.payee_name ?? "",

    amount: Number(row.amount ?? 0),
    method: String(row.method || "OTHER").toUpperCase(),
    reference: row.reference ?? "",
    note: row.note ?? "",
    cashSessionId: row.cashSessionId ?? row.cash_session_id ?? null,
    createdAt: row.createdAt ?? row.created_at ?? null,
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
  if (safe(row?.actorName)) return safe(row.actorName);
  if (safe(row?.cashierName)) return safe(row.cashierName);
  if (row?.actorUserId != null) return `User #${safeNumber(row.actorUserId)}`;
  if (row?.cashierId != null) return `User #${safeNumber(row.cashierId)}`;
  return "-";
}

function movementTypeLabel(value) {
  const v = String(value || "")
    .trim()
    .toUpperCase();

  if (v === "CUSTOMER_PAYMENT") return "Customer payment";
  if (v === "SUPPLIER_BILL_PAYMENT") return "Supplier bill payment";
  if (v === "EXPENSE") return "Expense";
  if (v === "REFUND") return "Refund";
  if (v === "DEPOSIT_OUT") return "Money sent out";
  if (v === "OWNER_LOAN_OUT") return "Money given out as loan";
  if (v === "OWNER_LOAN_REPAYMENT_IN") return "Loan repayment received";
  return safe(value) || "Movement";
}

function movementTone(value) {
  const v = String(value || "")
    .trim()
    .toUpperCase();

  if (v === "CUSTOMER_PAYMENT" || v === "OWNER_LOAN_REPAYMENT_IN") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (v === "SUPPLIER_BILL_PAYMENT") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }

  if (v === "EXPENSE" || v === "OWNER_LOAN_OUT") {
    return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
  }

  if (v === "REFUND") {
    return "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300";
  }

  if (v === "DEPOSIT_OUT") {
    return "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300";
  }

  return "bg-stone-100 text-stone-700 dark:bg-stone-900 dark:text-stone-300";
}

function directionLabel(value) {
  return String(value || "").toUpperCase() === "OUT" ? "Money out" : "Money in";
}

function directionTone(value) {
  return String(value || "").toUpperCase() === "OUT"
    ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
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

function counterpartyLabel(row) {
  const movementType = String(row?.movementType || "")
    .trim()
    .toUpperCase();

  if (movementType === "CUSTOMER_PAYMENT") {
    if (safe(row?.customerName)) return safe(row.customerName);
    if (safe(row?.customerPhone)) return safe(row.customerPhone);
    return "Customer";
  }

  if (movementType === "SUPPLIER_BILL_PAYMENT") {
    if (safe(row?.supplierName)) return safe(row.supplierName);
    return "Supplier";
  }

  if (movementType === "EXPENSE") {
    if (safe(row?.payeeName)) return safe(row.payeeName);
    return "Business expense";
  }

  if (movementType === "REFUND") {
    if (safe(row?.customerName)) return safe(row.customerName);
    if (safe(row?.customerPhone)) return safe(row.customerPhone);
    return "Refund";
  }

  if (movementType === "DEPOSIT_OUT") {
    return "Money moved out";
  }

  if (
    movementType === "OWNER_LOAN_OUT" ||
    movementType === "OWNER_LOAN_REPAYMENT_IN"
  ) {
    if (safe(row?.payeeName)) return safe(row.payeeName);
    if (safe(row?.customerName)) return safe(row.customerName);
    return "Loan receiver";
  }

  return "-";
}

function movementEntityLabel(row) {
  const movementType = String(row?.movementType || "")
    .trim()
    .toUpperCase();

  if (movementType === "CUSTOMER_PAYMENT" && row?.saleId != null) {
    return `Sale #${safeNumber(row.saleId)}`;
  }

  if (movementType === "SUPPLIER_BILL_PAYMENT" && row?.billId != null) {
    return `Supplier bill #${safeNumber(row.billId)}`;
  }

  if (movementType === "EXPENSE" && row?.expenseId != null) {
    return `Expense #${safeNumber(row.expenseId)}`;
  }

  if (movementType === "REFUND" && row?.refundId != null) {
    return `Refund #${safeNumber(row.refundId)}`;
  }

  if (movementType === "DEPOSIT_OUT" && row?.depositId != null) {
    return `Money-out #${safeNumber(row.depositId)}`;
  }

  if (movementType === "OWNER_LOAN_OUT" && row?.ownerLoanId != null) {
    return `Loan #${safeNumber(row.ownerLoanId)}`;
  }

  if (
    movementType === "OWNER_LOAN_REPAYMENT_IN" &&
    row?.ownerLoanId != null &&
    row?.repaymentId != null
  ) {
    return `Loan #${safeNumber(row.ownerLoanId)} repayment #${safeNumber(row.repaymentId)}`;
  }

  return "-";
}

function MovementChip({ text, className = "" }) {
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

function DetailItem({ label, value, valueClassName = "" }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
        {label}
      </p>
      <p
        className={cx(
          "mt-2 break-words text-sm font-semibold text-stone-950 dark:text-stone-50",
          valueClassName,
        )}
      >
        {value}
      </p>
    </div>
  );
}

function MovementDetailsDrawer({ open, movement, onClose }) {
  if (!open || !movement) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <div
        className="absolute inset-0 bg-stone-950/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 right-0 w-full max-w-2xl overflow-y-auto border-l border-stone-200 bg-stone-50 shadow-[0_30px_80px_rgba(2,6,23,0.22)] dark:border-stone-800 dark:bg-stone-950">
        <div className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 px-5 py-5 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <MovementChip
                  text={movementTypeLabel(movement?.movementType)}
                  className={movementTone(movement?.movementType)}
                />
                <MovementChip
                  text={directionLabel(movement?.direction)}
                  className={directionTone(movement?.direction)}
                />
                <MovementChip
                  text={methodLabel(movement?.method)}
                  className={methodTone(movement?.method)}
                />
              </div>

              <h3 className="mt-3 text-xl font-black tracking-[-0.03em] text-stone-950 dark:text-stone-50">
                Movement #{safeNumber(movement?.id)}
              </h3>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                Focused owner view of what happened, who was involved, and which
                record this movement belongs to.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-600 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              ×
            </button>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Type"
              value={movementTypeLabel(movement?.movementType)}
              sub={directionLabel(movement?.direction)}
              valueClassName="text-[17px] leading-tight"
            />
            <StatCard
              label="Amount"
              value={money(movement?.amount)}
              sub={methodLabel(movement?.method)}
              valueClassName={cx(
                "text-[17px] leading-tight",
                String(movement?.direction || "").toUpperCase() === "OUT"
                  ? "text-rose-700 dark:text-rose-300"
                  : "text-emerald-700 dark:text-emerald-300",
              )}
            />
            <StatCard
              label="Branch"
              value={displayBranch(movement)}
              sub={movementEntityLabel(movement)}
              valueClassName="text-[17px] leading-tight"
            />
            <StatCard
              label="Recorded by"
              value={displayActor(movement)}
              sub={safeDate(movement?.createdAt)}
              valueClassName="text-[17px] leading-tight"
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <SectionCard
              title="Movement profile"
              subtitle="Business meaning of this money movement."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailItem
                  label="Direction"
                  value={directionLabel(movement?.direction)}
                />
                <DetailItem
                  label="Method"
                  value={methodLabel(movement?.method)}
                />
                <DetailItem
                  label="Counterparty"
                  value={counterpartyLabel(movement)}
                />
                <DetailItem
                  label="Related record"
                  value={movementEntityLabel(movement)}
                />
                <div className="sm:col-span-2">
                  <DetailItem
                    label="Reference"
                    value={safe(movement?.reference) || "No reference"}
                  />
                </div>
                <div className="sm:col-span-2">
                  <DetailItem
                    label="Note"
                    value={safe(movement?.note) || "No note recorded"}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Traceability"
              subtitle="Who recorded it, where it happened, and the identifiers tied to it."
            >
              <div className="grid gap-3">
                <DetailItem
                  label="Recorded by"
                  value={displayActor(movement)}
                />
                <DetailItem label="Branch" value={displayBranch(movement)} />
                <DetailItem
                  label="Recorded at"
                  value={safeDate(movement?.createdAt)}
                  valueClassName="text-amber-700 dark:text-amber-300"
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailItem
                    label="Sale ID"
                    value={
                      movement?.saleId != null
                        ? `#${safeNumber(movement.saleId)}`
                        : "-"
                    }
                  />
                  <DetailItem
                    label="Supplier bill ID"
                    value={
                      movement?.billId != null
                        ? `#${safeNumber(movement.billId)}`
                        : "-"
                    }
                  />
                  <DetailItem
                    label="Expense ID"
                    value={
                      movement?.expenseId != null
                        ? `#${safeNumber(movement.expenseId)}`
                        : "-"
                    }
                  />
                  <DetailItem
                    label="Refund ID"
                    value={
                      movement?.refundId != null
                        ? `#${safeNumber(movement.refundId)}`
                        : "-"
                    }
                  />
                  <DetailItem
                    label="Money-out ID"
                    value={
                      movement?.depositId != null
                        ? `#${safeNumber(movement.depositId)}`
                        : "-"
                    }
                  />
                  <DetailItem
                    label="Loan / repayment"
                    value={
                      movement?.ownerLoanId != null
                        ? movement?.repaymentId != null
                          ? `Loan #${safeNumber(movement.ownerLoanId)} • Repayment #${safeNumber(movement.repaymentId)}`
                          : `Loan #${safeNumber(movement.ownerLoanId)}`
                        : "-"
                    }
                  />
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OwnerPaymentsMovementsTab({ locations = [] }) {
  const [loading, setLoading] = useState(true);
  const [refreshState, setRefreshState] = useState("idle");
  const [errorText, setErrorText] = useState("");

  const [summary, setSummary] = useState(null);
  const [movements, setMovements] = useState([]);

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedMovementId, setSelectedMovementId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [locationId, setLocationId] = useState("");
  const [method, setMethod] = useState("");
  const [direction, setDirection] = useState("");
  const [movementType, setMovementType] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const locationOptions = useMemo(() => {
    return Array.isArray(locations)
      ? locations.filter(
          (row) => String(row?.status || "").toUpperCase() !== "ARCHIVED",
        )
      : [];
  }, [locations]);

  const normalizedMovements = useMemo(() => {
    return (Array.isArray(movements) ? movements : [])
      .map(normalizeMovement)
      .filter(Boolean);
  }, [movements]);

  const filteredMovements = useMemo(() => {
    const q = String(search || "")
      .trim()
      .toLowerCase();

    return normalizedMovements.filter((row) => {
      if (locationId && String(row?.locationId) !== String(locationId)) {
        return false;
      }

      if (method) {
        const rowMethod = String(row?.method || "").toUpperCase();
        if (rowMethod !== String(method).toUpperCase()) return false;
      }

      if (direction) {
        const rowDirection = String(row?.direction || "").toUpperCase();
        if (rowDirection !== String(direction).toUpperCase()) return false;
      }

      if (movementType) {
        const rowType = String(row?.movementType || "").toUpperCase();
        if (rowType !== String(movementType).toUpperCase()) return false;
      }

      if (!q) return true;

      const hay = [
        row?.id,
        row?.movementType,
        row?.direction,
        row?.amount,
        row?.method,
        row?.reference,
        row?.note,
        row?.customerName,
        row?.customerPhone,
        row?.supplierName,
        row?.payeeName,
        row?.actorName,
        row?.cashierName,
        row?.locationName,
        row?.locationCode,
        row?.saleId,
        row?.billId,
        row?.expenseId,
        row?.refundId,
        row?.depositId,
        row?.ownerLoanId,
        row?.repaymentId,
      ]
        .map((x) => String(x ?? ""))
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [
    normalizedMovements,
    search,
    locationId,
    method,
    direction,
    movementType,
  ]);

  const visibleRows = useMemo(() => {
    return filteredMovements.slice(0, visibleCount);
  }, [filteredMovements, visibleCount]);

  const hasMoreRows = visibleCount < filteredMovements.length;

  const selectedMovement = useMemo(() => {
    if (selectedMovementId == null) {
      return filteredMovements[0] || null;
    }

    return (
      filteredMovements.find(
        (row) => String(row.id) === String(selectedMovementId),
      ) || null
    );
  }, [filteredMovements, selectedMovementId]);

  const cards = useMemo(() => {
    const totals = summary?.totals || {};
    return {
      totalMoneyIn: Number(totals.totalMoneyIn ?? 0),
      totalMoneyOut: Number(totals.totalMoneyOut ?? 0),
      netAmount: Number(totals.netAmount ?? 0),
      movementsCount: Number(totals.movementsCount ?? 0),
      branchesCount: Number(totals.branchesCount ?? 0),
      moneyInCount: Number(totals.moneyInCount ?? 0),
      moneyOutCount: Number(totals.moneyOutCount ?? 0),
    };
  }, [summary]);

  function buildParams() {
    const params = new URLSearchParams();

    if (locationId) params.set("locationId", locationId);
    if (method) params.set("method", method);
    if (from) params.set("dateFrom", from);
    if (to) params.set("dateTo", to);

    params.set("limit", "200");
    params.set("offset", "0");

    return params.toString();
  }

  async function loadData() {
    setLoading(true);
    setErrorText("");

    try {
      const query = buildParams();

      const summaryUrl = `/owner/payments/summary${query ? `?${query}` : ""}`;
      const listUrl = `/owner/payments${query ? `?${query}` : ""}`;

      const [summaryRes, listRes] = await Promise.allSettled([
        apiFetch(summaryUrl, { method: "GET" }),
        apiFetch(listUrl, { method: "GET" }),
      ]);

      let nextError = "";

      if (summaryRes.status === "fulfilled") {
        setSummary(normalizeSummaryResponse(summaryRes.value));
      } else {
        setSummary(null);
        nextError =
          summaryRes.reason?.data?.error ||
          summaryRes.reason?.message ||
          "Payments summary request failed";
      }

      if (listRes.status === "fulfilled") {
        const rows = normalizeListResponse(listRes.value)
          .map(normalizeMovement)
          .filter(Boolean);

        setMovements(rows);
        setSelectedMovementId((prev) =>
          prev && rows.some((x) => String(x.id) === String(prev))
            ? prev
            : (rows[0]?.id ?? null),
        );
      } else {
        setMovements([]);
        setSelectedMovementId(null);
        nextError =
          listRes.reason?.data?.error ||
          listRes.reason?.message ||
          nextError ||
          "Payments list request failed";
      }

      setErrorText(nextError);
    } catch (e) {
      setSummary(null);
      setMovements([]);
      setSelectedMovementId(null);
      setErrorText(
        e?.data?.error || e?.message || "Failed to load payment movements",
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

  function handleOpenMovement(row) {
    setSelectedMovementId(row?.id ?? null);
    setDrawerOpen(true);
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadData();
    }, 220);

    return () => clearTimeout(timeout);
  }, [locationId, method, from, to]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, locationId, method, direction, movementType, from, to]);

  return (
    <div className="space-y-5">
      {errorText ? <AlertBox tone="danger">{errorText}</AlertBox> : null}

      <SectionCard
        title="Money movements"
        subtitle="Owner-grade history of every money-in and money-out action, with filters and a clean detail drawer."
        right={
          <AsyncButton
            variant="secondary"
            idleText="Refresh"
            loadingText="Refreshing..."
            successText="Done"
            onClick={refreshNow}
          />
        }
      >
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatCard
              label="Money in"
              value={money(cards.totalMoneyIn)}
              sub={`${safeNumber(cards.moneyInCount)} record(s)`}
              valueClassName="text-[17px] leading-tight text-emerald-700 dark:text-emerald-300"
            />

            <StatCard
              label="Money out"
              value={money(cards.totalMoneyOut)}
              sub={`${safeNumber(cards.moneyOutCount)} record(s)`}
              valueClassName="text-[17px] leading-tight text-rose-700 dark:text-rose-300"
            />

            <StatCard
              label="Net"
              value={money(cards.netAmount)}
              sub="Filtered result"
              valueClassName={cx(
                "text-[17px] leading-tight",
                cards.netAmount >= 0
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-rose-700 dark:text-rose-300",
              )}
            />

            <StatCard
              label="Movements"
              value={safeNumber(filteredMovements.length)}
              sub={`${safeNumber(cards.movementsCount)} total loaded`}
              valueClassName="text-[17px] leading-tight"
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.7fr_0.7fr]">
            <FormInput
              placeholder="Search by person, supplier, note, reference, sale, bill, expense, refund, or loan"
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

          <div className="grid gap-3 lg:grid-cols-[0.8fr_0.8fr_1fr_1fr]">
            <FormSelect
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
            >
              <option value="">All directions</option>
              <option value="IN">Money in</option>
              <option value="OUT">Money out</option>
            </FormSelect>

            <FormSelect
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
            >
              <option value="">All movement types</option>
              <option value="CUSTOMER_PAYMENT">Customer payment</option>
              <option value="SUPPLIER_BILL_PAYMENT">
                Supplier bill payment
              </option>
              <option value="EXPENSE">Expense</option>
              <option value="REFUND">Refund</option>
              <option value="DEPOSIT_OUT">Money sent out</option>
              <option value="OWNER_LOAN_OUT">Owner loan out</option>
              <option value="OWNER_LOAN_REPAYMENT_IN">
                Owner loan repayment
              </option>
            </FormSelect>

            <FormInput
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />

            <FormInput
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setLocationId("");
                setMethod("");
                setDirection("");
                setMovementType("");
                setSearch("");
                setFrom("");
                setTo("");
              }}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Clear filters
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Movement history"
        subtitle="Select any row to open the detail drawer."
      >
        <div className="grid gap-4">
          {loading ? (
            <div className="grid gap-3">
              <div className="h-28 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
              <div className="h-28 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
              <div className="h-28 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
            </div>
          ) : filteredMovements.length === 0 ? (
            <EmptyState text="No money movement found for the selected filters." />
          ) : (
            <>
              <div className="grid gap-3">
                {visibleRows.map((row) => {
                  const isSelected =
                    selectedMovement &&
                    String(selectedMovement.id) === String(row.id);

                  return (
                    <button
                      key={`${row.id}-${row.movementType}-${row.direction}`}
                      type="button"
                      onClick={() => handleOpenMovement(row)}
                      className={cx(
                        "w-full rounded-[24px] border p-4 text-left transition",
                        isSelected && drawerOpen
                          ? "border-stone-900 bg-stone-100 dark:border-stone-100 dark:bg-stone-900"
                          : "border-stone-200 bg-white hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-950 dark:hover:bg-stone-900",
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <MovementChip
                              text={movementTypeLabel(row?.movementType)}
                              className={movementTone(row?.movementType)}
                            />
                            <MovementChip
                              text={directionLabel(row?.direction)}
                              className={directionTone(row?.direction)}
                            />
                            <MovementChip
                              text={methodLabel(row?.method)}
                              className={methodTone(row?.method)}
                            />
                          </div>

                          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                Counterparty
                              </p>
                              <p className="mt-1 text-sm font-semibold text-stone-950 dark:text-stone-50">
                                {counterpartyLabel(row)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                Branch
                              </p>
                              <p className="mt-1 text-sm font-semibold text-stone-950 dark:text-stone-50">
                                {displayBranch(row)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                Related record
                              </p>
                              <p className="mt-1 text-sm font-semibold text-stone-950 dark:text-stone-50">
                                {movementEntityLabel(row)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                Recorded by
                              </p>
                              <p className="mt-1 text-sm font-semibold text-stone-950 dark:text-stone-50">
                                {displayActor(row)}
                              </p>
                            </div>
                          </div>

                          {(safe(row?.reference) || safe(row?.note)) && (
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              <div>
                                <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                  Reference
                                </p>
                                <p className="mt-1 break-words text-sm text-stone-700 dark:text-stone-300">
                                  {safe(row?.reference) || "No reference"}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                  Note
                                </p>
                                <p className="mt-1 break-words text-sm text-stone-700 dark:text-stone-300">
                                  {safe(row?.note) || "No note"}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                            Amount
                          </p>
                          <p
                            className={cx(
                              "mt-1 text-lg font-black",
                              String(row?.direction || "").toUpperCase() ===
                                "OUT"
                                ? "text-rose-700 dark:text-rose-300"
                                : "text-emerald-700 dark:text-emerald-300",
                            )}
                          >
                            {String(row?.direction || "").toUpperCase() ===
                            "OUT"
                              ? "-"
                              : "+"}
                            {money(row?.amount)}
                          </p>
                          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                            {safeDate(row?.createdAt)}
                          </p>
                          <p className="mt-3 text-xs font-semibold text-stone-500 dark:text-stone-400">
                            Tap to inspect
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {hasMoreRows ? (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                  >
                    Load more
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </SectionCard>

      <MovementDetailsDrawer
        open={drawerOpen && !!selectedMovement}
        movement={selectedMovement}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
