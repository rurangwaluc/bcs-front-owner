"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import ThemeToggle from "./ThemeToggle";

function safe(v) {
  return String(v ?? "").trim();
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function MenuIcon({ open = false }) {
  return (
    <span className="relative inline-flex h-5 w-5 items-center justify-center">
      <span
        className={cx(
          "absolute block h-0.5 w-5 rounded-full bg-current transition-all duration-300",
          open ? "translate-y-0 rotate-45" : "-translate-y-1.5 rotate-0",
        )}
      />
      <span
        className={cx(
          "absolute block h-0.5 w-5 rounded-full bg-current transition-all duration-300",
          open ? "opacity-0" : "opacity-100",
        )}
      />
      <span
        className={cx(
          "absolute block h-0.5 w-5 rounded-full bg-current transition-all duration-300",
          open ? "translate-y-0 -rotate-45" : "translate-y-1.5 rotate-0",
        )}
      />
    </span>
  );
}

function TopNavButton({ item, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex min-h-[42px] items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition",
        active
          ? "border-stone-900 bg-stone-900 text-white shadow-sm dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950"
          : "border-stone-200 bg-white text-stone-800 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800",
      )}
    >
      <span className="whitespace-nowrap">{item.label}</span>
      {item.badge != null ? (
        <span
          className={cx(
            "inline-flex min-w-[22px] items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-extrabold",
            active
              ? "bg-white/15 text-white dark:bg-stone-950/10 dark:text-stone-950"
              : "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
          )}
        >
          {item.badge}
        </span>
      ) : null}
    </button>
  );
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileNavRef = useRef(null);

  const activeNavItem = useMemo(() => {
    return navItems.find((n) => String(n.key) === String(activeKey)) || null;
  }, [navItems, activeKey]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!mobileNavRef.current) return;
      if (!mobileNavRef.current.contains(event.target)) {
        setMobileNavOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleNavigate(key) {
    onNavigate?.(key);
    setMobileNavOpen(false);
  }

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950">
      <div className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <div className="truncate text-lg font-bold text-stone-900 dark:text-stone-100 sm:text-xl">
                  {safe(title)}
                </div>

                {safe(subtitle) ? (
                  <div className="mt-1 max-w-3xl text-sm leading-6 text-stone-600 dark:text-stone-400">
                    {safe(subtitle)}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-3 lg:ml-auto lg:justify-end">
                <div className="lg:hidden" ref={mobileNavRef}>
                  <button
                    type="button"
                    aria-label={
                      mobileNavOpen ? "Close navigation" : "Open navigation"
                    }
                    aria-expanded={mobileNavOpen}
                    onClick={() => setMobileNavOpen((prev) => !prev)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-300 bg-white text-stone-800 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                  >
                    <MenuIcon open={mobileNavOpen} />
                  </button>

                  <div
                    className={cx(
                      "absolute left-4 right-4 top-[calc(100%+10px)] origin-top rounded-3xl border border-stone-200 bg-white p-3 shadow-2xl transition-all duration-200 dark:border-stone-800 dark:bg-stone-900 sm:left-5 sm:right-5",
                      mobileNavOpen
                        ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                        : "pointer-events-none -translate-y-2 scale-95 opacity-0",
                    )}
                  >
                    <div className="mb-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-800 dark:bg-stone-950">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400">
                        Current tab
                      </p>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-bold text-stone-900 dark:text-stone-100">
                          {safe(activeNavItem?.label || "Dashboard")}
                        </p>

                        {activeNavItem?.badge != null ? (
                          <span className="inline-flex rounded-lg bg-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                            {activeNavItem.badge}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto pr-1">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {navItems.map((n) => {
                          const active = String(n.key) === String(activeKey);

                          return (
                            <button
                              key={n.key}
                              type="button"
                              onClick={() => handleNavigate(n.key)}
                              className={cx(
                                "flex min-h-[48px] w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition",
                                active
                                  ? "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950"
                                  : "border-stone-200 bg-white text-stone-900 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800",
                              )}
                            >
                              <span className="truncate">{n.label}</span>

                              {n.badge != null ? (
                                <span
                                  className={cx(
                                    "shrink-0 rounded-lg px-2 py-0.5 text-xs font-semibold",
                                    active
                                      ? "bg-white/15 dark:bg-stone-950/10"
                                      : "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
                                  )}
                                >
                                  {n.badge}
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <ThemeToggle />

                {user?.email ? (
                  <div className="hidden items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 md:flex dark:border-stone-800 dark:bg-stone-900">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-white dark:bg-stone-100 dark:text-stone-950">
                      {(String(user.email || "U")[0] || "U").toUpperCase()}
                    </div>
                    <div className="max-w-[220px] truncate text-xs text-stone-700 dark:text-stone-300">
                      {user.email}
                    </div>
                  </div>
                ) : null}

                {onLogout ? (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 active:bg-stone-700 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
                  >
                    Logout
                  </button>
                ) : null}
              </div>
            </div>

            <div className="lg:hidden">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-800 dark:bg-stone-900">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400">
                  Selected tab
                </p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-bold text-stone-900 dark:text-stone-100">
                    {safe(activeNavItem?.label || "Dashboard")}
                  </p>

                  {activeNavItem?.badge != null ? (
                    <span className="inline-flex rounded-lg bg-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                      {activeNavItem.badge}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Large screens: wrapped sticky top nav, no horizontal scroll */}
        <div className="hidden border-t border-stone-200 dark:border-stone-800 lg:block">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-5">
            <div className="flex flex-wrap gap-2">
              {navItems.map((item) => {
                const active = String(item.key) === String(activeKey);
                return (
                  <TopNavButton
                    key={item.key}
                    item={item}
                    active={active}
                    onClick={() => onNavigate?.(item.key)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5">{children}</main>
    </div>
  );
}
