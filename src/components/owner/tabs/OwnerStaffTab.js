"use client";

import {
  EmptyState,
  FormInput,
  FormSelect,
  SectionCard,
  StaffRowCard,
  StatCard,
  safe,
  safeDate,
  userActiveTone,
} from "../OwnerShared";

import AsyncButton from "../../AsyncButton";

const STAFF_STATUS_FILTERS = ["ALL", "ACTIVE", "INACTIVE"];

function normalizeRoleLabel(role) {
  const value = safe(role).replaceAll("_", " ");
  if (!value) return "-";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function OwnerStaffTab({
  users = [],
  locations = [],
  activeLocations = [],
  selectedUserId,
  onSelectUser,
  onOpenCreate,
  onOpenEdit,
  onOpenDeactivate,
  onOpenResetPassword,
  staffSearch,
  onChangeStaffSearch,
  staffStatusFilter,
  onChangeStaffStatusFilter,
  staffLocationFilter,
  onChangeStaffLocationFilter,
}) {
  const visibleUsers = Array.isArray(users)
    ? users.filter((row) => row?.role !== "owner")
    : [];

  const locationOptions = Array.isArray(locations)
    ? locations.filter((row) => safe(row?.status).toUpperCase() !== "ARCHIVED")
    : [];

  const filteredUsers = visibleUsers.filter((row) => {
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

    const matchesLocation = !staffLocationFilter
      ? true
      : String(row?.locationId ?? row?.location?.id ?? "") ===
        String(staffLocationFilter);

    return matchesSearch && matchesStatus && matchesLocation;
  });

  const selected =
    selectedUserId == null
      ? null
      : visibleUsers.find((row) => String(row.id) === String(selectedUserId)) ||
        null;

  const counts = {
    ALL: visibleUsers.length,
    ACTIVE: visibleUsers.filter((x) => !!x?.isActive).length,
    INACTIVE: visibleUsers.filter((x) => !x?.isActive).length,
  };

  const branchSummary = locationOptions.map((location) => {
    const branchUsers = visibleUsers.filter(
      (user) =>
        String(user?.locationId ?? user?.location?.id ?? "") ===
        String(location?.id),
    );

    return {
      id: location.id,
      name: safe(location.name),
      code: safe(location.code),
      status: safe(location.status),
      totalUsers: branchUsers.length,
      activeUsers: branchUsers.filter((x) => !!x?.isActive).length,
      inactiveUsers: branchUsers.filter((x) => !x?.isActive).length,
    };
  });

  return (
    <div className="space-y-6">
      <SectionCard
        title="Cross-branch staff directory"
        subtitle="Search, filter, manage staff, and reset credentials without mixing the system owner into branch staffing."
        right={
          <AsyncButton
            idleText="Create user"
            loadingText="Opening..."
            successText="Ready"
            onClick={async () => onOpenCreate?.()}
          />
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total staff"
            value={counts.ALL}
            sub="All visible branch staff accounts"
          />
          <StatCard
            label="Active staff"
            value={counts.ACTIVE}
            sub="Currently active accounts"
          />
          <StatCard
            label="Inactive staff"
            value={counts.INACTIVE}
            sub="Deactivated accounts"
          />
          <StatCard
            label="Active branches"
            value={activeLocations.length}
            sub="Branches available for assignment"
          />
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_220px_auto]">
          <FormInput
            value={staffSearch}
            onChange={(e) => onChangeStaffSearch?.(e.target.value)}
            placeholder="Search by name, email, role, branch, or code"
          />

          <FormSelect
            value={staffLocationFilter || ""}
            onChange={(e) => onChangeStaffLocationFilter?.(e.target.value)}
          >
            <option value="">All branches</option>
            {locationOptions.map((row) => (
              <option key={row.id} value={row.id}>
                {safe(row.name)} {safe(row.code) ? `(${safe(row.code)})` : ""}
              </option>
            ))}
          </FormSelect>

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

        <div className="mt-5 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {branchSummary.map((row) => (
            <div
              key={row.id}
              className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {row.name || "-"}
                  </p>
                  <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                    {row.code || "-"} · {row.status || "-"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onChangeStaffLocationFilter?.(
                      String(staffLocationFilter) === String(row.id)
                        ? ""
                        : String(row.id),
                    )
                  }
                  className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                >
                  {String(staffLocationFilter) === String(row.id)
                    ? "Selected"
                    : "Filter"}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
                  <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                    Total
                  </p>
                  <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
                    {row.totalUsers}
                  </p>
                </div>

                <div className="rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
                  <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                    Active
                  </p>
                  <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
                    {row.activeUsers}
                  </p>
                </div>

                <div className="rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
                  <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                    Inactive
                  </p>
                  <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
                    {row.inactiveUsers}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5">
          {filteredUsers.length === 0 ? (
            <EmptyState text="No staff members match the current cross-branch filters." />
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
        </div>
      </SectionCard>

      {selected ? (
        <SectionCard
          title="Selected staff detail"
          subtitle="Focused user detail, branch assignment, account control, and password reset."
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
                valueClassName="text-2xl sm:text-[20px] leading-tight"
                sub="Selected user"
              />
              <StatCard
                label="Role"
                value={normalizeRoleLabel(selected.role)}
                valueClassName="text-2xl sm:text-[20px] leading-tight"
                sub="Current responsibility"
              />
              <StatCard
                label="Branch"
                value={safe(selected.location?.name) || "-"}
                valueClassName="text-2xl sm:text-[20px] leading-tight"
                sub={safe(selected.location?.code) || "No branch code"}
              />
              <StatCard
                label="Status"
                value={selected.isActive ? "Active" : "Inactive"}
                valueClassName="text-2xl sm:text-[20px] leading-tight"
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
                    <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                      {safe(selected.name) || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-stone-500 dark:text-stone-400">
                      Email
                    </span>
                    <span className="text-right font-semibold text-stone-900 dark:text-stone-100 break-all">
                      {safe(selected.email) || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-stone-500 dark:text-stone-400">
                      Role
                    </span>
                    <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                      {normalizeRoleLabel(selected.role)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-stone-500 dark:text-stone-400">
                      Branch
                    </span>
                    <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                      {safe(selected.location?.name) || "-"}{" "}
                      {safe(selected.location?.code)
                        ? `(${safe(selected.location.code)})`
                        : ""}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-stone-500 dark:text-stone-400">
                      Branch status
                    </span>
                    <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                      {safe(selected.location?.status) || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-stone-500 dark:text-stone-400">
                      Last seen
                    </span>
                    <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
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

                  <AsyncButton
                    idleText="Reset password"
                    loadingText="Opening..."
                    successText="Ready"
                    onClick={async () => onOpenResetPassword?.(selected)}
                    variant="secondary"
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
                  Owner control is cross-branch. The system owner is not shown
                  as branch staff here. Users can only be assigned to{" "}
                  <strong>ACTIVE</strong> branches.
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
