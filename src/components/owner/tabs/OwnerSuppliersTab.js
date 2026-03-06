"use client";

import { EmptyState, SectionCard } from "../OwnerShared";

export default function OwnerSuppliersTab() {
  return (
    <SectionCard
      title="Suppliers"
      subtitle="Supplier records and supplier management will live here."
    >
      <EmptyState text="Suppliers module placeholder. This will handle local and abroad suppliers, contacts, and supplier status." />
    </SectionCard>
  );
}
