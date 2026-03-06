"use client";

import { getMe, logout } from "../../../lib/auth";
import { useEffect, useMemo, useState } from "react";

import AppShell from "../../../components/AppShell";
import AsyncButton from "../../../components/AsyncButton";
import DashboardSkeleton from "../../../components/PageSkeleton";
import { apiFetch } from "../../../lib/api";
import { useRouter } from "next/navigation";

function safe(v) {
  return String(v ?? "").trim();
}

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function downloadCSV(filename, rows) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell == null ? "" : String(cell);
          return `"${value.replaceAll('"', '""')}"`;
        })
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black text-stone-950 dark:text-stone-50">
        {value}
      </p>
      {sub ? (
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">{sub}</p>
      ) : null}
    </div>
  );
}

function SectionCard({ title, subtitle, right = null, children }) {
  return (
    <section className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 dark:border-stone-800 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
            {title}
          </p>
          {subtitle ? (
            <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
              {subtitle}
            </p>
          ) : null}
        </div>

        {right ? <div className="shrink-0">{right}</div> : null}
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function AlertBox({ message }) {
  if (!message) return null;

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
      {message}
    </div>
  );
}

function LocationCard({ row, active, onSelect }) {
  const totalOperationalLoad =
    safeNumber(row?.usersCount) +
    safeNumber(row?.productsCount) +
    safeNumber(row?.salesCount) +
    safeNumber(row?.paymentsCount);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(row)}
      className={
        "w-full rounded-[28px] border p-5 text-left shadow-sm transition " +
        (active
          ? "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950"
          : "border-stone-200 bg-white hover:-translate-y-0.5 hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700")
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={
              "text-xs font-semibold uppercase tracking-[0.18em] " +
              (active
                ? "text-stone-300 dark:text-stone-600"
                : "text-stone-500 dark:text-stone-400")
            }
          >
            Branch
          </p>
          <h3 className="mt-2 text-xl font-black">
            {safe(row?.name) || "Unnamed branch"}
          </h3>
          <p
            className={
              "mt-2 text-sm " +
              (active
                ? "text-stone-200 dark:text-stone-700"
                : "text-stone-600 dark:text-stone-300")
            }
          >
            Code: {safe(row?.code) || "-"}
          </p>
        </div>

        <div
          className={
            "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] " +
            (active
              ? "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950"
              : "border border-stone-200 bg-stone-50 text-stone-600 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-300")
          }
        >
          Load {totalOperationalLoad}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Users", value: safeNumber(row?.usersCount) },
          { label: "Products", value: safeNumber(row?.productsCount) },
          { label: "Sales", value: safeNumber(row?.salesCount) },
          { label: "Payments", value: safeNumber(row?.paymentsCount) },
        ].map((item) => (
          <div
            key={item.label}
            className={
              "rounded-2xl border p-3 " +
              (active
                ? "border-white/10 bg-white/5 dark:border-stone-300 dark:bg-stone-200"
                : "border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950")
            }
          >
            <p
              className={
                "text-xs uppercase tracking-[0.15em] " +
                (active
                  ? "text-stone-300 dark:text-stone-600"
                  : "text-stone-500 dark:text-stone-400")
              }
            >
              {item.label}
            </p>
            <p className="mt-2 text-lg font-bold">{item.value}</p>
          </div>
        ))}
      </div>
    </button>
  );
}

export default function OwnerLocationsPage() {
  const router = useRouter();

  const [me, setMe] = useState(null);
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      setBooting(true);

      try {
        const data = await getMe();
        const user = data?.user || null;

        if (!alive) return;

        if (!user || user.role !== "owner") {
          router.replace("/login");
          return;
        }

        setMe(user);
      } catch {
        if (!alive) return;
        router.replace("/login");
      } finally {
        if (alive) setBooting(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  async function loadLocations() {
    setLoading(true);
    setErrorText("");

    try {
      const data = await apiFetch("/owner/locations", { method: "GET" });
      const rows = Array.isArray(data?.locations) ? data.locations : [];
      setLocations(rows);

      setSelectedLocationId((prev) => {
        if (prev && rows.some((x) => String(x.id) === String(prev))) {
          return prev;
        }
        return rows[0]?.id ?? null;
      });
    } catch (error) {
      setLocations([]);
      setErrorText(
        error?.data?.error || error?.message || "Failed to load locations",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!me) return;
    loadLocations();
  }, [me]);

  const selectedLocation = useMemo(() => {
    return (
      locations.find((row) => String(row.id) === String(selectedLocationId)) ||
      null
    );
  }, [locations, selectedLocationId]);

  const totalUsers = useMemo(
    () => locations.reduce((sum, row) => sum + safeNumber(row?.usersCount), 0),
    [locations],
  );

  const totalProducts = useMemo(
    () =>
      locations.reduce((sum, row) => sum + safeNumber(row?.productsCount), 0),
    [locations],
  );

  const totalSales = useMemo(
    () => locations.reduce((sum, row) => sum + safeNumber(row?.salesCount), 0),
    [locations],
  );

  const largestBySales = useMemo(() => {
    if (!locations.length) return null;
    return [...locations].sort(
      (a, b) => safeNumber(b?.salesCount) - safeNumber(a?.salesCount),
    )[0];
  }, [locations]);

  const largestByUsers = useMemo(() => {
    if (!locations.length) return null;
    return [...locations].sort(
      (a, b) => safeNumber(b?.usersCount) - safeNumber(a?.usersCount),
    )[0];
  }, [locations]);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  async function exportLocationsCsv() {
    const rows = [
      ["Branch Name", "Branch Code", "Users", "Products", "Sales", "Payments"],
      ...locations.map((row) => [
        row?.name ?? "",
        row?.code ?? "",
        row?.usersCount ?? 0,
        row?.productsCount ?? 0,
        row?.salesCount ?? 0,
        row?.paymentsCount ?? 0,
      ]),
    ];

    downloadCSV("owner-locations.csv", rows);
  }

  if (booting) {
    return (
      <div className="min-h-screen bg-stone-100 p-5 dark:bg-stone-950">
        <div className="mx-auto max-w-7xl">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <AppShell
      title="Branch Locations"
      subtitle="See every branch clearly, compare operational weight, and move faster as the owner."
      user={me}
      onLogout={handleLogout}
      navItems={[
        { key: "dashboard", label: "Dashboard" },
        { key: "branches", label: "Branches", badge: locations.length || 0 },
        { key: "staff", label: "Staff" },
        { key: "audit", label: "Audit" },
      ]}
      activeKey="branches"
      onNavigate={(key) => {
        if (key === "dashboard") router.push("/dashboard");
        if (key === "branches") router.push("/owner/locations");
        if (key === "staff") router.push("/owner/users");
        if (key === "audit") router.push("/owner/audit");
      }}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center rounded-full border border-stone-300 bg-stone-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-300">
              Branch control
            </div>

            <h1 className="mt-4 text-3xl font-black leading-tight text-stone-950 dark:text-stone-50 sm:text-4xl">
              The business is only manageable when branch structure is clear.
            </h1>

            <p className="mt-3 text-base leading-7 text-stone-700 dark:text-stone-300">
              This page shows the branches that exist, their codes, and their
              current operational weight so you can judge where attention is
              needed.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <AsyncButton
              idleText="Refresh branches"
              loadingText="Refreshing..."
              successText="Refreshed"
              onClick={loadLocations}
              variant="secondary"
            />

            <AsyncButton
              idleText="Export branches"
              loadingText="Exporting..."
              successText="Exported"
              onClick={exportLocationsCsv}
            />
          </div>
        </div>

        <AlertBox message={errorText} />

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Branches"
                value={locations.length}
                sub="Visible location records"
              />
              <StatCard
                label="Users"
                value={totalUsers}
                sub="Accounts across branches"
              />
              <StatCard
                label="Products"
                value={totalProducts}
                sub="Tracked product load"
              />
              <StatCard
                label="Sales records"
                value={totalSales}
                sub="Current branch sales count"
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <SectionCard
                title="Branch list"
                subtitle="Select a branch to inspect its current structure faster."
              >
                {locations.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm text-stone-600 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-300">
                    No branch data is available yet.
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {locations.map((row) => (
                      <LocationCard
                        key={row.id}
                        row={row}
                        active={String(row.id) === String(selectedLocationId)}
                        onSelect={(picked) => setSelectedLocationId(picked?.id)}
                      />
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="Owner interpretation"
                subtitle="This section translates the branch data into fast business signals."
              >
                <div className="space-y-3">
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                    <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      Heaviest sales branch
                    </p>
                    <p className="mt-2 text-sm leading-6 text-stone-700 dark:text-stone-300">
                      {largestBySales
                        ? `${safe(largestBySales.name)} (${safe(
                            largestBySales.code,
                          )}) currently leads by sales count with ${safeNumber(
                            largestBySales.salesCount,
                          )} sale records.`
                        : "No sales comparison is available yet."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                    <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      Largest staff footprint
                    </p>
                    <p className="mt-2 text-sm leading-6 text-stone-700 dark:text-stone-300">
                      {largestByUsers
                        ? `${safe(largestByUsers.name)} (${safe(
                            largestByUsers.code,
                          )}) has the biggest user footprint with ${safeNumber(
                            largestByUsers.usersCount,
                          )} staff account${
                            safeNumber(largestByUsers.usersCount) === 1
                              ? ""
                              : "s"
                          }.`
                        : "No staff footprint comparison is available yet."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                    <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      Selected branch focus
                    </p>
                    <p className="mt-2 text-sm leading-6 text-stone-700 dark:text-stone-300">
                      {selectedLocation
                        ? `${safe(selectedLocation.name)} (${safe(
                            selectedLocation.code,
                          )}) currently shows ${safeNumber(
                            selectedLocation.usersCount,
                          )} users, ${safeNumber(
                            selectedLocation.productsCount,
                          )} products, ${safeNumber(
                            selectedLocation.salesCount,
                          )} sales, and ${safeNumber(
                            selectedLocation.paymentsCount,
                          )} payments.`
                        : "Pick a branch to inspect its current picture."}
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>

            <SectionCard
              title="Selected branch detail"
              subtitle="Use this to inspect one branch clearly before moving to staff or audit pages."
              right={
                selectedLocation ? (
                  <div className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-600 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-300">
                    {safe(selectedLocation.code) || "No code"}
                  </div>
                ) : null
              }
            >
              {!selectedLocation ? (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm text-stone-600 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-300">
                  Select a branch card above to inspect its details here.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                    <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                      Branch name
                    </p>
                    <p className="mt-2 text-lg font-bold text-stone-950 dark:text-stone-50">
                      {safe(selectedLocation.name)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                    <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                      Branch code
                    </p>
                    <p className="mt-2 text-lg font-bold text-stone-950 dark:text-stone-50">
                      {safe(selectedLocation.code) || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                    <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                      Users
                    </p>
                    <p className="mt-2 text-lg font-bold text-stone-950 dark:text-stone-50">
                      {safeNumber(selectedLocation.usersCount)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                    <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                      Products
                    </p>
                    <p className="mt-2 text-lg font-bold text-stone-950 dark:text-stone-50">
                      {safeNumber(selectedLocation.productsCount)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                    <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                      Sales
                    </p>
                    <p className="mt-2 text-lg font-bold text-stone-950 dark:text-stone-50">
                      {safeNumber(selectedLocation.salesCount)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                    <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                      Payments
                    </p>
                    <p className="mt-2 text-lg font-bold text-stone-950 dark:text-stone-50">
                      {safeNumber(selectedLocation.paymentsCount)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950 md:col-span-2">
                    <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                      Recommended next owner action
                    </p>
                    <p className="mt-2 text-sm leading-6 text-stone-700 dark:text-stone-300">
                      From here, the next serious step is to connect this branch
                      view to staff management so you can inspect and control
                      the people assigned to each location with the same
                      clarity.
                    </p>
                  </div>
                </div>
              )}
            </SectionCard>
          </>
        )}
      </div>
    </AppShell>
  );
}
