"use client";

import { EmptyState, SectionCard } from "../OwnerShared";

export default function OwnerInventoryTab() {
  return (
    <SectionCard
      title="Inventory"
      subtitle="Stock control across branches will live here."
    >
      <EmptyState text="Inventory module placeholder. Next real build target: inventory visibility, stock balances, and branch-level stock movement." />
    </SectionCard>
  );
}
