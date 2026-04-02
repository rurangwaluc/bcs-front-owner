"use client";

import { useRouter } from "next/navigation";

function safe(v) {
  return String(v ?? "").trim();
}

export default function RoleBar({
  title = "Owner",
  subtitle = "",
  right = null,
  onLogout = null,
}) {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <div className="min-w-0">
          <div className="text-base font-semibold text-stone-900 dark:text-stone-100">
            {safe(title)}
          </div>

          {safe(subtitle) ? (
            <div className="mt-0.5 truncate text-xs text-stone-500 dark:text-stone-400">
              {safe(subtitle)}
            </div>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {right}

          <button
            type="button"
            onClick={() => router.refresh()}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
            title="Refresh"
          >
            Refresh
          </button>

          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg bg-stone-900 px-3 py-2 text-sm text-white transition hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
              title="Logout"
            >
              Logout
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
