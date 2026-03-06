"use client";

import { EmptyState, SectionCard } from "../OwnerShared";

export default function OwnerSalesTab() {
  return (
    <SectionCard
      title="Sales"
      subtitle="Sales visibility and sales control will live here."
    >
      <EmptyState text="Sales module placeholder. This will show branch sales performance, sale records, and owner-level sales oversight." />
    </SectionCard>
  );
}
