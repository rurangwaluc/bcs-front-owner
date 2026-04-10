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

function money(v, currency = "RWF") {
  return `${String(currency || "RWF").toUpperCase()} ${safeNumber(
    v,
  ).toLocaleString()}`;
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

function normalizeBreakdownResponse(result) {
  return result?.breakdown || result || {};
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
  return safe(value) || "Movement";
}

function movementTone(value) {
  const v = String(value || "")
    .trim()
    .toUpperCase();

  if (v === "CUSTOMER_PAYMENT") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (v === "SUPPLIER_BILL_PAYMENT") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }

  if (v === "EXPENSE") {
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

export default function OwnerPaymentsTab({ locations = [] }) {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshState, setRefreshState] = useState("idle");
  const [errorText, setErrorText] = useState("");

  const [summary, setSummary] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [movements, setMovements] = useState([]);

  const [selectedMovementId, setSelectedMovementId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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
      ]
        .map((x) => String(x ?? ""))
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [normalizedMovements, search, direction, movementType]);

  const visibleRows = useMemo(() => {
    return filteredMovements.slice(0, visibleCount);
  }, [filteredMovements, visibleCount]);

  const hasMoreRows = visibleCount < filteredMovements.length;

  const selectedMovement = useMemo(() => {
    if (selectedMovementId == null)
      return visibleRows[0] || filteredMovements[0] || null;

    return (
      filteredMovements.find(
        (row) => String(row.id) === String(selectedMovementId),
      ) || null
    );
  }, [filteredMovements, selectedMovementId, visibleRows]);

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

  const byMethodRows = useMemo(() => {
    return Array.isArray(breakdown?.byMethod) ? breakdown.byMethod : [];
  }, [breakdown]);

  const byLocationMethodRows = useMemo(() => {
    return Array.isArray(breakdown?.byLocationMethod)
      ? breakdown.byLocationMethod
      : [];
  }, [breakdown]);

  const quickStats = useMemo(() => {
    let cashNet = 0;
    let momoNet = 0;
    let bankNet = 0;
    let cardNet = 0;

    for (const row of byMethodRows) {
      const amt = Number(row?.netAmount ?? 0);

      switch (String(row?.method || "").toUpperCase()) {
        case "CASH":
          cashNet += amt;
          break;
        case "MOMO":
          momoNet += amt;
          break;
        case "BANK":
          bankNet += amt;
          break;
        case "CARD":
          cardNet += amt;
          break;
        default:
          break;
      }
    }

    return { cashNet, momoNet, bankNet, cardNet };
  }, [byMethodRows]);

  function buildParams() {
    const params = new URLSearchParams();

    if (locationId) params.set("locationId", locationId);
    if (method) params.set("method", method);
    if (from) params.set("dateFrom", from);
    if (to) params.set("dateTo", to);

    params.set("limit", String(200));
    params.set("offset", String(0));

    return params.toString();
  }

  async function loadData() {
    setLoading(true);
    setErrorText("");

    try {
      const query = buildParams();
      const summaryUrl = `/owner/payments/summary${query ? `?${query}` : ""}`;
      const breakdownUrl = `/owner/payments/breakdown${query ? `?${query}` : ""}`;
      const listUrl = `/owner/payments${query ? `?${query}` : ""}`;

      const [summaryRes, breakdownRes, listRes] = await Promise.allSettled([
        apiFetch(summaryUrl, { method: "GET" }),
        apiFetch(breakdownUrl, { method: "GET" }),
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
      setBreakdown(null);
      setMovements([]);
      setSelectedMovementId(null);
      setErrorText(
        e?.data?.error || e?.message || "Failed to load owner payments",
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

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadData();
    }, 220);

    return () => clearTimeout(timeout);
  }, [locationId, method, from, to]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, direction, movementType, locationId, method, from, to]);

  const totalInTone =
    cards.totalMoneyIn >= cards.totalMoneyOut
      ? "text-emerald-700 dark:text-emerald-300"
      : "text-stone-950 dark:text-stone-50";

  const totalOutTone =
    cards.totalMoneyOut > 0
      ? "text-rose-700 dark:text-rose-300"
      : "text-stone-950 dark:text-stone-50";

  const netTone =
    cards.netAmount >= 0
      ? "text-emerald-700 dark:text-emerald-300"
      : "text-rose-700 dark:text-rose-300";

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Money in, money out, and net position"
          subtitle="Owner view of money received, money that left, and the net result across branches and payment methods."
        >
          <div className="grid gap-4">
            {errorText ? <AlertBox tone="danger">{errorText}</AlertBox> : null}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Money in"
                value={money(cards.totalMoneyIn)}
                sub={`${safeNumber(cards.moneyInCount)} record(s)`}
                valueClassName={`text-[17px] leading-tight ${totalInTone}`}
              />

              <StatCard
                label="Money out"
                value={money(cards.totalMoneyOut)}
                sub={`${safeNumber(cards.moneyOutCount)} record(s)`}
                valueClassName={`text-[17px] leading-tight ${totalOutTone}`}
              />

              <StatCard
                label="Net"
                value={money(cards.netAmount)}
                sub="Money in minus money out"
                valueClassName={`text-[17px] leading-tight ${netTone}`}
              />

              <StatCard
                label="Branches involved"
                value={safeNumber(cards.branchesCount)}
                sub={`${safeNumber(cards.movementsCount)} total movement(s)`}
                valueClassName="text-[17px] leading-tight"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  Cash net
                </p>
                <p className="mt-2 text-lg font-black text-stone-950 dark:text-stone-50">
                  {money(quickStats.cashNet)}
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  Mobile money net
                </p>
                <p className="mt-2 text-lg font-black text-stone-950 dark:text-stone-50">
                  {money(quickStats.momoNet)}
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  Bank net
                </p>
                <p className="mt-2 text-lg font-black text-stone-950 dark:text-stone-50">
                  {money(quickStats.bankNet)}
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  Card net
                </p>
                <p className="mt-2 text-lg font-black text-stone-950 dark:text-stone-50">
                  {money(quickStats.cardNet)}
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Filters"
          subtitle="Narrow the owner money view by branch, method, date, direction, or movement type."
        >
          <div className="grid gap-3">
            <FormSelect
              label="Branch"
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
              label="Payment method"
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

            <div className="grid gap-3 sm:grid-cols-2">
              <FormInput
                label="From date"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />

              <FormInput
                label="To date"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <AsyncButton
                type="button"
                variant="secondary"
                state={refreshState}
                text="Refresh"
                loadingText="Refreshing..."
                successText="Done"
                onClick={refreshNow}
              />

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
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="Net by payment method"
          subtitle="Each method shows money in, money out, and the net result."
        >
          {loading ? (
            <div className="grid gap-3">
              <div className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
              <div className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
              <div className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
            </div>
          ) : byMethodRows.length === 0 ? (
            <EmptyState text="No payment-method movement found for the selected filters." />
          ) : (
            <div className="grid gap-3">
              {byMethodRows.map((row, idx) => {
                const methodName = methodLabel(row?.method);
                const moneyIn = Number(row?.totalMoneyIn ?? 0);
                const moneyOut = Number(row?.totalMoneyOut ?? 0);
                const net = Number(row?.netAmount ?? 0);

                return (
                  <div
                    key={`${row?.method || "method"}-${idx}`}
                    className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <MovementChip
                            text={methodName}
                            className={methodTone(row?.method)}
                          />
                          <span className="text-xs text-stone-500 dark:text-stone-400">
                            {safeNumber(row?.count)} movement(s)
                          </span>
                        </div>

                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                              Money in
                            </p>
                            <p className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                              {money(moneyIn)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                              Money out
                            </p>
                            <p className="mt-1 text-sm font-semibold text-rose-700 dark:text-rose-300">
                              {money(moneyOut)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                              Net
                            </p>
                            <p
                              className={[
                                "mt-1 text-sm font-semibold",
                                net >= 0
                                  ? "text-emerald-700 dark:text-emerald-300"
                                  : "text-rose-700 dark:text-rose-300",
                              ].join(" ")}
                            >
                              {money(net)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Net by branch and method"
          subtitle="Shows where money is strongest or weakest across branches."
        >
          {loading ? (
            <div className="grid gap-3">
              <div className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
              <div className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
            </div>
          ) : byLocationMethodRows.length === 0 ? (
            <EmptyState text="No branch-method movement found for the selected filters." />
          ) : (
            <div className="grid gap-3">
              {byLocationMethodRows.slice(0, 10).map((row, idx) => {
                const net = Number(row?.netAmount ?? 0);

                return (
                  <div
                    key={`${row?.locationId || "loc"}-${row?.method || "m"}-${idx}`}
                    className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-950 dark:text-stone-50">
                          {safe(row?.locationName) ||
                            `Branch #${safeNumber(row?.locationId)}`}
                          {safe(row?.locationCode)
                            ? ` (${safe(row.locationCode)})`
                            : ""}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <MovementChip
                            text={methodLabel(row?.method)}
                            className={methodTone(row?.method)}
                          />
                          <span className="text-xs text-stone-500 dark:text-stone-400">
                            {safeNumber(row?.count)} movement(s)
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                          Net
                        </p>
                        <p
                          className={[
                            "mt-1 text-base font-black",
                            net >= 0
                              ? "text-emerald-700 dark:text-emerald-300"
                              : "text-rose-700 dark:text-rose-300",
                          ].join(" ")}
                        >
                          {money(net)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Money movement history"
        subtitle="Every row shows whether money came in or went out, who was involved, the method used, and where it happened."
      >
        <div className="grid gap-4">
          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.6fr_0.8fr]">
            <FormInput
              label="Search"
              placeholder="Search by person, supplier, note, reference, sale, bill, expense or refund"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <FormSelect
              label="Direction"
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
            >
              <option value="">All directions</option>
              <option value="IN">Money in</option>
              <option value="OUT">Money out</option>
            </FormSelect>

            <FormSelect
              label="Movement type"
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
            </FormSelect>
          </div>

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
                      onClick={() => setSelectedMovementId(row.id)}
                      className={[
                        "w-full rounded-[24px] border p-4 text-left transition",
                        isSelected
                          ? "border-stone-900 bg-stone-100 dark:border-stone-100 dark:bg-stone-900"
                          : "border-stone-200 bg-white hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-950 dark:hover:bg-stone-900",
                      ].join(" ")}
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
                            className={[
                              "mt-1 text-lg font-black",
                              String(row?.direction || "").toUpperCase() ===
                              "OUT"
                                ? "text-rose-700 dark:text-rose-300"
                                : "text-emerald-700 dark:text-emerald-300",
                            ].join(" ")}
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
                    disabled={loadingMore}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                  >
                    {loadingMore ? "Loading..." : "Load more"}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </SectionCard>

      {selectedMovement ? (
        <SectionCard
          title="Selected movement detail"
          subtitle="Focused owner view of what happened, where it happened, who recorded it, and which business record it belongs to."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Type"
              value={movementTypeLabel(selectedMovement?.movementType)}
              sub={directionLabel(selectedMovement?.direction)}
              valueClassName="text-[17px] leading-tight"
            />

            <StatCard
              label="Amount"
              value={money(selectedMovement?.amount)}
              sub={methodLabel(selectedMovement?.method)}
              valueClassName="text-[17px] leading-tight"
            />

            <StatCard
              label="Branch"
              value={displayBranch(selectedMovement)}
              sub={movementEntityLabel(selectedMovement)}
              valueClassName="text-[17px] leading-tight"
            />

            <StatCard
              label="Recorded by"
              value={displayActor(selectedMovement)}
              sub={safeDate(selectedMovement?.createdAt)}
              valueClassName="text-[17px] leading-tight"
            />
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                Movement profile
              </p>

              <div className="mt-4 grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                    <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                      Direction
                    </p>
                    <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                      {directionLabel(selectedMovement?.direction)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                    <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                      Method
                    </p>
                    <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                      {methodLabel(selectedMovement?.method)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                    <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                      Counterparty
                    </p>
                    <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                      {counterpartyLabel(selectedMovement)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                    <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                      Related record
                    </p>
                    <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                      {movementEntityLabel(selectedMovement)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 sm:col-span-2">
                    <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                      Reference
                    </p>
                    <p className="mt-2 break-words text-sm font-semibold text-stone-950 dark:text-stone-50">
                      {safe(selectedMovement?.reference) || "No reference"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 sm:col-span-2">
                    <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                      Note
                    </p>
                    <p className="mt-2 break-words text-sm font-semibold text-stone-950 dark:text-stone-50">
                      {safe(selectedMovement?.note) || "No note recorded"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                Traceability
              </p>

              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                  <p className="text-xs uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                    Recorded by
                  </p>
                  <p className="mt-2 text-xl font-black text-stone-950 dark:text-stone-50">
                    {displayActor(selectedMovement)}
                  </p>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                  <p className="text-xs uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                    Branch
                  </p>
                  <p className="mt-2 text-xl font-black text-stone-950 dark:text-stone-50">
                    {displayBranch(selectedMovement)}
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
                  <p className="text-xs uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
                    Recorded at
                  </p>
                  <p className="mt-2 text-xl font-black text-amber-900 dark:text-amber-100">
                    {safeDate(selectedMovement?.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      ) : (
        <SectionCard
          title="Selected movement detail"
          subtitle="This section appears after a movement is selected."
        >
          <EmptyState text="Select a movement above to inspect its detail." />
        </SectionCard>
      )}
    </div>
  );
}
