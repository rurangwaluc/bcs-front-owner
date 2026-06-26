"use client";

import {
  AlertBox,
  EmptyState,
  FormInput,
  FormSelect,
  SectionCard,
  safe,
  safeNumber,
} from "./../OwnerShared";
import { useEffect, useMemo, useState } from "react";

import AsyncButton from "../../AsyncButton";
import { apiFetch } from "../../../lib/api";

function normalizeCurrency(v) {
  const s = String(v || "RWF")
    .trim()
    .toUpperCase();
  return s || "RWF";
}

function nonNegativeAmount(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, n);
}

function money(v, currency = "RWF") {
  return `${normalizeCurrency(currency)} ${nonNegativeAmount(v).toLocaleString()}`;
}

function normalizeSummaryResponse(result) {
  return result?.summary || result || {};
}

function normalizeBreakdownResponse(result) {
  return result?.breakdown || result || {};
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

  const name =
    safe(row.name) ||
    safe(row.locationName) ||
    safe(row.location_name) ||
    safe(row.branchName) ||
    safe(row.branch_name) ||
    `Branch #${idText}`;

  const code =
    safe(row.code) ||
    safe(row.locationCode) ||
    safe(row.location_code) ||
    safe(row.branchCode) ||
    safe(row.branch_code) ||
    "";

  const status = safe(row.status || row.locationStatus || row.location_status);

  return {
    id: idText,
    name,
    code,
    status,
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

function SmallMetric({ label, value, tone = "neutral", sub = "" }) {
  const valueClass =
    tone === "success"
      ? "text-emerald-700 dark:text-emerald-300"
      : tone === "danger"
        ? "text-rose-700 dark:text-rose-300"
        : "text-stone-950 dark:text-stone-50";

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
        {label}
      </p>
      <p className={["mt-2 text-base font-black", valueClass].join(" ")}>
        {value}
      </p>
      {sub ? (
        <p className="mt-1 text-xs leading-5 text-stone-500 dark:text-stone-400">
          {sub}
        </p>
      ) : null}
    </div>
  );
}

function OwnerMoneyClarityPanel({
  moneyReceived = 0,
  moneyPaid = 0,
  safeToUse = 0,
  currency = "RWF",
  usableMethodsCount = 0,
  blockedMethodsCount = 0,
  onOpenMovements,
  onOpenGivenOutLoansTab,
}) {
  const received = nonNegativeAmount(moneyReceived);
  const paid = nonNegativeAmount(moneyPaid);
  const safeAvailable = nonNegativeAmount(safeToUse);
  const hasMoney = safeAvailable > 0;

  return (
    <div className="overflow-hidden rounded-[30px] border border-stone-200 bg-stone-950 text-white shadow-[0_24px_70px_rgba(2,6,23,0.2)] dark:border-stone-800 dark:bg-black">
      <div className="grid gap-0 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-300">
                Owner decision number
              </p>
              <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-4xl">
                Money safe to use now
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-300">
                This is the total money available in payment methods marked
                <b className="text-emerald-200"> Can use</b>. Use this number
                for owner actions like giving money out.
              </p>
            </div>

            <span
              className={[
                "rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em]",
                hasMoney
                  ? "bg-emerald-400/15 text-emerald-200"
                  : "bg-rose-400/15 text-rose-200",
              ].join(" ")}
            >
              {hasMoney ? "Money available" : "No money to use"}
            </span>
          </div>

          <p className="mt-4 text-4xl font-black tracking-[-0.05em] text-emerald-300 sm:text-5xl">
            {money(safeAvailable, currency)}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55">
                Methods you can use
              </p>
              <p className="mt-1 text-xl font-black text-emerald-200">
                {safeNumber(usableMethodsCount)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55">
                Methods blocked
              </p>
              <p className="mt-1 text-xl font-black text-rose-200">
                {safeNumber(blockedMethodsCount)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55">
                Rule
              </p>
              <p className="mt-1 text-sm font-black text-white">
                Never give out more than available.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onOpenMovements?.()}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-left text-sm font-black text-white transition hover:bg-white/15"
            >
              Review movements
            </button>
            <button
              type="button"
              onClick={() => onOpenGivenOutLoansTab?.()}
              disabled={!hasMoney}
              className={[
                "rounded-2xl border px-4 py-3 text-left text-sm font-black transition",
                hasMoney
                  ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100 hover:bg-emerald-300/20"
                  : "cursor-not-allowed border-rose-300/20 bg-rose-300/10 text-rose-200/70",
              ].join(" ")}
            >
              {hasMoney ? "Give out money" : "Giving out blocked"}
            </button>
          </div>
        </div>

        <div className="grid border-t border-white/10 xl:border-l xl:border-t-0">
          <div className="border-b border-white/10 p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-300">
              Added to business
            </p>
            <p className="mt-2 text-2xl font-black tracking-[-0.03em]">
              {money(received, currency)}
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-300">
              Sales, payments, received loans, and other money-in records.
            </p>
          </div>

          <div className="p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-rose-300">
              Removed from business
            </p>
            <p className="mt-2 text-2xl font-black tracking-[-0.03em]">
              {money(paid, currency)}
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-300">
              Expenses, supplier payments, repayments, and money given out.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MethodQuickUseCard({ row }) {
  const methodName = methodLabel(row?.method);
  const available = nonNegativeAmount(row?.netAmount ?? 0);
  const hasMoney = available > 0;

  return (
    <div
      className={[
        "rounded-2xl border p-4",
        hasMoney
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
          : "border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2">
        <MovementChip text={methodName} className={methodTone(row?.method)} />
        <span
          className={[
            "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em]",
            hasMoney
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
              : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
          ].join(" ")}
        >
          {hasMoney ? "Can use" : "No money"}
        </span>
      </div>
      <p
        className={[
          "mt-3 text-xl font-black tracking-[-0.03em]",
          hasMoney
            ? "text-emerald-700 dark:text-emerald-300"
            : "text-stone-500 dark:text-stone-400",
        ].join(" ")}
      >
        {money(available)}
      </p>
      <p className="mt-1 text-xs leading-5 text-stone-500 dark:text-stone-400">
        {hasMoney
          ? `Use ${methodName.toLowerCase()} up to this amount.`
          : `Do not use ${methodName.toLowerCase()} to give money out.`}
      </p>
    </div>
  );
}

function PaymentMethodDecisionCard({ row }) {
  const methodName = methodLabel(row?.method);
  const moneyIn = nonNegativeAmount(row?.totalMoneyIn ?? 0);
  const moneyOut = nonNegativeAmount(row?.totalMoneyOut ?? 0);
  const available = nonNegativeAmount(row?.netAmount ?? 0);
  const hasMoney = available > 0;

  return (
    <div
      className={[
        "rounded-[26px] border p-4 shadow-sm transition",
        hasMoney
          ? "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/40 dark:bg-emerald-950/20"
          : "border-stone-200 bg-white opacity-90 dark:border-stone-800 dark:bg-stone-900",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <MovementChip
              text={methodName}
              className={methodTone(row?.method)}
            />
            <span className="text-xs text-stone-500 dark:text-stone-400">
              {safeNumber(row?.count)} movement(s)
            </span>
          </div>

          <p className="mt-4 text-[11px] font-black uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
            Available to use now
          </p>
          <p
            className={[
              "mt-1 text-2xl font-black tracking-[-0.03em] sm:text-3xl",
              hasMoney
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-stone-500 dark:text-stone-400",
            ].join(" ")}
          >
            {money(available)}
          </p>
        </div>

        <span
          className={[
            "rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em]",
            hasMoney
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
              : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
          ].join(" ")}
        >
          {hasMoney ? "Can use" : "No money"}
        </span>
      </div>

      <div className="mt-4 rounded-2xl border border-stone-200 bg-white/70 p-3 dark:border-stone-800 dark:bg-stone-950/50">
        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
          {hasMoney
            ? `Use ${methodName.toLowerCase()} only up to this amount.`
            : `Do not give out money from ${methodName.toLowerCase()}.`}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            {`Added to ${methodName}`}
          </p>
          <p className="mt-1 text-sm font-black text-emerald-700 dark:text-emerald-300">
            {money(moneyIn)}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            {`Removed from ${methodName}`}
          </p>
          <p className="mt-1 text-sm font-black text-rose-700 dark:text-rose-300">
            {money(moneyOut)}
          </p>
        </div>
      </div>
    </div>
  );
}

function BranchMethodCard({ row, idx }) {
  const available = nonNegativeAmount(row?.netAmount ?? 0);
  const hasMoney = available > 0;

  return (
    <div
      key={`${row?.locationId || "loc"}-${row?.method || "m"}-${idx}`}
      className={[
        "rounded-2xl border p-4",
        hasMoney
          ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/15"
          : "border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-stone-950 dark:text-stone-50">
            {safe(row?.locationName) || `Branch #${safeNumber(row?.locationId)}`}
            {safe(row?.locationCode) ? ` (${safe(row.locationCode)})` : ""}
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
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            {hasMoney ? "Can use here" : "No money here"}
          </p>
          <p
            className={[
              "mt-1 text-base font-black",
              hasMoney
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-stone-500 dark:text-stone-400",
            ].join(" ")}
          >
            {money(available)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OwnerPaymentsOverviewTab({
  locations = [],
  onOpenMovements,
  onOpenGivenOutLoansTab,
  onOpenReceivedLoansTab,
}) {
  const [loading, setLoading] = useState(true);
  const [refreshState, setRefreshState] = useState("idle");
  const [errorText, setErrorText] = useState("");

  const [summary, setSummary] = useState(null);
  const [breakdown, setBreakdown] = useState(null);

  const [locationId, setLocationId] = useState("");
  const [method, setMethod] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const byLocationMethodRows = useMemo(() => {
    return Array.isArray(breakdown?.byLocationMethod)
      ? breakdown.byLocationMethod
      : [];
  }, [breakdown]);

  const locationOptions = useMemo(() => {
    const officialOptions = (Array.isArray(locations) ? locations : [])
      .map(normalizeLocationOption)
      .filter(Boolean)
      .filter((row) => String(row?.status || "").toUpperCase() !== "ARCHIVED");

    if (officialOptions.length > 0) return officialOptions;

    return buildFallbackLocationOptions(byLocationMethodRows);
  }, [locations, byLocationMethodRows]);

  const cards = useMemo(() => {
    const totals = summary?.totals || {};

    return {
      totalMoneyIn: nonNegativeAmount(totals.totalMoneyIn ?? 0),
      totalMoneyOut: nonNegativeAmount(totals.totalMoneyOut ?? 0),
      netPosition: nonNegativeAmount(totals.netAmount ?? 0),
      movementsCount: nonNegativeAmount(totals.movementsCount ?? 0),
      branchesCount: nonNegativeAmount(totals.branchesCount ?? 0),
      moneyInCount: nonNegativeAmount(totals.moneyInCount ?? 0),
      moneyOutCount: nonNegativeAmount(totals.moneyOutCount ?? 0),
    };
  }, [summary]);

  const byMethodRows = useMemo(() => {
    return Array.isArray(breakdown?.byMethod) ? breakdown.byMethod : [];
  }, [breakdown]);

  const methodDecisionRows = useMemo(() => {
    const requiredMethods = ["BANK", "MOMO", "CASH", "CARD"];
    const map = new Map();

    for (const row of byMethodRows) {
      const key =
        String(row?.method || "OTHER")
          .trim()
          .toUpperCase() || "OTHER";
      const existing = map.get(key) || {
        method: key,
        totalMoneyIn: 0,
        totalMoneyOut: 0,
        netAmount: 0,
        count: 0,
      };

      map.set(key, {
        ...existing,
        method: key,
        totalMoneyIn:
          nonNegativeAmount(existing.totalMoneyIn) +
          nonNegativeAmount(row?.totalMoneyIn ?? 0),
        totalMoneyOut:
          nonNegativeAmount(existing.totalMoneyOut) +
          nonNegativeAmount(row?.totalMoneyOut ?? 0),
        netAmount:
          nonNegativeAmount(existing.netAmount) +
          nonNegativeAmount(row?.netAmount ?? 0),
        count:
          nonNegativeAmount(existing.count) +
          nonNegativeAmount(row?.count ?? 0),
      });
    }

    for (const methodKey of requiredMethods) {
      if (!map.has(methodKey)) {
        map.set(methodKey, {
          method: methodKey,
          totalMoneyIn: 0,
          totalMoneyOut: 0,
          netAmount: 0,
          count: 0,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      const availableDiff =
        nonNegativeAmount(b?.netAmount ?? 0) -
        nonNegativeAmount(a?.netAmount ?? 0);
      if (availableDiff !== 0) return availableDiff;
      return methodLabel(a?.method).localeCompare(methodLabel(b?.method));
    });
  }, [byMethodRows]);

  const safeToUseBalance = useMemo(() => {
    return methodDecisionRows.reduce(
      (sum, row) => sum + nonNegativeAmount(row?.netAmount ?? 0),
      0,
    );
  }, [methodDecisionRows]);

  const usableMethodsCount = useMemo(() => {
    return methodDecisionRows.filter(
      (row) => nonNegativeAmount(row?.netAmount ?? 0) > 0,
    ).length;
  }, [methodDecisionRows]);

  const blockedMethodsCount = Math.max(
    0,
    methodDecisionRows.length - usableMethodsCount,
  );

  const topUsableRows = useMemo(() => {
    return methodDecisionRows.filter(
      (row) => nonNegativeAmount(row?.netAmount ?? 0) > 0,
    );
  }, [methodDecisionRows]);

  const visibleBranchMethodRows = useMemo(() => {
    return byLocationMethodRows
      .slice()
      .sort((a, b) => {
        const availableDiff =
          nonNegativeAmount(b?.netAmount ?? 0) -
          nonNegativeAmount(a?.netAmount ?? 0);
        if (availableDiff !== 0) return availableDiff;
        const branchA = `${safe(a?.locationName)} ${safe(a?.locationCode)}`;
        const branchB = `${safe(b?.locationName)} ${safe(b?.locationCode)}`;
        return branchA.localeCompare(branchB);
      })
      .slice(0, 10);
  }, [byLocationMethodRows]);

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
      const breakdownUrl = `/owner/payments/breakdown${query ? `?${query}` : ""}`;

      const [summaryRes, breakdownRes] = await Promise.allSettled([
        apiFetch(summaryUrl, { method: "GET" }),
        apiFetch(breakdownUrl, { method: "GET" }),
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

      setErrorText(nextError);
    } catch (e) {
      setSummary(null);
      setBreakdown(null);
      setErrorText(
        e?.data?.error ||
          e?.message ||
          "Failed to load owner payments overview",
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

  return (
    <div className="space-y-5">
      {errorText ? <AlertBox tone="danger">{errorText}</AlertBox> : null}

      <SectionCard
        title="Overview"
        subtitle="The owner sees what can be used now first. Movement totals stay below as supporting details."
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
          <OwnerMoneyClarityPanel
            moneyReceived={cards.totalMoneyIn}
            moneyPaid={cards.totalMoneyOut}
            safeToUse={safeToUseBalance}
            usableMethodsCount={usableMethodsCount}
            blockedMethodsCount={blockedMethodsCount}
            onOpenMovements={onOpenMovements}
            onOpenGivenOutLoansTab={onOpenGivenOutLoansTab}
          />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {methodDecisionRows.slice(0, 4).map((row) => (
              <MethodQuickUseCard
                key={`quick-${String(row?.method || "method")}`}
                row={row}
              />
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SmallMetric
              label="Added to business"
              value={money(cards.totalMoneyIn)}
              sub={`${safeNumber(cards.moneyInCount)} money-in record(s)`}
              tone="success"
            />
            <SmallMetric
              label="Removed from business"
              value={money(cards.totalMoneyOut)}
              sub={`${safeNumber(cards.moneyOutCount)} money-out record(s)`}
              tone="danger"
            />
            <SmallMetric
              label="Audit net position"
              value={money(cards.netPosition)}
              sub="For review only; use safe balance above for actions."
            />
            <SmallMetric
              label="Branches involved"
              value={safeNumber(cards.branchesCount)}
              sub={`${safeNumber(cards.movementsCount)} total movement(s)`}
            />
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Filters"
          subtitle="Choose a branch, method, or date range to narrow the numbers."
        >
          <div className="grid gap-3">
            <FormSelect
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
            >
              <option value="">All branches</option>
              {locationOptions.map((row) => (
                <option key={row?.id} value={String(row?.id)}>
                  {locationOptionLabel(row)}
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

            <div className="grid gap-3 sm:grid-cols-2">
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

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setLocationId("");
                  setMethod("");
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
          title="Recommended actions"
          subtitle="Fast actions from the same money-control room."
        >
          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => onOpenMovements?.()}
              className="rounded-[22px] border border-stone-200 bg-white px-4 py-4 text-left transition hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:hover:bg-stone-800"
            >
              <div className="text-sm font-black text-stone-950 dark:text-stone-50">
                Review movements
              </div>
              <div className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                See every money-in and money-out record.
              </div>
            </button>

            <button
              type="button"
              onClick={() => onOpenGivenOutLoansTab?.()}
              disabled={safeToUseBalance <= 0}
              className={[
                "rounded-[22px] border px-4 py-4 text-left transition",
                safeToUseBalance > 0
                  ? "border-stone-900 bg-stone-900 text-white hover:bg-stone-800 dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
                  : "cursor-not-allowed border-rose-200 bg-rose-50 text-rose-700 opacity-80 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300",
              ].join(" ")}
            >
              <div className="text-sm font-black">
                {safeToUseBalance > 0 ? "Give out money" : "Giving out blocked"}
              </div>
              <div className="mt-1 text-xs opacity-80">
                {safeToUseBalance > 0
                  ? "Use only methods marked Can use."
                  : "No payment method has available money."}
              </div>
            </button>

            <button
              type="button"
              onClick={() => onOpenReceivedLoansTab?.()}
              className="rounded-[22px] border border-stone-200 bg-stone-50 px-4 py-4 text-left transition hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-950 dark:hover:bg-stone-900"
            >
              <div className="text-sm font-black text-stone-950 dark:text-stone-50">
                Record received loan
              </div>
              <div className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                Money received as a loan increases the selected method balance.
              </div>
            </button>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="Money available by method"
          subtitle="This is the action list. Use only methods marked Can use."
        >
          {loading ? (
            <div className="grid gap-3">
              <div className="h-32 animate-pulse rounded-[26px] bg-stone-100 dark:bg-stone-900" />
              <div className="h-32 animate-pulse rounded-[26px] bg-stone-100 dark:bg-stone-900" />
              <div className="h-32 animate-pulse rounded-[26px] bg-stone-100 dark:bg-stone-900" />
            </div>
          ) : methodDecisionRows.length === 0 ? (
            <EmptyState text="No payment-method movement found for the selected filters." />
          ) : (
            <div className="grid gap-3">
              {methodDecisionRows.map((row) => (
                <PaymentMethodDecisionCard
                  key={String(row?.method || "method")}
                  row={row}
                />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Money available by branch"
          subtitle="Shows exactly where money can be used by branch and method."
        >
          {loading ? (
            <div className="grid gap-3">
              <div className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
              <div className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
            </div>
          ) : visibleBranchMethodRows.length === 0 ? (
            <EmptyState text="No branch-method movement found for the selected filters." />
          ) : (
            <div className="grid gap-3">
              {visibleBranchMethodRows.map((row, idx) => (
                <BranchMethodCard row={row} idx={idx} key={`${row?.locationId || "loc"}-${row?.method || "m"}-${idx}`} />
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
