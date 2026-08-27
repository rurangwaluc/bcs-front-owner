"use client";

import {
  AlertBox,
  EmptyState,
  FormInput,
  FormSelect,
  SectionCard,
  StatCard,
  safe,
  safeNumber,
} from "../OwnerShared";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "../../../lib/api";

function money(v) {
  return safeNumber(v).toLocaleString();
}

function pct(v) {
  return `${safeNumber(v)}%`;
}

function toneForNumber(value, positiveGood = true) {
  const n = safeNumber(value);
  if (n === 0) return "default";
  if (positiveGood) return n > 0 ? "success" : "danger";
  return n > 0 ? "warn" : "success";
}

function toneForAccountType(type) {
  const value = safe(type).toUpperCase();
  if (value === "ASSET") {
    return "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300";
  }
  if (value === "LIABILITY") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }
  if (value === "REVENUE") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
  if (value === "EXPENSE" || value === "CONTRA_REVENUE") {
    return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
  }

  return "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
}

function WarningList({ warnings = [] }) {
  const rows = Array.isArray(warnings) ? warnings.filter(Boolean) : [];
  if (!rows.length) return null;

  return (
    <div className="space-y-3">
      {rows.map((text, index) => (
        <div
          key={`${text}-${index}`}
          className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
        >
          {text}
        </div>
      ))}
    </div>
  );
}

function SummaryBucketCard({ title, value, sub, tone = "default" }) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20"
        : tone === "danger"
          ? "border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/20"
          : "border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900";

  return (
    <div className={`rounded-[24px] border p-5 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
        {title}
      </p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
        {value}
      </p>
      <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">{sub}</p>
    </div>
  );
}

function CashFlowRow({ row, isOutflow = false }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-stone-950 dark:text-stone-50">
          {safe(row?.label) || "-"}
        </p>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          {safe(row?.key) || "-"}
        </p>
      </div>

      <div
        className={
          "text-lg font-bold " +
          (isOutflow
            ? "text-rose-700 dark:text-rose-300"
            : "text-emerald-700 dark:text-emerald-300")
        }
      >
        {money(row?.amount)}
      </div>
    </div>
  );
}

function TrialBalanceRow({ row }) {
  return (
    <div className="hidden grid-cols-[90px_1.5fr_120px_130px_130px] items-center gap-3 border-b border-stone-200 px-4 py-3 text-left transition last:border-b-0 lg:grid dark:border-stone-800">
      <div className="text-sm font-semibold text-stone-700 dark:text-stone-300">
        {safe(row?.code) || "-"}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-stone-950 dark:text-stone-50">
          {safe(row?.name) || "-"}
        </p>
      </div>

      <div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneForAccountType(row?.type)}`}
        >
          {safe(row?.type) || "-"}
        </span>
      </div>

      <div className="text-sm font-semibold text-stone-950 dark:text-stone-50">
        {money(row?.debit)}
      </div>

      <div className="text-sm font-semibold text-stone-950 dark:text-stone-50">
        {money(row?.credit)}
      </div>
    </div>
  );
}

function TrialBalanceMobileRow({ row }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 lg:hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-stone-950 dark:text-stone-50">
            {safe(row?.name) || "-"}
          </p>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            {safe(row?.code) || "-"}
          </p>
        </div>

        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneForAccountType(row?.type)}`}
        >
          {safe(row?.type) || "-"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Debit
          </p>
          <p className="mt-1 text-sm font-bold text-stone-950 dark:text-stone-50">
            {money(row?.debit)}
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Credit
          </p>
          <p className="mt-1 text-sm font-bold text-stone-950 dark:text-stone-50">
            {money(row?.credit)}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProfitTableRow({ row, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(row)}
      className={
        "hidden w-full grid-cols-[180px_130px_130px_130px_130px_130px_120px] items-center gap-3 border-b border-stone-200 px-4 py-3 text-left transition last:border-b-0 lg:grid " +
        (active
          ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950"
          : "bg-white hover:bg-stone-50 dark:bg-stone-900 dark:hover:bg-stone-800/70")
      }
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">
          {safe(row?.locationName) || "-"}
        </p>
        <p
          className={
            "mt-1 truncate text-xs " +
            (active
              ? "text-stone-300 dark:text-stone-600"
              : "text-stone-500 dark:text-stone-400")
          }
        >
          {safe(row?.locationCode) || "-"}
          {row?.isMain ? " · Main" : ""}
        </p>
      </div>

      <div className="text-sm font-semibold">{money(row?.grossSales)}</div>
      <div className="text-sm font-semibold">{money(row?.refunds)}</div>
      <div className="text-sm font-semibold">{money(row?.netRevenue)}</div>
      <div className="text-sm font-semibold">{money(row?.costOfProductsSold ?? row?.estimatedCogs)}</div>
      <div className="text-sm font-semibold">{money(row?.grossProfit)}</div>
      <div className="text-sm font-semibold">{pct(row?.grossMarginPct)}</div>
    </button>
  );
}

function ProfitTableMobileRow({ row, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(row)}
      className={
        "w-full rounded-2xl border p-4 text-left transition lg:hidden " +
        (active
          ? "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950"
          : "border-stone-200 bg-white hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">
            {safe(row?.locationName) || "-"}
          </p>
          <p
            className={
              "mt-1 truncate text-xs " +
              (active
                ? "text-stone-300 dark:text-stone-600"
                : "text-stone-500 dark:text-stone-400")
            }
          >
            {safe(row?.locationCode) || "-"}
            {row?.isMain ? " · Main" : ""}
          </p>
        </div>

        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
          {pct(row?.grossMarginPct)}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Sales after refunds
          </p>
          <p className="mt-1 text-sm font-bold">{money(row?.netRevenue)}</p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Money left before expenses
          </p>
          <p className="mt-1 text-sm font-bold">{money(row?.grossProfit)}</p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Shop expenses
          </p>
          <p className="mt-1 text-sm font-bold">
            {money(row?.operatingExpenses)}
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Final profit/loss
          </p>
          <p className="mt-1 text-sm font-bold">
            {money(row?.operatingProfit)}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function OwnerReportsTab({ locations = [] }) {
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  const [cashFlow, setCashFlow] = useState(null);
  const [trialBalance, setTrialBalance] = useState(null);
  const [incomeStatement, setIncomeStatement] = useState(null);
  const [profitTable, setProfitTable] = useState(null);

  const [selectedBranchId, setSelectedBranchId] = useState(null);

  const [locationFilter, setLocationFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const locationOptions = useMemo(() => {
    return Array.isArray(locations)
      ? locations.filter(
          (row) => safe(row?.status).toUpperCase() !== "ARCHIVED",
        )
      : [];
  }, [locations]);

  async function loadReports() {
    setLoading(true);
    setErrorText("");

    const rangeParams = new URLSearchParams();
    if (locationFilter) rangeParams.set("locationId", locationFilter);
    if (dateFrom) rangeParams.set("dateFrom", dateFrom);
    if (dateTo) rangeParams.set("dateTo", dateTo);

    const rangeSuffix = rangeParams.toString() ? `?${rangeParams.toString()}` : "";

    const trialParams = new URLSearchParams();
    if (locationFilter) trialParams.set("locationId", locationFilter);
    if (dateTo) trialParams.set("asOfDate", dateTo);

    const trialSuffix = trialParams.toString() ? `?${trialParams.toString()}` : "";

    const [cashFlowRes, trialRes, incomeRes, profitRes] =
      await Promise.allSettled([
        apiFetch(`/owner/reports/cash-flow${rangeSuffix}`, { method: "GET" }),
        apiFetch(`/owner/reports/trial-balance${trialSuffix}`, {
          method: "GET",
        }),
        apiFetch(`/owner/reports/income-statement${rangeSuffix}`, {
          method: "GET",
        }),
        apiFetch(`/owner/reports/profit-table${rangeSuffix}`, { method: "GET" }),
      ]);

    let firstError = "";

    if (cashFlowRes.status === "fulfilled") {
      setCashFlow(cashFlowRes.value?.report || null);
    } else {
      setCashFlow(null);
      firstError =
        firstError ||
        cashFlowRes.reason?.data?.error ||
        cashFlowRes.reason?.message ||
        "Failed to load cash flow";
    }

    if (trialRes.status === "fulfilled") {
      setTrialBalance(trialRes.value?.report || null);
    } else {
      setTrialBalance(null);
      firstError =
        firstError ||
        trialRes.reason?.data?.error ||
        trialRes.reason?.message ||
        "Failed to load trial balance";
    }

    if (incomeRes.status === "fulfilled") {
      setIncomeStatement(incomeRes.value?.report || null);
    } else {
      setIncomeStatement(null);
      firstError =
        firstError ||
        incomeRes.reason?.data?.error ||
        incomeRes.reason?.message ||
        "Failed to load income statement";
    }

    if (profitRes.status === "fulfilled") {
      const report = profitRes.value?.report || null;
      setProfitTable(report);

      const rows = Array.isArray(report?.rows) ? report.rows : [];
      setSelectedBranchId((prev) =>
        prev && rows.some((x) => String(x.locationId) === String(prev))
          ? prev
          : (rows[0]?.locationId ?? null),
      );
    } else {
      setProfitTable(null);
      setSelectedBranchId(null);
      firstError =
        firstError ||
        profitRes.reason?.data?.error ||
        profitRes.reason?.message ||
        "Failed to load profit table";
    }

    setErrorText(firstError);
    setLoading(false);
  }

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationFilter, dateFrom, dateTo]);

  const profitRows = Array.isArray(profitTable?.rows) ? profitTable.rows : [];

  const selectedBranch =
    selectedBranchId == null
      ? null
      : profitRows.find(
          (row) => String(row.locationId) === String(selectedBranchId),
        ) || null;

  const totalInflows = safeNumber(cashFlow?.totals?.totalInflows);
  const totalOutflows = safeNumber(cashFlow?.totals?.totalOutflows);
  const netCashFlow = safeNumber(cashFlow?.totals?.netCashFlow);

  const totalDebits = safeNumber(trialBalance?.totals?.totalDebits);
  const totalCredits = safeNumber(trialBalance?.totals?.totalCredits);
  const trialDifference = safeNumber(trialBalance?.totals?.difference);

  const grossSales = safeNumber(incomeStatement?.revenue?.grossSales);
  const refunds = safeNumber(incomeStatement?.revenue?.refunds);
  const netRevenue = safeNumber(incomeStatement?.revenue?.netRevenue);
  const extraChargeRevenue = safeNumber(
    incomeStatement?.revenue?.extraChargeRevenue,
  );
  const costOfProductsSold = safeNumber(
    incomeStatement?.costOfSales?.costOfProductsSold ??
      incomeStatement?.costOfSales?.estimatedCogs,
  );
  const grossProfit = safeNumber(incomeStatement?.profitability?.grossProfit);
  const grossMarginPct = safeNumber(
    incomeStatement?.profitability?.grossMarginPct,
  );
  const operatingExpenses = safeNumber(
    incomeStatement?.operatingExpenses?.total,
  );
  const operatingProfit = safeNumber(
    incomeStatement?.bottomLine?.operatingProfit,
  );
  const operatingMarginPct = safeNumber(
    incomeStatement?.bottomLine?.operatingMarginPct,
  );

  const metaWarnings = [
    ...(Array.isArray(cashFlow?.meta?.warnings) ? cashFlow.meta.warnings : []),
    ...(Array.isArray(trialBalance?.meta?.warnings)
      ? trialBalance.meta.warnings
      : []),
    ...(Array.isArray(incomeStatement?.meta?.warnings)
      ? incomeStatement.meta.warnings
      : []),
    ...(Array.isArray(profitTable?.meta?.warnings)
      ? profitTable.meta.warnings
      : []),
  ].filter(Boolean);

  const uniqueWarnings = Array.from(new Set(metaWarnings));

  return (
    <div className="space-y-6">
      <AlertBox message={errorText} />

      {loading ? (
        <SectionCard title="Reports" subtitle="Loading accounting reports.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
            title="Owner report filters"
            subtitle="Set report range before reading business-wide financial signals."
          >
            <div className="grid gap-3 md:grid-cols-3">
              <FormSelect
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <option value="">All branches</option>
                {locationOptions.map((row) => (
                  <option key={row.id} value={row.id}>
                    {safe(row.name)}{" "}
                    {safe(row.code) ? `(${safe(row.code)})` : ""}
                  </option>
                ))}
              </FormSelect>

              <FormInput
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />

              <FormInput
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </SectionCard>

          <WarningList warnings={uniqueWarnings} />

          <SectionCard
            title="Cash flow"
            subtitle="Owner view of cash entering and leaving the business."
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <SummaryBucketCard
                title="Total inflows"
                value={money(totalInflows)}
                sub="Cash received in selected range"
                tone="success"
              />
              <SummaryBucketCard
                title="Total outflows"
                value={money(totalOutflows)}
                sub="Cash paid out in selected range"
                tone="warn"
              />
              <SummaryBucketCard
                title="Net cash flow"
                value={money(netCashFlow)}
                sub="Inflows minus outflows"
                tone={toneForNumber(netCashFlow)}
              />
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              <div className="rounded-[24px] border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                  Inflows
                </p>

                {!Array.isArray(cashFlow?.inflows) || cashFlow.inflows.length === 0 ? (
                  <div className="mt-4">
                    <EmptyState text="No inflows in the selected range." />
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {cashFlow.inflows.map((row, index) => (
                      <CashFlowRow key={`${row?.key}-${index}`} row={row} />
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-[24px] border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                  Outflows
                </p>

                {!Array.isArray(cashFlow?.outflows) || cashFlow.outflows.length === 0 ? (
                  <div className="mt-4">
                    <EmptyState text="No outflows in the selected range." />
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {cashFlow.outflows.map((row, index) => (
                      <CashFlowRow
                        key={`${row?.key}-${index}`}
                        row={row}
                        isOutflow
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Profit & Loss"
            subtitle="Clear answer showing whether the shop made profit or loss."
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryBucketCard
                title="You sold products worth"
                value={money(grossSales)}
                sub="Products sold in this period"
              />
              <SummaryBucketCard
                title="Refunds"
                value={money(refunds)}
                sub="Contra revenue"
                tone="danger"
              />
              <SummaryBucketCard
                title="Sales after refunds"
                value={money(netRevenue)}
                sub="Sales money after returned items"
                tone="success"
              />
              <SummaryBucketCard
                title="Extra charge revenue"
                value={money(extraChargeRevenue)}
                sub="Manual seller uplifts"
                tone="warn"
              />
              <SummaryBucketCard
                title="Those products cost the shop"
                value={money(costOfProductsSold)}
                sub="Saved product cost at sale time"
                tone="warn"
              />
              <SummaryBucketCard
                title="Money left before expenses"
                value={money(grossProfit)}
                sub={`Before shop expenses / margin ${pct(grossMarginPct)}`}
                tone={toneForNumber(grossProfit)}
              />
              <SummaryBucketCard
                title="Shop expenses"
                value={money(operatingExpenses)}
                sub="Money spent to run the shop"
                tone="danger"
              />
              <SummaryBucketCard
                title="Final profit/loss"
                value={money(operatingProfit)}
                sub={`Final result / margin ${pct(operatingMarginPct)}`}
                tone={toneForNumber(operatingProfit)}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Trial balance"
            subtitle="Snapshot of debit and credit balances as of the selected end date."
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Total debits"
                value={money(totalDebits)}
                valueClassName="text-[17px] leading-tight"
                sub="Sum of debit balances"
              />
              <StatCard
                label="Total credits"
                value={money(totalCredits)}
                valueClassName="text-[17px] leading-tight"
                sub="Sum of credit balances"
              />
              <StatCard
                label="Difference"
                value={money(trialDifference)}
                valueClassName="text-[17px] leading-tight"
                sub={
                  safeNumber(trialBalance?.totals?.isBalanced)
                    ? "Balanced"
                    : "Not balanced"
                }
              />
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800">
              <div className="hidden grid-cols-[90px_1.5fr_120px_130px_130px] gap-3 bg-stone-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 dark:bg-stone-950 dark:text-stone-400 lg:grid">
                <div>Code</div>
                <div>Account</div>
                <div>Type</div>
                <div>Debit</div>
                <div>Credit</div>
              </div>

              {!Array.isArray(trialBalance?.rows) || trialBalance.rows.length === 0 ? (
                <div className="p-4">
                  <EmptyState text="No trial balance rows available." />
                </div>
              ) : (
                <div>
                  {trialBalance.rows.map((row, index) => (
                    <div key={`${row?.code}-${index}`}>
                      <TrialBalanceRow row={row} />
                      <div className="p-3 lg:hidden">
                        <TrialBalanceMobileRow row={row} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Profit & Loss by branch"
            subtitle="See which branch made profit or loss in the selected period."
          >
            <div className="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800">
              <div className="hidden grid-cols-[180px_130px_130px_130px_130px_130px_120px] gap-3 bg-stone-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 dark:bg-stone-950 dark:text-stone-400 lg:grid">
                <div>Branch</div>
                <div>Sold worth</div>
                <div>Refunds</div>
                <div>After refunds</div>
                <div>Product cost</div>
                <div>Before expenses</div>
                <div>Margin</div>
              </div>

              {profitRows.length === 0 ? (
                <div className="p-4">
                  <EmptyState text="No branch profit rows in the selected range." />
                </div>
              ) : (
                <div>
                  {profitRows.map((row) => (
                    <div key={row.locationId}>
                      <ProfitTableRow
                        row={row}
                        active={
                          String(row.locationId) === String(selectedBranchId)
                        }
                        onSelect={(picked) =>
                          setSelectedBranchId(picked?.locationId)
                        }
                      />
                      <div className="p-3 lg:hidden">
                        <ProfitTableMobileRow
                          row={row}
                          active={
                            String(row.locationId) === String(selectedBranchId)
                          }
                          onSelect={(picked) =>
                            setSelectedBranchId(picked?.locationId)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>

          {selectedBranch ? (
            <SectionCard
              title="Selected branch result"
              subtitle="Simple profit or loss detail for the selected branch."
            >
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Branch"
                  value={safe(selectedBranch.locationName) || "-"}
                  valueClassName="text-[17px] leading-tight"
                  sub={safe(selectedBranch.locationCode) || "-"}
                />

                <StatCard
                  label="Sales after refunds"
                  value={money(selectedBranch.netRevenue)}
                  valueClassName="text-[17px] leading-tight"
                  sub="After refunds"
                />

                <StatCard
                  label="Money left before expenses"
                  value={money(selectedBranch.grossProfit)}
                  valueClassName="text-[17px] leading-tight"
                  sub={`Margin ${pct(selectedBranch.grossMarginPct)}`}
                />

                <StatCard
                  label="Final profit/loss"
                  value={money(selectedBranch.operatingProfit)}
                  valueClassName="text-[17px] leading-tight"
                  sub={`Margin ${pct(selectedBranch.operatingMarginPct)}`}
                />

                <StatCard
                  label="Sold products worth"
                  value={money(selectedBranch.grossSales)}
                  valueClassName="text-[17px] leading-tight"
                  sub="Before refunds"
                />

                <StatCard
                  label="Refunds"
                  value={money(selectedBranch.refunds)}
                  valueClassName="text-[17px] leading-tight"
                  sub="Contra revenue"
                />

                <StatCard
                  label="Product cost"
                  value={money(selectedBranch.costOfProductsSold ?? selectedBranch.estimatedCogs)}
                  valueClassName="text-[17px] leading-tight"
                  sub="Saved product cost at sale time"
                />

                <StatCard
                  label="Shop expenses"
                  value={money(selectedBranch.operatingExpenses)}
                  valueClassName="text-[17px] leading-tight"
                  sub="Posted expenses"
                />
              </div>
            </SectionCard>
          ) : (
            <SectionCard
              title="Selected branch result"
              subtitle="This section appears after a branch is selected."
            >
              <EmptyState text="Select a branch row above to inspect its financial detail." />
            </SectionCard>
          )}

          <SectionCard
            title="Total result"
            subtitle="Total profit or loss across the visible branches."
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryBucketCard
                title="You sold products worth"
                value={money(profitTable?.totals?.grossSales)}
                sub="All visible branches"
              />
              <SummaryBucketCard
                title="Sales after refunds"
                value={money(profitTable?.totals?.netRevenue)}
                sub="After refunds"
                tone="success"
              />
              <SummaryBucketCard
                title="Money left before expenses"
                value={money(profitTable?.totals?.grossProfit)}
                sub={`Before shop expenses / margin ${pct(profitTable?.totals?.grossMarginPct)}`}
                tone={toneForNumber(profitTable?.totals?.grossProfit)}
              />
              <SummaryBucketCard
                title="Final profit/loss"
                value={money(profitTable?.totals?.operatingProfit)}
                sub={`Final result / margin ${pct(profitTable?.totals?.operatingMarginPct)}`}
                tone={toneForNumber(profitTable?.totals?.operatingProfit)}
              />
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}