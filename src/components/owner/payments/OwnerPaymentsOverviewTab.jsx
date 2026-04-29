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

  const locationOptions = useMemo(() => {
    return Array.isArray(locations)
      ? locations.filter(
          (row) => String(row?.status || "").toUpperCase() !== "ARCHIVED",
        )
      : [];
  }, [locations]);

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
      {errorText ? <AlertBox tone="danger">{errorText}</AlertBox> : null}

      <SectionCard
        title="Overview"
        subtitle="Owner snapshot of money in, money out, net position, method strength, and branch strength."
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

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-3 sm:p-4 dark:border-stone-800 dark:bg-stone-900">
              <p className="text-[10px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                Cash net
              </p>
              <p className="mt-2 text-sm font-black text-stone-950 dark:text-stone-50 sm:text-lg">
                {money(quickStats.cashNet)}
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-3 sm:p-4 dark:border-stone-800 dark:bg-stone-900">
              <p className="text-[10px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                Mobile money net
              </p>
              <p className="mt-2 text-sm font-black text-stone-950 dark:text-stone-50 sm:text-lg">
                {money(quickStats.momoNet)}
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-3 sm:p-4 dark:border-stone-800 dark:bg-stone-900">
              <p className="text-[10px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                Bank net
              </p>
              <p className="mt-2 text-sm font-black text-stone-950 dark:text-stone-50 sm:text-lg">
                {money(quickStats.bankNet)}
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-3 sm:p-4 dark:border-stone-800 dark:bg-stone-900">
              <p className="text-[10px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                Card net
              </p>
              <p className="mt-2 text-sm font-black text-stone-950 dark:text-stone-50 sm:text-lg">
                {money(quickStats.cardNet)}
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Filters"
          subtitle="Narrow the owner overview by branch, payment method, and date."
        >
          <div className="grid gap-3">
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
          title="Quick owner actions"
          subtitle="Move fast to the next money action without hunting through one long page."
        >
          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => onOpenMovements?.()}
              className="rounded-[22px] border border-stone-200 bg-white px-4 py-4 text-left transition hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:hover:bg-stone-800"
            >
              <div className="text-sm font-black text-stone-950 dark:text-stone-50">
                Open movements
              </div>
              <div className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                Inspect the full money-in and money-out history.
              </div>
            </button>

            <button
              type="button"
              onClick={() => onOpenGivenOutLoansTab?.()}
              className="rounded-[22px] border border-stone-900 bg-stone-900 px-4 py-4 text-left text-white transition hover:bg-stone-800 dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
            >
              <div className="text-sm font-black">Go to given-out loans</div>
              <div className="mt-1 text-xs opacity-80">
                Record and manage money the business gave to other people.
              </div>
            </button>

            <button
              type="button"
              onClick={() => onOpenReceivedLoansTab?.()}
              className="rounded-[22px] border border-stone-200 bg-stone-50 px-4 py-4 text-left transition hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-950 dark:hover:bg-stone-900"
            >
              <div className="text-sm font-black text-stone-950 dark:text-stone-50">
                Go to received loans
              </div>
              <div className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                Manage money the business received and still needs to repay.
              </div>
            </button>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="Net by payment method"
          subtitle="Each method shows money in, money out, and the final net result."
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
                              className={cx(
                                "mt-1 text-sm font-semibold",
                                net >= 0
                                  ? "text-emerald-700 dark:text-emerald-300"
                                  : "text-rose-700 dark:text-rose-300",
                              )}
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
                          className={cx(
                            "mt-1 text-base font-black",
                            net >= 0
                              ? "text-emerald-700 dark:text-emerald-300"
                              : "text-rose-700 dark:text-rose-300",
                          )}
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
    </div>
  );
}
