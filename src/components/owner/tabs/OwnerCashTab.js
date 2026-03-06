"use client";

import { EmptyState, SectionCard } from "../OwnerShared";

export default function OwnerCashTab() {
  return (
    <SectionCard
      title="Cash"
      subtitle="Cash sessions and cash control will live here."
    >
      <EmptyState text="Cash module placeholder. This will cover cash sessions, reconciliations, deposits, and owner-level cash visibility." />
    </SectionCard>
  );
}
