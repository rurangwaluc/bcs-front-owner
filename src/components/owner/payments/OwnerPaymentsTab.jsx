"use client";

import { useMemo, useState } from "react";

import OwnerPaymentsGivenOutLoansTab from "./OwnerPaymentsGivenOutLoansTab";
import OwnerPaymentsMovementsTab from "./OwnerPaymentsMovementsTab";
import OwnerPaymentsOverviewTab from "./OwnerPaymentsOverviewTab";
import OwnerPaymentsReceivedLoansTab from "./OwnerPaymentsReceivedLoansTab";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

const PAYMENT_TABS = [
  {
    key: "overview",
    label: "Overview",
    hint: "Net picture, quick actions, and recent movement.",
  },
  {
    key: "movements",
    label: "Movements",
    hint: "Full money-in and money-out history.",
  },
  {
    key: "give-out-loans",
    label: "Give out loans",
    hint: "Business money given to other people.",
  },
  {
    key: "receive-loans",
    label: "Receive loans",
    hint: "Money the business received and must repay.",
  },
];

function PremiumShellCard({ className = "", children }) {
  return (
    <div
      className={cx(
        "rounded-[28px] border border-stone-200 bg-white shadow-[0_16px_50px_rgba(28,25,23,0.06)] dark:border-stone-800 dark:bg-stone-950",
        className,
      )}
    >
      {children}
    </div>
  );
}

function TabButton({ active, label, hint, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "group rounded-[22px] border px-4 py-3 text-left transition",
        active
          ? "border-stone-900 bg-stone-900 text-white shadow-sm dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950"
          : "border-stone-200 bg-white text-stone-900 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-100 dark:hover:bg-stone-900",
      )}
    >
      <div className="text-sm font-black tracking-[-0.02em]">{label}</div>
      <div
        className={cx(
          "mt-1 text-xs leading-5",
          active
            ? "text-stone-300 dark:text-stone-700"
            : "text-stone-500 dark:text-stone-400",
        )}
      >
        {hint}
      </div>
    </button>
  );
}

export default function OwnerPaymentsTab({ locations = [] }) {
  const [activeTab, setActiveTab] = useState("overview");

  const activeTabMeta = useMemo(() => {
    return PAYMENT_TABS.find((tab) => tab.key === activeTab) || PAYMENT_TABS[0];
  }, [activeTab]);

  return (
    <div className="space-y-5">
      <PremiumShellCard className="overflow-hidden">
        <div className="border-b border-stone-200 bg-gradient-to-b from-white via-stone-50 to-stone-100 px-5 py-6 dark:border-stone-800 dark:bg-gradient-to-br dark:from-stone-950 dark:via-stone-900 dark:to-stone-800 sm:px-6 sm:py-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400">
                Owner payments
              </div>

              <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-stone-950 dark:text-white sm:text-3xl">
                Money control room
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600 dark:text-stone-300">
                Stop making the owner hunt through one long screen. This shell
                separates the money system into clear work zones so you can move
                faster: overview first, then movements, then loans given out,
                then loans received.
              </p>
            </div>

            <div className="shrink-0 rounded-[24px] border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-700 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:text-stone-200">
              Active tab:{" "}
              <span className="font-black text-stone-950 dark:text-white">
                {activeTabMeta.label}
              </span>
            </div>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {PAYMENT_TABS.map((tab) => (
              <TabButton
                key={tab.key}
                active={activeTab === tab.key}
                label={tab.label}
                hint={tab.hint}
                onClick={() => setActiveTab(tab.key)}
              />
            ))}
          </div>
        </div>
      </PremiumShellCard>

      {activeTab === "overview" ? (
        <OwnerPaymentsOverviewTab
          locations={locations}
          onOpenGiveOutLoan={() => setActiveTab("give-out-loans")}
          onOpenReceiveLoan={() => setActiveTab("receive-loans")}
          onOpenMovements={() => setActiveTab("movements")}
          onOpenGivenOutLoansTab={() => setActiveTab("give-out-loans")}
          onOpenReceivedLoansTab={() => setActiveTab("receive-loans")}
        />
      ) : null}

      {activeTab === "movements" ? (
        <OwnerPaymentsMovementsTab locations={locations} />
      ) : null}

      {activeTab === "give-out-loans" ? (
        <OwnerPaymentsGivenOutLoansTab locations={locations} />
      ) : null}

      {activeTab === "receive-loans" ? (
        <OwnerPaymentsReceivedLoansTab locations={locations} />
      ) : null}
    </div>
  );
}
