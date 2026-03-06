"use client";

import ThemeToggle from "./ThemeToggle";

function safe(v) {
  return String(v ?? "").trim();
}

export default function AppShell({
  title,
  subtitle,
  user,
  onLogout,
  navItems = [],
  activeKey,
  onNavigate,
  children,
}) {
  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950">
      <div className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-4">
          <div className="min-w-0">
            <div className="text-base font-semibold text-stone-900 dark:text-stone-100">
              {safe(title)}
            </div>
            {safe(subtitle) ? (
              <div className="mt-0.5 truncate text-xs text-stone-600 dark:text-stone-400">
                {safe(subtitle)}
              </div>
            ) : null}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />

            {user?.email ? (
              <div className="hidden items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 md:flex dark:border-stone-800 dark:bg-stone-900">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-white dark:bg-stone-100 dark:text-stone-950">
                  {(String(user.email || "U")[0] || "U").toUpperCase()}
                </div>
                <div className="text-xs text-stone-700 dark:text-stone-300">
                  {user.email}
                </div>
              </div>
            ) : null}

            {onLogout ? (
              <button
                type="button"
                onClick={onLogout}
                className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 active:bg-stone-700 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
              >
                Logout
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-5 py-6 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            Navigation
          </div>

          <div className="space-y-1">
            {navItems.map((n) => {
              const active = String(n.key) === String(activeKey);

              return (
                <button
                  key={n.key}
                  type="button"
                  onClick={() => onNavigate?.(n.key)}
                  className={
                    "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm font-medium transition " +
                    (active
                      ? "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950"
                      : "border-transparent bg-white text-stone-900 hover:bg-stone-50 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800")
                  }
                >
                  <span>{n.label}</span>

                  {n.badge != null ? (
                    <span
                      className={
                        "rounded-lg px-2 py-0.5 text-xs " +
                        (active
                          ? "bg-white/15 dark:bg-stone-950/10"
                          : "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300")
                      }
                    >
                      {n.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-400">
            Tip: keep actions audited across stock, cash, refunds, and branch
            operations.
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
