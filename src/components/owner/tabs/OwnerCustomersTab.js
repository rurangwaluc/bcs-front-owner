"use client";

import { EmptyState, SectionCard } from "../OwnerShared";

export default function OwnerCustomersTab() {
  return (
    <SectionCard
      title="Customers"
      subtitle="Customer records and customer activity will live here."
    >
      <EmptyState text="Customers module placeholder. This will show customer profiles, buying activity, and customer-related branch insights." />
    </SectionCard>
  );
}
