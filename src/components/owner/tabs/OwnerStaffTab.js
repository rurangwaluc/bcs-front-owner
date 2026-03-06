"use client";

import {
  EmptyState,
  FormInput,
  SectionCard,
  StaffRowCard,
  StatCard,
  safe,
  safeDate,
  userActiveTone,
} from "../OwnerShared";

import AsyncButton from "../../AsyncButton";

const STAFF_STATUS_FILTERS = ["ALL", "ACTIVE", "INACTIVE"];

export default function OwnerStaffTab({
  users,
  activeLocations,
  selectedUserId,
  onSelectUser,
  onOpenCreate,
  onOpenEdit,
  onOpenDeactivate,
  staffSearch,
  onChangeStaffSearch,
  staffStatusFilter,
  onChangeStaffStatusFilter,
}) {
  const filteredUsers = users.filter((row) => {
    const query = safe(staffSearch).toLowerCase();
    const matchesSearch =
      !query ||
      safe(row?.name).toLowerCase().includes(query) ||
      safe(row?.email).toLowerCase().includes(query) ||
      safe(row?.role).toLowerCase().includes(query) ||
      safe(row?.location?.name).toLowerCase().includes(query) ||
      safe(row?.location?.code).toLowerCase().includes(query);

    const matchesStatus =
      staffStatusFilter === "ALL"
        ? true
        : staffStatusFilter === "ACTIVE"
          ? !!row?.isActive
          : !row?.isActive;

    return matchesSearch && matchesStatus;
  });

  const hasExplicitSelection = selectedUserId != null;
  const selected = hasExplicitSelection
    ? users.find((row) => String(row.id) === String(selectedUserId)) || null
    : null;

  const counts = {
    ALL: users.length,
    ACTIVE: users.filter((x) => !!x?.isActive).length,
    INACTIVE: users.filter((x) => !x?.isActive).length,
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="Staff directory"
        subtitle="The owner should control assignment, role, and account status from one place."
        right={
          <AsyncButton
            idleText="Create user"
            loadingText="Opening..."
            successText="Ready"
            onClick={async () => onOpenCreate?.()}
          />
        }
      >
        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto]">
          <FormInput
            value={staffSearch}
            onChange={(e) => onChangeStaffSearch?.(e.target.value)}
            placeholder="Search by name, email, role, or branch"
          />

          <div className="flex flex-wrap gap-2">
            {STAFF_STATUS_FILTERS.map((status) => {
              const active = staffStatusFilter === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => onChangeStaffStatusFilter?.(status)}
                  className={
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition " +
                    (active
                      ? "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950"
                      : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800")
                  }
                >
                  <span>{status === "ALL" ? "All staff" : status}</span>
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
        </div>

        {filteredUsers.length === 0 ? (
          <EmptyState text="No staff members match the current filters." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredUsers.map((row) => (
              <StaffRowCard
                key={row.id}
                row={row}
                active={String(row.id) === String(selectedUserId)}
                onSelect={(picked) => onSelectUser?.(picked?.id)}
              />
            ))}
          </div>
        )}
      </SectionCard>

      {selected ? (
        <SectionCard
          title="Selected staff detail"
          subtitle="Focused detail and direct account actions."
          right={
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${userActiveTone(
                !!selected?.isActive,
              )}`}
            >
              {selected?.isActive ? "Active" : "Inactive"}
            </span>
          }
        >
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <StatCard
                label="Name"
                value={safe(selected.name) || "-"}
                valueClassName="text-2xl sm:text-[18px] leading-tight"
                sub="Selected user"
              />
              <StatCard
                label="Role"
                value={safe(selected.role) || "-"}
                valueClassName="text-2xl sm:text-[18px] leading-tight capitalize"
                sub="Current responsibility"
              />
              <StatCard
                label="Branch"
                value={safe(selected.location?.name) || "-"}
                valueClassName="text-2xl sm:text-[18px] leading-tight"
                sub={safe(selected.location?.code) || "No branch code"}
              />
              <StatCard
                label="Status"
                value={selected.isActive ? "Active" : "Inactive"}
                valueClassName="text-2xl sm:text-[18px] leading-tight"
                sub="Account state"
              />
              <StatCard
                label="Created"
                value={safeDate(selected.createdAt)}
                valueClassName="text-lg sm:text-xl leading-tight"
                sub="Created at"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                  Staff detail
                </p>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-stone-500 dark:text-stone-400">
                      Full name
                    </span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100 text-right">
                      {safe(selected.name) || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-stone-500 dark:text-stone-400">
                      Email
                    </span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100 text-right break-all">
                      {safe(selected.email) || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-stone-500 dark:text-stone-400">
                      Role
                    </span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100 text-right">
                      {safe(selected.role) || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-stone-500 dark:text-stone-400">
                      Branch
                    </span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100 text-right">
                      {safe(selected.location?.name) || "-"}{" "}
                      {safe(selected.location?.code)
                        ? `(${safe(selected.location.code)})`
                        : ""}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-stone-500 dark:text-stone-400">
                      Last seen
                    </span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100 text-right">
                      {safeDate(selected.lastSeenAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                  Staff actions
                </p>

                <div className="mt-4 space-y-3">
                  <AsyncButton
                    idleText="Edit user"
                    loadingText="Opening..."
                    successText="Ready"
                    onClick={async () => onOpenEdit?.(selected)}
                    className="w-full"
                  />

                  {selected?.isActive ? (
                    <AsyncButton
                      idleText="Deactivate user"
                      loadingText="Opening..."
                      successText="Ready"
                      onClick={async () => onOpenDeactivate?.(selected)}
                      variant="secondary"
                      className="w-full"
                    />
                  ) : null}
                </div>

                <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
                  Users can only be assigned to <strong>ACTIVE</strong>{" "}
                  branches. Available active branches right now:{" "}
                  {activeLocations.length}.
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      ) : (
        <SectionCard
          title="Selected staff detail"
          subtitle="This section appears after the owner deliberately selects a user."
        >
          <EmptyState text="Click any staff card above to inspect details and manage the account." />
        </SectionCard>
      )}
    </div>
  );
}
