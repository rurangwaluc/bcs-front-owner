"use client";

import { EmptyState, SectionCard } from "../OwnerShared";

export default function OwnerProductsTab() {
  return (
    <SectionCard
      title="Products"
      subtitle="Product catalog and product control will live here."
    >
      <EmptyState text="Products module placeholder. This will handle catalog structure, pricing, and product availability." />
    </SectionCard>
  );
}
