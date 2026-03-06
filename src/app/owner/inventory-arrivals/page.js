"use client";

import { useEffect, useState } from "react";

import Guard from "../../../components/Guard";
import InventoryArrivalsTable from "../../../components/InventoryArrivalsTable";
import { apiFetch } from "../../../lib/api";

export default function OwnerArrivalsPage() {
  return (
    <Guard allowRoles={["owner", "manager", "admin"]}>
      {(me) => <ArrivalsInner me={me} />}
    </Guard>
  );
}

function ArrivalsInner({ me }) {
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setMsg("");
    try {
      const data = await apiFetch("/inventory/arrivals?limit=200", {
        method: "GET",
      });
      const list = data?.arrivals || data?.items || data?.rows || data || [];
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      setRows([]);
      setMsg(e?.data?.error || e.message || "Failed to load arrivals");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="font-semibold text-lg">Inventory Arrivals</div>
      <div className="text-sm text-gray-600 mt-1">
        Location: {me.locationId} • docs open in new tab.
      </div>

      {msg ? (
        <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          {msg}
        </div>
      ) : null}

      <div className="mt-4 flex justify-end">
        <button
          onClick={load}
          className="px-4 py-2 rounded-lg bg-black text-white text-sm"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="mt-4 bg-white rounded-xl shadow overflow-hidden">
        <InventoryArrivalsTable rows={rows} />
      </div>
    </div>
  );
}
