"use client";

import { EmptyState, SectionCard } from "../OwnerShared";

export default function OwnerRefundsTab() {
  return (
    <SectionCard
      title="Refunds"
      subtitle="Refund visibility and refund control will live here."
    >
      <EmptyState text="Refunds module placeholder. This will show refund records, reasons, approvals, and branch refund activity." />
    </SectionCard>
  );
}
