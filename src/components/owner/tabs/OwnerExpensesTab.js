"use client";

import { EmptyState, SectionCard } from "../OwnerShared";

export default function OwnerExpensesTab() {
  return (
    <SectionCard
      title="Expenses"
      subtitle="Business expense tracking will live here."
    >
      <EmptyState text="Expenses module placeholder. This will cover expense records, branch expenses, and owner-level expense visibility." />
    </SectionCard>
  );
}
