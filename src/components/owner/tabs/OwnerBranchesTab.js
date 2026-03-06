"use client";

import {
  EmptyState,
  LocationCard,
  SectionCard,
  StatCard,
  safe,
  safeDate,
  safeNumber,
  statusTone,
} from "../OwnerShared";

import AsyncButton from "../../AsyncButton";

const LOCATION_STATUSES = ["ALL", "ACTIVE", "CLOSED", "ARCHIVED"];

export default function OwnerBranchesTab({
  locations,
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
  const rows = Array.isArray(locations) ? locations : [];

  const filteredLocations =
    branchStatusFilter === "ALL"
      ? rows
      : rows.filter(
          (row) => safe(row?.status).toUpperCase() === branchStatusFilter,
        );

  const selected =
    selectedLocationId == null
      ? null
      : rows.find((row) => String(row.id) === String(selectedLocationId)) ||
        null;

  const counts = {
    ALL: rows.length,
    ACTIVE: rows.filter((x) => safe(x?.status).toUpperCase() === "ACTIVE")
      .length,
    CLOSED: rows.filter((x) => safe(x?.status).toUpperCase() === "CLOSED")
      .length,
    ARCHIVED: rows.filter((x) => safe(x?.status).toUpperCase() === "ARCHIVED")
      .length,
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="Branch directory"
        subtitle="See all branches clearly, filter by lifecycle, and select one to manage."
        right={
          <AsyncButton
            idleText="Create branch"
            loadingText="Opening..."
            successText="Ready"
            onClick={async () => onOpenCreate?.()}
          />
        }
      >
        <div className="mb-5 flex flex-wrap gap-2">
          {LOCATION_STATUSES.map((status) => {
            const active = branchStatusFilter === status;

            return (
              <button
                key={status}
                type="button"
                onClick={() => onChangeBranchStatusFilter?.(status)}
                className={
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition " +
                  (active
                    ? "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950"
                    : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800")
                }
              >
                <span>{status === "ALL" ? "All branches" : status}</span>
                <span
                  className={
                    "rounded-full px-2 py-0.5 text-xs " +
                    (active
                      ? "bg-white/10 dark:bg-stone-900/10"
                      : "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300")
                  }
                >
                  {counts[status]}
                </span>
              </button>
            );
          })}
        </div>

        {filteredLocations.length === 0 ? (
          <EmptyState text="No branches match the current filter." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredLocations.map((row) => (
              <LocationCard
                key={row.id}
                row={row}
                active={String(row.id) === String(selectedLocationId)}
                onSelect={(picked) => onSelectLocation?.(picked?.id)}
              />
            ))}
          </div>
        )}
      </SectionCard>

      {selected ? (
        <SectionCard
          title="Selected branch detail"
          subtitle="Focused detail and real branch actions."
          right={
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusTone(
                selected.status,
              )}`}
            >
              {safe(selected.status) || "-"}
            </span>
          }
        >
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <StatCard
                label="Branch name"
                value={safe(selected.name) || "-"}
                valueClassName="text-2xl sm:text-[28px] leading-tight"
                sub="Selected location"
              />
              <StatCard
                label="Users"
                value={safeNumber(selected.usersCount)}
                sub="Accounts assigned"
              />
              <StatCard
                label="Products"
                value={safeNumber(selected.productsCount)}
                sub="Tracked stock records"
              />
              <StatCard
                label="Sales"
                value={safeNumber(selected.salesCount)}
                sub="Current sales count"
              />
              <StatCard
                label="Payments"
                value={safeNumber(selected.paymentsCount)}
                sub="Current payments count"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                  Branch lifecycle detail
                </p>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-stone-500 dark:text-stone-400">
                      Code
                    </span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100">
                      {safe(selected.code) || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-stone-500 dark:text-stone-400">
                      Status
                    </span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100">
                      {safe(selected.status) || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-stone-500 dark:text-stone-400">
                      Opened at
                    </span>
                    <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                      {safeDate(selected.openedAt)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-stone-500 dark:text-stone-400">
                      Closed at
                    </span>
                    <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                      {safeDate(selected.closedAt)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-stone-500 dark:text-stone-400">
                      Archived at
                    </span>
                    <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                      {safeDate(selected.archivedAt)}
                    </span>
                  </div>

                  <div className="border-t border-stone-200 pt-3 dark:border-stone-800">
                    <p className="text-stone-500 dark:text-stone-400">Reason</p>
                    <p className="mt-2 leading-6 text-stone-800 dark:text-stone-200">
                      {safe(selected.closeReason) || "No reason recorded."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                  Branch actions
                </p>

                <div className="mt-4 space-y-3">
                  <AsyncButton
                    idleText="Edit branch"
                    loadingText="Opening..."
                    successText="Ready"
                    onClick={async () => onOpenEdit?.(selected)}
                    className="w-full"
                  />

                  {safe(selected.status).toUpperCase() === "ACTIVE" ? (
                    <AsyncButton
                      idleText="Close branch"
                      loadingText="Opening..."
                      successText="Ready"
                      onClick={async () => onOpenClose?.(selected)}
                      variant="secondary"
                      className="w-full"
                    />
                  ) : null}

                  {safe(selected.status).toUpperCase() === "CLOSED" ? (
                    <>
                      <AsyncButton
                        idleText="Reopen branch"
                        loadingText="Reopening..."
                        successText="Ready"
                        onClick={async () => onOpenReopen?.(selected)}
                        className="w-full"
                      />
                      <AsyncButton
                        idleText="Archive branch"
                        loadingText="Opening..."
                        successText="Ready"
                        onClick={async () => onOpenArchive?.(selected)}
                        variant="secondary"
                        className="w-full"
                      />
                    </>
                  ) : null}

                  {safe(selected.status).toUpperCase() === "ARCHIVED" ? (
                    <AsyncButton
                      idleText="Restore to active"
                      loadingText="Restoring..."
                      successText="Done"
                      onClick={async () => onOpenReopen?.(selected)}
                      className="w-full"
                    />
                  ) : null}
                </div>

                <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
                  Branches are never hard-deleted. Lifecycle protects history
                  across users, sales, inventory, payments, credits, and audit.
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      ) : (
        <SectionCard
          title="Selected branch detail"
          subtitle="This section appears after the owner deliberately selects a branch."
        >
          <EmptyState text="Click any branch card above to inspect its details and actions." />
        </SectionCard>
      )}
    </div>
  );
}
