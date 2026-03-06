"use client";

import { EmptyState, SectionCard } from "../OwnerShared";

export default function OwnerReportsTab() {
  return (
    <SectionCard
      title="Reports"
      subtitle="Business reporting and owner summaries will live here."
    >
      <EmptyState text="Reports module placeholder. This will contain branch reports, financial reports, stock reports, and decision-ready summaries." />
    </SectionCard>
  );
}
