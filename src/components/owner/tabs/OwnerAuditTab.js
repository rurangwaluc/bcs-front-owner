"use client";

import { EmptyState, SectionCard, safe, safeDate } from "../OwnerShared";

export default function OwnerAuditTab({ audit }) {
  const rows = [...audit].sort((a, b) => {
    const da = new Date(a?.createdAt || a?.created_at || 0).getTime();
    const db = new Date(b?.createdAt || b?.created_at || 0).getTime();
    return db - da;
  });

  return (
    <div className="space-y-6">
      <SectionCard
        title="Audit log"
        subtitle="This tab is only for operational traceability."
      >
        {rows.length === 0 ? (
          <EmptyState text="No audit records available yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left dark:border-stone-800">
                  <th className="px-3 py-3 font-semibold text-stone-600 dark:text-stone-300">
                    Action
                  </th>
                  <th className="px-3 py-3 font-semibold text-stone-600 dark:text-stone-300">
                    Entity
                  </th>
                  <th className="px-3 py-3 font-semibold text-stone-600 dark:text-stone-300">
                    Description
                  </th>
                  <th className="px-3 py-3 font-semibold text-stone-600 dark:text-stone-300">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={row?.id ?? index}
                    className="border-b border-stone-100 last:border-b-0 dark:border-stone-800"
                  >
                    <td className="px-3 py-4 text-stone-900 dark:text-stone-100">
                      {safe(row?.action || "-")}
                    </td>
                    <td className="px-3 py-4 text-stone-700 dark:text-stone-300">
                      {safe(row?.entity || "-")}
                    </td>
                    <td className="px-3 py-4 text-stone-700 dark:text-stone-300">
                      {safe(row?.description || "-")}
                    </td>
                    <td className="px-3 py-4 text-stone-700 dark:text-stone-300">
                      {safeDate(row?.createdAt || row?.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
