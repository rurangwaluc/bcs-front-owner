"use client";

import {
  EmptyState,
  SectionCard,
  StatCard,
  safe,
  safeDate,
} from "../OwnerShared";

import { resolveAssetUrl } from "../../../lib/apiUpload";
import { useMemo } from "react";

const BRANCH_STATUS_FILTERS = ["ALL", "ACTIVE", "CLOSED", "ARCHIVED"];

function branchStatusTone(status) {
  const value = safe(status).toUpperCase();

  if (value === "ACTIVE") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300";
  }

  if (value === "CLOSED") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300";
  }

  if (value === "ARCHIVED") {
    return "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
  }

  return "bg-stone-100 text-stone-700 dark:bg-stone-900 dark:text-stone-300";
}

function normalizeBankAccounts(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((acc) => {
      if (!acc) return "";

      if (typeof acc === "string") {
        return acc.trim();
      }

      const bankName = safe(acc.bankName) || safe(acc.bank) || safe(acc.name);
      const accountName = safe(acc.accountName) || safe(acc.holderName);
      const accountNumber = safe(acc.accountNumber) || safe(acc.number);

      return [bankName, accountName, accountNumber].filter(Boolean).join(" • ");
    })
    .filter(Boolean);
}

function BranchIdentityCard({
  location,
  active,
  onSelect,
  onOpenEdit,
  onOpenClose,
  onOpenReopen,
  onOpenArchive,
}) {
  const logoUrl = safe(location?.logoUrl)
    ? resolveAssetUrl(location.logoUrl)
    : "";

  return (
    <div
      className={
        "rounded-[28px] border p-5 transition shadow-sm " +
        (active
          ? "border-stone-900 bg-stone-50 dark:border-stone-100 dark:bg-stone-900"
          : "border-stone-200 bg-white hover:border-stone-300 dark:border-stone-800 dark:bg-stone-950 dark:hover:border-stone-700")
      }
    >
      <div className="flex items-start justify-between gap-4">
        <button
          type="button"
          onClick={() => onSelect?.(location?.id)}
          className="flex min-w-0 flex-1 items-start gap-4 text-left"
        >
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-stone-200 bg-white p-2 dark:border-stone-700 dark:bg-stone-900">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${safe(location?.name) || "Branch"} logo`}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="text-xs font-black uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                {safe(location?.code) || "LOGO"}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-bold text-stone-950 dark:text-stone-50">
                {safe(location?.name) || "-"}
              </h3>

              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${branchStatusTone(
                  location?.status,
                )}`}
              >
                {safe(location?.status) || "-"}
              </span>
            </div>

            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Code:{" "}
              <span className="font-semibold">
                {safe(location?.code) || "-"}
              </span>
            </p>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-stone-600 dark:text-stone-300">
              {safe(location?.phone) ? (
                <span>Tel: {safe(location.phone)}</span>
              ) : null}
              {safe(location?.website) ? (
                <span>{safe(location.website)}</span>
              ) : null}
            </div>
          </div>
        </button>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onOpenEdit?.(location)}
            className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            Edit
          </button>

          {safe(location?.status).toUpperCase() === "ACTIVE" ? (
            <button
              type="button"
              onClick={() => onOpenClose?.(location)}
              className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Close
            </button>
          ) : null}

          {safe(location?.status).toUpperCase() === "CLOSED" ? (
            <button
              type="button"
              onClick={() => onOpenReopen?.(location)}
              className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Reopen
            </button>
          ) : null}

          {safe(location?.status).toUpperCase() !== "ARCHIVED" ? (
            <button
              type="button"
              onClick={() => onOpenArchive?.(location)}
              className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Archive
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
            Users
          </p>
          <p className="mt-2 text-lg font-black text-stone-950 dark:text-stone-50">
            {location?.usersCount ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
            Products
          </p>
          <p className="mt-2 text-lg font-black text-stone-950 dark:text-stone-50">
            {location?.productsCount ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
            Sales
          </p>
          <p className="mt-2 text-lg font-black text-stone-950 dark:text-stone-50">
            {location?.salesCount ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
            Payments
          </p>
          <p className="mt-2 text-lg font-black text-stone-950 dark:text-stone-50">
            {location?.paymentsCount ?? 0}
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, monospace = false }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-stone-200 py-3 last:border-b-0 dark:border-stone-800">
      <span className="text-sm text-stone-500 dark:text-stone-400">
        {label}
      </span>
      <span
        className={
          "max-w-[65%] text-right text-sm font-semibold text-stone-900 dark:text-stone-100 " +
          (monospace ? "font-mono" : "")
        }
      >
        {value || "-"}
      </span>
    </div>
  );
}

function SelectedBranchPanel({
  location,
  onOpenEdit,
  onOpenClose,
  onOpenReopen,
  onOpenArchive,
}) {
  if (!location) {
    return (
      <SectionCard
        title="Selected branch detail"
        subtitle="Pick a branch card to inspect its full identity and business-ready branding data."
      >
        <EmptyState text="Select any branch to view logo, website, phone, identity, and operational detail." />
      </SectionCard>
    );
  }

  const logoUrl = safe(location?.logoUrl)
    ? resolveAssetUrl(location.logoUrl)
    : "";
  const bankAccounts = normalizeBankAccounts(location?.bankAccounts);

  return (
    <SectionCard
      title="Selected branch detail"
      subtitle="This is the branch identity that should drive documents, branch switching, and operational trust."
      right={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onOpenEdit?.(location)}
            className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            Edit
          </button>

          {safe(location?.status).toUpperCase() === "ACTIVE" ? (
            <button
              type="button"
              onClick={() => onOpenClose?.(location)}
              className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Close
            </button>
          ) : null}

          {safe(location?.status).toUpperCase() === "CLOSED" ? (
            <button
              type="button"
              onClick={() => onOpenReopen?.(location)}
              className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Reopen
            </button>
          ) : null}

          {safe(location?.status).toUpperCase() !== "ARCHIVED" ? (
            <button
              type="button"
              onClick={() => onOpenArchive?.(location)}
              className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Archive
            </button>
          ) : null}
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
          <div className="flex items-start gap-5">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${safe(location?.name) || "Branch"} logo`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="text-center">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                    No logo
                  </div>
                  <div className="mt-2 text-sm font-bold text-stone-700 dark:text-stone-300">
                    {safe(location?.code) || "—"}
                  </div>
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-2xl font-black tracking-[-0.02em] text-stone-950 dark:text-stone-50">
                  {safe(location?.name) || "-"}
                </h3>

                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${branchStatusTone(
                    location?.status,
                  )}`}
                >
                  {safe(location?.status) || "-"}
                </span>
              </div>

              <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                Branch code:{" "}
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  {safe(location?.code) || "-"}
                </span>
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                    Phone
                  </p>
                  <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-100 break-all">
                    {safe(location?.phone) || "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                    Website
                  </p>
                  <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-100 break-all">
                    {safe(location?.website) || "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                    Email
                  </p>
                  <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-100 break-all">
                    {safe(location?.email) || "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                    Address
                  </p>
                  <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {safe(location?.address) || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {safe(location?.tin) ||
          safe(location?.momoCode) ||
          bankAccounts.length > 0 ? (
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                  TIN
                </p>
                <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-100 break-all">
                  {safe(location?.tin) || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                  MoMo code
                </p>
                <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-100 break-all">
                  {safe(location?.momoCode) || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                  Bank accounts
                </p>

                {bankAccounts.length ? (
                  <div className="mt-2 space-y-2">
                    {bankAccounts.map((acc, idx) => (
                      <div
                        key={idx}
                        className="text-sm font-semibold text-stone-900 dark:text-stone-100 break-words"
                      >
                        {acc}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
                    -
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-5">
          <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
              Operational detail
            </p>

            <div className="mt-4">
              <DetailRow
                label="Opened at"
                value={safeDate(location?.openedAt)}
              />
              <DetailRow
                label="Closed at"
                value={safeDate(location?.closedAt)}
              />
              <DetailRow
                label="Archived at"
                value={safeDate(location?.archivedAt)}
              />
              <DetailRow
                label="Last updated"
                value={safeDate(location?.updatedAt)}
              />
              <DetailRow
                label="Close reason"
                value={safe(location?.closeReason)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Users"
              value={location?.usersCount ?? 0}
              sub="Assigned users"
            />
            <StatCard
              label="Products"
              value={location?.productsCount ?? 0}
              sub="Catalog items"
            />
            <StatCard
              label="Sales"
              value={location?.salesCount ?? 0}
              sub="Recorded sales"
            />
            <StatCard
              label="Payments"
              value={location?.paymentsCount ?? 0}
              sub="Recorded payments"
            />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

export default function OwnerBranchesTab({
  locations = [],
  selectedLocationId,
  onSelectLocation,
  branchStatusFilter,
  onChangeBranchStatusFilter,
  onOpenCreate,
  onOpenEdit,
  onOpenClose,
  onOpenReopen,
  onOpenArchive,
}) {
  const filteredLocations = useMemo(() => {
    const list = Array.isArray(locations) ? locations : [];

    return list.filter((row) => {
      if (branchStatusFilter === "ALL") return true;
      return safe(row?.status).toUpperCase() === branchStatusFilter;
    });
  }, [locations, branchStatusFilter]);

  const selectedLocation = useMemo(() => {
    if (selectedLocationId == null) return null;

    return (
      locations.find((row) => String(row.id) === String(selectedLocationId)) ||
      null
    );
  }, [locations, selectedLocationId]);

  const totalCounts = useMemo(() => {
    const list = Array.isArray(locations) ? locations : [];

    return {
      total: list.length,
      active: list.filter((x) => safe(x?.status).toUpperCase() === "ACTIVE")
        .length,
      closed: list.filter((x) => safe(x?.status).toUpperCase() === "CLOSED")
        .length,
      archived: list.filter((x) => safe(x?.status).toUpperCase() === "ARCHIVED")
        .length,
    };
  }, [locations]);

  return (
    <div className="space-y-6">
      <SectionCard
        title="Branch control"
        subtitle="Branch structure should be visible, editable, and operationally trustworthy from one owner screen."
        right={
          <button
            type="button"
            onClick={() => onOpenCreate?.()}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
          >
            Create branch
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total branches"
            value={totalCounts.total}
            sub="All branch records"
          />
          <StatCard
            label="Active"
            value={totalCounts.active}
            sub="Operational branches"
          />
          <StatCard
            label="Closed"
            value={totalCounts.closed}
            sub="Closed but retained"
          />
          <StatCard
            label="Archived"
            value={totalCounts.archived}
            sub="History only"
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {BRANCH_STATUS_FILTERS.map((status) => {
            const active = branchStatusFilter === status;

            return (
              <button
                key={status}
                type="button"
                onClick={() => onChangeBranchStatusFilter?.(status)}
                className={
                  "inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition " +
                  (active
                    ? "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950"
                    : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800")
                }
              >
                {status === "ALL" ? "All branches" : status}
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          {filteredLocations.length === 0 ? (
            <EmptyState text="No branches match the current status filter." />
          ) : (
            <div className="grid gap-4">
              {filteredLocations.map((location) => (
                <BranchIdentityCard
                  key={location.id}
                  location={location}
                  active={String(location.id) === String(selectedLocationId)}
                  onSelect={onSelectLocation}
                  onOpenEdit={onOpenEdit}
                  onOpenClose={onOpenClose}
                  onOpenReopen={onOpenReopen}
                  onOpenArchive={onOpenArchive}
                />
              ))}
            </div>
          )}
        </div>
      </SectionCard>

      <SelectedBranchPanel
        location={selectedLocation}
        onOpenEdit={onOpenEdit}
        onOpenClose={onOpenClose}
        onOpenReopen={onOpenReopen}
        onOpenArchive={onOpenArchive}
      />
    </div>
  );
}
