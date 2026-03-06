"use client";

import { EmptyState, SectionCard } from "../OwnerShared";

export default function OwnerPaymentsTab() {
  return (
    <SectionCard
      title="Payments"
      subtitle="Payment visibility and reconciliation controls will live here."
    >
      <EmptyState text="Payments module placeholder. This will cover payment records, branch payment activity, and payment monitoring." />
    </SectionCard>
  );
}
