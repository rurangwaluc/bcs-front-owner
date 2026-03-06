"use client";

import { EmptyState, SectionCard } from "../OwnerShared";

export default function OwnerSupplierBillsTab() {
  return (
    <SectionCard
      title="Supplier Bills"
      subtitle="Supplier financial obligations will live here."
    >
      <EmptyState text="Supplier Bills module placeholder. This will show supplier bills, balances, due amounts, and settlement tracking." />
    </SectionCard>
  );
}
