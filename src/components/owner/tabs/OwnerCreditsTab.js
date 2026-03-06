"use client";

import { EmptyState, SectionCard } from "../OwnerShared";

export default function OwnerCreditsTab() {
  return (
    <SectionCard
      title="Credits"
      subtitle="Credit sales and credit follow-up will live here."
    >
      <EmptyState text="Credits module placeholder. This will cover pending credits, approvals, settlements, and branch credit exposure." />
    </SectionCard>
  );
}
