"use client";

import { EmptyState, SectionCard } from "../OwnerShared";

export default function OwnerNotesTab() {
  return (
    <SectionCard
      title="Notes / Notifications"
      subtitle="Owner notes and notification visibility will live here."
    >
      <EmptyState text="Notes / Notifications module placeholder. This will cover owner notes, alerts, reminders, and business notifications." />
    </SectionCard>
  );
}
