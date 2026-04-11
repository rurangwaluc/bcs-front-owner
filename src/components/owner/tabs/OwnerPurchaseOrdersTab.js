"use client";

import {
  AlertBox,
  EmptyState,
  FormInput,
  FormSelect,
  SectionCard,
  StatCard,
  safe,
  safeDate,
  safeNumber,
} from "../OwnerShared";
import { useEffect, useMemo, useState } from "react";

import AsyncButton from "../../AsyncButton";
import { apiFetch } from "../../../lib/api";

const PAGE_SIZE = 20;

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function normalizeCurrency(v) {
  const s = String(v || "RWF")
    .trim()
    .toUpperCase();
  return s || "RWF";
}

function money(v, currency = "RWF") {
  return `${normalizeCurrency(currency)} ${safeNumber(v).toLocaleString()}`;
}

function normalizePurchaseOrdersResponse(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.purchaseOrders)) return result.purchaseOrders;
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function normalizeSuppliersResponse(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.suppliers)) return result.suppliers;
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function normalizeSupplier(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    name: row.name ?? "",
    defaultCurrency: normalizeCurrency(
      row.defaultCurrency ?? row.default_currency ?? "RWF",
    ),
    isActive: row.isActive ?? row.is_active ?? true,
  };
}

function normalizePO(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    locationId: row.locationId ?? row.location_id ?? null,
    locationName: row.locationName ?? row.location_name ?? "",
    locationCode: row.locationCode ?? row.location_code ?? "",

    supplierId: row.supplierId ?? row.supplier_id ?? null,
    supplierName: row.supplierName ?? row.supplier_name ?? "",

    poNo: row.poNo ?? row.po_no ?? "",
    reference: row.reference ?? "",
    currency: normalizeCurrency(row.currency),

    status: row.status ?? "DRAFT",
    notes: row.notes ?? row.note ?? "",

    orderedAt: row.orderedAt ?? row.ordered_at ?? null,
    expectedAt: row.expectedAt ?? row.expected_at ?? null,
    approvedAt: row.approvedAt ?? row.approved_at ?? null,

    createdByUserId: row.createdByUserId ?? row.created_by_user_id ?? null,
    createdByName: row.createdByName ?? row.created_by_name ?? "",
    createdByEmail: row.createdByEmail ?? row.created_by_email ?? "",

    approvedByUserId: row.approvedByUserId ?? row.approved_by_user_id ?? null,
    approvedByName: row.approvedByName ?? row.approved_by_name ?? "",

    subtotalAmount: Number(row.subtotalAmount ?? row.subtotal_amount ?? 0),
    totalAmount: Number(row.totalAmount ?? row.total_amount ?? 0),

    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,

    itemsCount: Number(row.itemsCount ?? row.items_count ?? 0),
    qtyOrderedTotal: Number(row.qtyOrderedTotal ?? row.qty_ordered_total ?? 0),
    qtyReceivedTotal: Number(
      row.qtyReceivedTotal ?? row.qty_received_total ?? 0,
    ),
  };
}

function normalizePODetail(result) {
  return {
    purchaseOrder: result?.purchaseOrder
      ? normalizePO(result.purchaseOrder)
      : null,
    items: Array.isArray(result?.items)
      ? result.items.map((row) => ({
          id: row.id ?? null,
          purchaseOrderId: row.purchaseOrderId ?? row.purchase_order_id ?? null,
          productId: row.productId ?? row.product_id ?? null,
          productName: row.productName ?? row.product_name ?? "",
          productDisplayName:
            row.productDisplayName ?? row.product_display_name ?? "",
          productSku: row.productSku ?? row.product_sku ?? "",
          stockUnit: row.stockUnit ?? row.stock_unit ?? "PIECE",
          purchaseUnit: row.purchaseUnit ?? row.purchase_unit ?? "PIECE",
          purchaseUnitFactor: Number(
            row.purchaseUnitFactor ?? row.purchase_unit_factor ?? 1,
          ),
          qtyOrdered: Number(row.qtyOrdered ?? row.qty_ordered ?? 0),
          qtyReceived: Number(row.qtyReceived ?? row.qty_received ?? 0),
          unitCost: Number(row.unitCost ?? row.unit_cost ?? 0),
          lineTotal: Number(row.lineTotal ?? row.line_total ?? 0),
          note: row.note ?? "",
          createdAt: row.createdAt ?? row.created_at ?? null,
        }))
      : [],
  };
}

function displayBranch(row, locations = []) {
  if (safe(row?.locationName)) {
    return safe(row?.locationCode)
      ? `${safe(row.locationName)} (${safe(row.locationCode)})`
      : safe(row.locationName);
  }

  const found =
    (Array.isArray(locations) ? locations : []).find(
      (x) => String(x?.id) === String(row?.locationId),
    ) || null;

  if (found) {
    return safe(found?.code)
      ? `${safe(found?.name)} (${safe(found?.code)})`
      : safe(found?.name);
  }

  if (row?.locationId != null) return `Branch #${row.locationId}`;
  return "-";
}

function displayCreatedBy(row) {
  if (safe(row?.createdByName)) return safe(row.createdByName);
  if (safe(row?.createdByEmail)) return safe(row.createdByEmail);
  if (row?.createdByUserId != null)
    return `User #${safeNumber(row.createdByUserId)}`;
  return "-";
}

function displayApprovedBy(row) {
  if (safe(row?.approvedByName)) return safe(row.approvedByName);
  if (row?.approvedByUserId != null)
    return `User #${safeNumber(row.approvedByUserId)}`;
  return "-";
}

function statusTone(status) {
  const s = safe(status).toUpperCase();

  if (s === "RECEIVED") return "success";
  if (s === "PARTIALLY_RECEIVED") return "warn";
  if (s === "APPROVED") return "info";
  if (s === "CANCELLED") return "danger";
  if (s === "DRAFT") return "neutral";
  return "neutral";
}

function StatusPill({ status }) {
  const s = safe(status).toUpperCase() || "DRAFT";

  const cls =
    s === "RECEIVED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
      : s === "PARTIALLY_RECEIVED"
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300"
        : s === "APPROVED"
          ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300"
          : s === "CANCELLED"
            ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300"
            : "border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em]",
        cls,
      )}
    >
      {s.replaceAll("_", " ")}
    </span>
  );
}

function Surface({ children, className = "" }) {
  return (
    <div
      className={cx(
        "rounded-[24px] border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900",
        className,
      )}
    >
      {children}
    </div>
  );
}

function InfoTile({ label, value, sub = "" }) {
  return (
    <div className="rounded-[20px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
      <div className="text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
        {label}
      </div>
      <div className="mt-2 break-words text-sm font-semibold text-stone-950 dark:text-stone-50">
        {value || "-"}
      </div>
      {sub ? (
        <div className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function OrderCard({ row, active, onSelect, locations = [] }) {
  const remainingQty = Math.max(
    0,
    safeNumber(row?.qtyOrderedTotal) - safeNumber(row?.qtyReceivedTotal),
  );

  return (
    <button
      type="button"
      onClick={() => onSelect?.(row)}
      className={cx(
        "w-full rounded-[24px] border p-4 text-left transition",
        active
          ? "border-stone-400 bg-stone-50 dark:border-stone-700 dark:bg-stone-950"
          : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700 dark:hover:bg-stone-950",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-sm font-black text-stone-950 dark:text-stone-50">
              {safe(row?.poNo) || `PO #${safeNumber(row?.id)}`}
            </div>
            <StatusPill status={row?.status} />
            <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
              {normalizeCurrency(row?.currency)}
            </span>
          </div>

          <div className="mt-2 text-xs text-stone-500 dark:text-stone-400">
            Supplier:{" "}
            <b className="text-stone-900 dark:text-stone-100">
              {safe(row?.supplierName) || "-"}
            </b>{" "}
            • Branch:{" "}
            <b className="text-stone-900 dark:text-stone-100">
              {displayBranch(row, locations)}
            </b>
          </div>

          <div className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            Ordered:{" "}
            <b className="text-stone-900 dark:text-stone-100">
              {safeDate(row?.orderedAt)}
            </b>{" "}
            • Expected:{" "}
            <b className="text-stone-900 dark:text-stone-100">
              {safeDate(row?.expectedAt)}
            </b>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Total
          </div>
          <div className="mt-1 text-lg font-black text-stone-950 dark:text-stone-50">
            {money(row?.totalAmount, row?.currency)}
          </div>
          <div className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
            {safeNumber(row?.itemsCount)} line
            {safeNumber(row?.itemsCount) === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-[18px] border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <div className="text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Ordered qty
          </div>
          <div className="mt-2 text-sm font-bold text-stone-950 dark:text-stone-50">
            {safeNumber(row?.qtyOrderedTotal)}
          </div>
        </div>

        <div className="rounded-[18px] border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <div className="text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Received qty
          </div>
          <div className="mt-2 text-sm font-bold text-stone-950 dark:text-stone-50">
            {safeNumber(row?.qtyReceivedTotal)}
          </div>
        </div>

        <div className="rounded-[18px] border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="text-[11px] font-black uppercase tracking-[0.12em] text-amber-700 dark:text-amber-300">
            Remaining qty
          </div>
          <div className="mt-2 text-sm font-bold text-amber-700 dark:text-amber-300">
            {remainingQty}
          </div>
        </div>
      </div>
    </button>
  );
}

function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-950/50 p-4 backdrop-blur-[2px]">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[30px] border border-stone-200 bg-white shadow-[0_30px_80px_rgba(2,6,23,0.22)] dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 p-5 dark:border-stone-800">
          <div>
            <h3 className="text-xl font-black text-stone-950 dark:text-stone-50">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                {subtitle}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 text-stone-600 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            ×
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function emptyLine() {
  return {
    productId: "",
    productName: "",
    qtyOrdered: "1",
    unitCost: "",
    note: "",
  };
}

function buildPOCreateDefaults(suppliers) {
  const firstSupplier = Array.isArray(suppliers) ? suppliers[0] : null;

  return {
    locationId: "",
    supplierId: firstSupplier?.id ? String(firstSupplier.id) : "",
    poNo: "",
    reference: "",
    currency: normalizeCurrency(firstSupplier?.defaultCurrency || "RWF"),
    orderedAt: "",
    expectedAt: "",
    notes: "",
    items: [emptyLine()],
  };
}

function buildPOEditDefaults(po, items) {
  return {
    locationId: String(po?.locationId || ""),
    supplierId: String(po?.supplierId || ""),
    poNo: safe(po?.poNo),
    reference: safe(po?.reference),
    currency: normalizeCurrency(po?.currency || "RWF"),
    orderedAt: po?.orderedAt ? String(po.orderedAt).slice(0, 10) : "",
    expectedAt: po?.expectedAt ? String(po.expectedAt).slice(0, 10) : "",
    notes: safe(po?.notes),
    items:
      Array.isArray(items) && items.length > 0
        ? items.map((item) => ({
            productId: item?.productId != null ? String(item.productId) : "",
            productName: safe(item?.productName || item?.productDisplayName),
            qtyOrdered: String(safeNumber(item?.qtyOrdered) || 1),
            unitCost: String(safeNumber(item?.unitCost) || ""),
            note: safe(item?.note),
          }))
        : [emptyLine()],
  };
}

function POLineEditor({
  line,
  index,
  onChange,
  onRemove,
  disableRemove = false,
}) {
  return (
    <div className="rounded-[22px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-black text-stone-950 dark:text-stone-50">
          Order line {index + 1}
        </div>

        <button
          type="button"
          onClick={onRemove}
          disabled={disableRemove}
          className="rounded-[16px] border border-stone-300 px-3 py-2 text-xs font-bold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          Remove
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <FormInput
          value={line.productId}
          onChange={(e) => onChange(index, "productId", e.target.value)}
          placeholder="Product ID (optional)"
          type="number"
        />

        <FormInput
          value={line.productName}
          onChange={(e) => onChange(index, "productName", e.target.value)}
          placeholder="Product name if no ID"
        />

        <FormInput
          value={line.qtyOrdered}
          onChange={(e) => onChange(index, "qtyOrdered", e.target.value)}
          placeholder="Qty"
          type="number"
        />

        <FormInput
          value={line.unitCost}
          onChange={(e) => onChange(index, "unitCost", e.target.value)}
          placeholder="Unit cost"
          type="number"
        />

        <FormInput
          value={line.note}
          onChange={(e) => onChange(index, "note", e.target.value)}
          placeholder="Line note"
        />
      </div>
    </div>
  );
}

function PurchaseOrderFormModal({
  open,
  mode = "create",
  suppliers = [],
  locations = [],
  initialPO = null,
  initialItems = [],
  onClose,
  onSaved,
}) {
  if (!open) return null;

  return (
    <PurchaseOrderFormModalInner
      key={
        mode === "edit" && initialPO?.id
          ? `edit-po-${initialPO.id}-${initialPO.updatedAt || ""}`
          : `create-po-${suppliers.length}-${locations.length}`
      }
      mode={mode}
      suppliers={suppliers}
      locations={locations}
      initialPO={initialPO}
      initialItems={initialItems}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function PurchaseOrderFormModalInner({
  mode,
  suppliers,
  locations,
  initialPO,
  initialItems,
  onClose,
  onSaved,
}) {
  const isEdit = mode === "edit";

  const [form, setForm] = useState(() =>
    isEdit
      ? buildPOEditDefaults(initialPO, initialItems)
      : buildPOCreateDefaults(suppliers),
  );
  const [errorText, setErrorText] = useState("");

  const selectedSupplier = useMemo(
    () =>
      (Array.isArray(suppliers) ? suppliers : []).find(
        (row) => String(row.id) === String(form.supplierId),
      ) || null,
    [suppliers, form.supplierId],
  );

  const effectiveCurrency = selectedSupplier?.defaultCurrency
    ? normalizeCurrency(selectedSupplier.defaultCurrency)
    : normalizeCurrency(form.currency);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function changeLine(index, key, value) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((line, i) =>
        i === index ? { ...line, [key]: value } : line,
      ),
    }));
  }

  function addLine() {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, emptyLine()],
    }));
  }

  function removeLine(index) {
    setForm((prev) => ({
      ...prev,
      items:
        prev.items.length <= 1
          ? prev.items
          : prev.items.filter((_, i) => i !== index),
    }));
  }

  async function handleSave() {
    setErrorText("");

    try {
      const payload = {
        locationId: Number(form.locationId),
        supplierId: Number(form.supplierId),
        poNo: safe(form.poNo) || undefined,
        reference: safe(form.reference) || undefined,
        currency: effectiveCurrency || undefined,
        orderedAt: form.orderedAt || undefined,
        expectedAt: form.expectedAt || undefined,
        notes: safe(form.notes) || undefined,
        items: (Array.isArray(form.items) ? form.items : []).map((line) => {
          const out = {
            qtyOrdered: Number(line.qtyOrdered),
            unitCost: Number(line.unitCost || 0),
            note: safe(line.note) || undefined,
          };

          if (safe(line.productId)) {
            out.productId = Number(line.productId);
          }

          if (safe(line.productName)) {
            out.productName = safe(line.productName);
          }

          return out;
        }),
      };

      const result = await apiFetch(
        isEdit ? `/purchase-orders/${initialPO.id}` : `/purchase-orders`,
        {
          method: isEdit ? "PATCH" : "POST",
          body: payload,
        },
      );

      onSaved?.(result);
    } catch (e) {
      setErrorText(
        e?.data?.error ||
          e?.message ||
          (isEdit
            ? "Failed to update purchase order"
            : "Failed to create purchase order"),
      );
    }
  }

  return (
    <ModalShell
      title={
        isEdit
          ? `Edit purchase order #${initialPO?.id}`
          : "Create purchase order"
      }
      subtitle={
        isEdit
          ? "Update supplier, branch, document details, and order lines."
          : "Create a supplier order before goods arrive."
      }
      onClose={onClose}
    >
      <AlertBox message={errorText} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Supplier
          </label>
          <FormSelect
            value={form.supplierId}
            onChange={(e) => setField("supplierId", e.target.value)}
          >
            <option value="">Choose supplier</option>
            {suppliers.map((row) => (
              <option key={row.id} value={row.id}>
                {safe(row.name)}
              </option>
            ))}
          </FormSelect>
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Branch
          </label>
          <FormSelect
            value={form.locationId}
            onChange={(e) => setField("locationId", e.target.value)}
          >
            <option value="">Choose branch</option>
            {locations.map((row) => (
              <option key={row.id} value={row.id}>
                {safe(row.name)} {safe(row.code) ? `(${safe(row.code)})` : ""}
              </option>
            ))}
          </FormSelect>
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Purchase order number
          </label>
          <FormInput
            value={form.poNo}
            onChange={(e) => setField("poNo", e.target.value)}
            placeholder="Example: PO-2026-001"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Reference
          </label>
          <FormInput
            value={form.reference}
            onChange={(e) => setField("reference", e.target.value)}
            placeholder="Supplier quote or internal reference"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Currency
          </label>
          <FormSelect
            value={effectiveCurrency}
            onChange={(e) => setField("currency", e.target.value)}
            disabled={!!selectedSupplier?.defaultCurrency}
          >
            <option value="RWF">RWF</option>
            <option value="USD">USD</option>
          </FormSelect>
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Ordered date
          </label>
          <FormInput
            type="date"
            value={form.orderedAt}
            onChange={(e) => setField("orderedAt", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Expected arrival date
          </label>
          <FormInput
            type="date"
            value={form.expectedAt}
            onChange={(e) => setField("expectedAt", e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Order note
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
            rows={4}
            className="w-full rounded-[18px] border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
            placeholder="Why this order is being made, special terms, delivery instructions, or internal note"
          />
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-sm font-black text-stone-950 dark:text-stone-50">
            Order lines
          </div>

          <button
            type="button"
            onClick={addLine}
            className="rounded-[18px] border border-stone-300 px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            Add line
          </button>
        </div>

        <div className="space-y-3">
          {(Array.isArray(form.items) ? form.items : []).map((line, index) => (
            <POLineEditor
              key={`line-${index}`}
              line={line}
              index={index}
              onChange={changeLine}
              onRemove={() => removeLine(index)}
              disableRemove={(form.items || []).length <= 1}
            />
          ))}
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-[18px] border border-stone-300 px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          Cancel
        </button>

        <AsyncButton
          idleText={isEdit ? "Save purchase order" : "Create purchase order"}
          loadingText={isEdit ? "Saving..." : "Creating..."}
          successText={isEdit ? "Saved" : "Created"}
          onClick={handleSave}
        />
      </div>
    </ModalShell>
  );
}

function ApprovePOModal({ open, po, onClose, onSaved }) {
  if (!open || !po) return null;

  return (
    <ModalShell
      title={`Approve purchase order #${po.id}`}
      subtitle="This confirms the order is ready to be sent or acted on."
      onClose={onClose}
    >
      <Surface className="bg-sky-50 dark:bg-sky-950/20">
        <div className="text-sm text-sky-800 dark:text-sky-200">
          Supplier: <strong>{safe(po?.supplierName) || "-"}</strong>
          <br />
          Total: <strong>{money(po?.totalAmount, po?.currency)}</strong>
          <br />
          Status now: <strong>{safe(po?.status) || "DRAFT"}</strong>
        </div>
      </Surface>

      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-[18px] border border-stone-300 px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          Cancel
        </button>

        <AsyncButton
          idleText="Approve purchase order"
          loadingText="Approving..."
          successText="Approved"
          onClick={async () => {
            const result = await apiFetch(`/purchase-orders/${po.id}/approve`, {
              method: "POST",
              body: {},
            });
            onSaved?.(result);
          }}
        />
      </div>
    </ModalShell>
  );
}

function CancelPOModal({ open, po, onClose, onSaved }) {
  if (!open || !po) return null;

  return <CancelPOModalInner po={po} onClose={onClose} onSaved={onSaved} />;
}

function CancelPOModalInner({ po, onClose, onSaved }) {
  const [reason, setReason] = useState("");
  const [errorText, setErrorText] = useState("");

  async function handleCancel() {
    setErrorText("");

    try {
      const result = await apiFetch(`/purchase-orders/${po.id}/cancel`, {
        method: "POST",
        body: {
          reason: safe(reason) || undefined,
        },
      });

      onSaved?.(result);
    } catch (e) {
      setErrorText(
        e?.data?.error || e?.message || "Failed to cancel purchase order",
      );
    }
  }

  return (
    <ModalShell
      title={`Cancel purchase order #${po.id}`}
      subtitle="Only cancel when this order should no longer count."
      onClose={onClose}
    >
      <AlertBox message={errorText} />

      <Surface className="bg-rose-50 dark:bg-rose-950/20">
        <div className="text-sm text-rose-800 dark:text-rose-200">
          Supplier: <strong>{safe(po?.supplierName) || "-"}</strong>
          <br />
          Total: <strong>{money(po?.totalAmount, po?.currency)}</strong>
          <br />
          Current status: <strong>{safe(po?.status) || "-"}</strong>
        </div>
      </Surface>

      <div className="mt-4">
        <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
          Reason
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="w-full rounded-[18px] border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
          placeholder="Why is this order being cancelled?"
        />
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-[18px] border border-stone-300 px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          Back
        </button>

        <AsyncButton
          idleText="Cancel purchase order"
          loadingText="Cancelling..."
          successText="Cancelled"
          onClick={handleCancel}
          variant="secondary"
        />
      </div>
    </ModalShell>
  );
}

function PrintablePO({ po, items, locations = [] }) {
  if (!po) return null;

  return (
    <div id="owner-po-print-area" className="bg-white p-6 text-black">
      <div className="border-b border-stone-300 pb-4">
        <div className="text-2xl font-black">PURCHASE ORDER</div>
        <div className="mt-2 text-sm">
          {safe(po?.poNo)
            ? `PO Number: ${safe(po.poNo)}`
            : `PO #${safeNumber(po?.id)}`}
        </div>
        <div className="text-sm">Status: {safe(po?.status) || "-"}</div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-6 text-sm">
        <div>
          <div className="font-bold">Supplier</div>
          <div className="mt-1">{safe(po?.supplierName) || "-"}</div>
        </div>

        <div>
          <div className="font-bold">Branch</div>
          <div className="mt-1">{displayBranch(po, locations)}</div>
        </div>

        <div>
          <div className="font-bold">Ordered date</div>
          <div className="mt-1">{safeDate(po?.orderedAt)}</div>
        </div>

        <div>
          <div className="font-bold">Expected date</div>
          <div className="mt-1">{safeDate(po?.expectedAt)}</div>
        </div>

        <div>
          <div className="font-bold">Reference</div>
          <div className="mt-1">{safe(po?.reference) || "-"}</div>
        </div>

        <div>
          <div className="font-bold">Created by</div>
          <div className="mt-1">{displayCreatedBy(po)}</div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-stone-300">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-stone-100">
            <tr>
              <th className="border-b border-stone-300 px-3 py-2 text-left">
                Item
              </th>
              <th className="border-b border-stone-300 px-3 py-2 text-left">
                SKU
              </th>
              <th className="border-b border-stone-300 px-3 py-2 text-right">
                Qty
              </th>
              <th className="border-b border-stone-300 px-3 py-2 text-right">
                Unit cost
              </th>
              <th className="border-b border-stone-300 px-3 py-2 text-right">
                Line total
              </th>
            </tr>
          </thead>
          <tbody>
            {(Array.isArray(items) ? items : []).map((item) => (
              <tr key={item?.id ?? `${item?.productId}-${item?.productName}`}>
                <td className="border-b border-stone-200 px-3 py-2">
                  {safe(item?.productDisplayName || item?.productName) || "-"}
                </td>
                <td className="border-b border-stone-200 px-3 py-2">
                  {safe(item?.productSku) || "-"}
                </td>
                <td className="border-b border-stone-200 px-3 py-2 text-right">
                  {safeNumber(item?.qtyOrdered)}
                </td>
                <td className="border-b border-stone-200 px-3 py-2 text-right">
                  {money(item?.unitCost, po?.currency)}
                </td>
                <td className="border-b border-stone-200 px-3 py-2 text-right">
                  {money(item?.lineTotal, po?.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <div className="w-full max-w-sm space-y-2 rounded-xl border border-stone-300 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <strong>{money(po?.subtotalAmount, po?.currency)}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span>Total</span>
            <strong>{money(po?.totalAmount, po?.currency)}</strong>
          </div>
        </div>
      </div>

      <div className="mt-6 text-sm">
        <div className="font-bold">Notes</div>
        <div className="mt-1 whitespace-pre-wrap">
          {safe(po?.notes) || "No notes recorded."}
        </div>
      </div>
    </div>
  );
}

export default function OwnerPurchaseOrdersTab({ locations = [] }) {
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [selectedPOId, setSelectedPOId] = useState("");
  const [poDetail, setPODetail] = useState({
    purchaseOrder: null,
    items: [],
  });

  const [q, setQ] = useState("");
  const [locationId, setLocationId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [status, setStatus] = useState("");

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [creatingPO, setCreatingPO] = useState(false);
  const [editingPO, setEditingPO] = useState(null);
  const [approvingPO, setApprovingPO] = useState(null);
  const [cancellingPO, setCancellingPO] = useState(null);

  const selectedPO = !selectedPOId
    ? null
    : purchaseOrders.find((row) => String(row.id) === String(selectedPOId)) ||
      null;

  const detailPO = poDetail?.purchaseOrder || selectedPO || null;

  const locationOptions = useMemo(() => {
    return Array.isArray(locations)
      ? locations.filter(
          (row) => safe(row?.status).toUpperCase() !== "ARCHIVED",
        )
      : [];
  }, [locations]);

  const overview = useMemo(() => {
    const rows = Array.isArray(purchaseOrders) ? purchaseOrders : [];

    const totalCount = rows.length;
    const totalAmount = rows.reduce(
      (sum, row) => sum + safeNumber(row?.totalAmount),
      0,
    );
    const approvedCount = rows.filter(
      (row) => safe(row?.status).toUpperCase() === "APPROVED",
    ).length;
    const receivedCount = rows.filter((row) =>
      ["RECEIVED", "PARTIALLY_RECEIVED"].includes(
        safe(row?.status).toUpperCase(),
      ),
    ).length;
    const draftCount = rows.filter(
      (row) => safe(row?.status).toUpperCase() === "DRAFT",
    ).length;
    const cancelledCount = rows.filter(
      (row) => safe(row?.status).toUpperCase() === "CANCELLED",
    ).length;
    const qtyOrdered = rows.reduce(
      (sum, row) => sum + safeNumber(row?.qtyOrderedTotal),
      0,
    );
    const qtyReceived = rows.reduce(
      (sum, row) => sum + safeNumber(row?.qtyReceivedTotal),
      0,
    );

    return {
      totalCount,
      totalAmount,
      approvedCount,
      receivedCount,
      draftCount,
      cancelledCount,
      qtyOrdered,
      qtyReceived,
    };
  }, [purchaseOrders]);

  async function loadSupplierOptions() {
    try {
      const result = await apiFetch(`/owner/suppliers?limit=200`, {
        method: "GET",
      });

      setSupplierOptions(
        normalizeSuppliersResponse(result)
          .map(normalizeSupplier)
          .filter(Boolean),
      );
    } catch {
      setSupplierOptions([]);
    }
  }

  async function loadList() {
    setLoading(true);
    setErrorText("");

    try {
      const params = new URLSearchParams();
      params.set("limit", String(200));
      if (safe(q)) params.set("q", safe(q));
      if (safe(locationId)) params.set("locationId", safe(locationId));
      if (safe(supplierId)) params.set("supplierId", safe(supplierId));
      if (safe(status)) params.set("status", safe(status).toUpperCase());

      const result = await apiFetch(`/purchase-orders?${params.toString()}`, {
        method: "GET",
      });

      const rows = normalizePurchaseOrdersResponse(result)
        .map(normalizePO)
        .filter(Boolean);

      setPurchaseOrders(rows);
      setSelectedPOId((prev) =>
        prev && rows.some((x) => String(x.id) === String(prev))
          ? String(prev)
          : rows[0]?.id != null
            ? String(rows[0].id)
            : "",
      );
    } catch (e) {
      setPurchaseOrders([]);
      setSelectedPOId("");
      setErrorText(
        e?.data?.error || e?.message || "Failed to load purchase orders",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id) {
    if (!id) {
      setPODetail({ purchaseOrder: null, items: [] });
      return;
    }

    setDetailLoading(true);

    try {
      const result = await apiFetch(`/purchase-orders/${id}`, {
        method: "GET",
      });

      setPODetail(normalizePODetail(result));
    } catch {
      setPODetail({ purchaseOrder: null, items: [] });
    } finally {
      setDetailLoading(false);
    }
  }

  async function reloadAll() {
    await Promise.all([loadList(), loadSupplierOptions()]);
  }

  async function handleActionSaved(actionText, result) {
    const nextId =
      result?.purchaseOrder?.id ?? result?.id ?? selectedPOId ?? "";

    setCreatingPO(false);
    setEditingPO(null);
    setApprovingPO(null);
    setCancellingPO(null);

    setSuccessText(actionText);
    await loadList();

    if (nextId) {
      setSelectedPOId(String(nextId));
      await loadDetail(String(nextId));
    }

    setTimeout(() => setSuccessText(""), 2500);
  }

  useEffect(() => {
    loadSupplierOptions();
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [q, locationId, supplierId, status]);

  useEffect(() => {
    loadList();
  }, [q, locationId, supplierId, status]);

  useEffect(() => {
    loadDetail(selectedPOId);
  }, [selectedPOId]);

  const visibleRows = purchaseOrders.slice(0, visibleCount);

  const canApprove =
    detailPO && safe(detailPO?.status).toUpperCase() === "DRAFT";

  const canEdit =
    detailPO &&
    ["DRAFT", "APPROVED"].includes(safe(detailPO?.status).toUpperCase());

  const canCancel =
    detailPO &&
    !["RECEIVED", "CANCELLED"].includes(safe(detailPO?.status).toUpperCase());

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #owner-po-print-area,
          #owner-po-print-area * {
            visibility: visible;
          }
          #owner-po-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      <AlertBox message={errorText} />
      <AlertBox message={successText} tone="success" />

      {loading ? (
        <SectionCard
          title="Purchase orders"
          subtitle="Loading owner-wide supplier order visibility."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-3xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-800"
              />
            ))}
          </div>
        </SectionCard>
      ) : (
        <>
          <SectionCard
            title="Purchase order overview"
            subtitle="Owner-wide view of supplier orders, incoming quantity, and branch procurement readiness."
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <StatCard
                label="Orders"
                value={safeNumber(overview?.totalCount)}
                sub="Loaded purchase orders"
                valueClassName="text-[17px] leading-tight"
              />
              <StatCard
                label="Total ordered"
                value={money(overview?.totalAmount, "RWF")}
                sub="Loaded order value"
                valueClassName="text-[17px] leading-tight"
              />
              <StatCard
                label="Draft"
                value={safeNumber(overview?.draftCount)}
                sub="Not yet approved"
                valueClassName="text-[17px] leading-tight"
              />
              <StatCard
                label="Approved"
                value={safeNumber(overview?.approvedCount)}
                sub="Ready to action"
                valueClassName="text-[17px] leading-tight"
              />
              <StatCard
                label="Received"
                value={safeNumber(overview?.receivedCount)}
                sub="With goods received"
                valueClassName="text-[17px] leading-tight"
              />
              <StatCard
                label="Cancelled"
                value={safeNumber(overview?.cancelledCount)}
                sub="No longer active"
                valueClassName="text-[17px] leading-tight"
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
              <StatCard
                label="Qty ordered"
                value={safeNumber(overview?.qtyOrdered)}
                sub="Across loaded orders"
                valueClassName="text-[17px] leading-tight"
              />
              <StatCard
                label="Qty received"
                value={safeNumber(overview?.qtyReceived)}
                sub="Already received"
                valueClassName="text-[17px] leading-tight"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Purchase order controls"
            subtitle="Filter orders, refresh the list, and create a new supplier order."
            right={
              <div className="flex flex-wrap items-center gap-2">
                <AsyncButton
                  variant="secondary"
                  state={loading || detailLoading ? "loading" : "idle"}
                  idleText="Reload"
                  loadingText="Loading..."
                  successText="Done"
                  onClick={reloadAll}
                />
                <AsyncButton
                  idleText="Create purchase order"
                  loadingText="Opening..."
                  successText="Ready"
                  onClick={async () => setCreatingPO(true)}
                />
              </div>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <FormInput
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search PO number, supplier, branch, reference"
              />

              <FormSelect
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
              >
                <option value="">All branches</option>
                {locationOptions.map((row) => (
                  <option key={row.id} value={row.id}>
                    {safe(row.name)}{" "}
                    {safe(row.code) ? `(${safe(row.code)})` : ""}
                  </option>
                ))}
              </FormSelect>

              <FormSelect
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              >
                <option value="">All suppliers</option>
                {supplierOptions.map((row) => (
                  <option key={row.id} value={row.id}>
                    {safe(row.name)}
                  </option>
                ))}
              </FormSelect>

              <FormSelect
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="APPROVED">Approved</option>
                <option value="PARTIALLY_RECEIVED">Partially received</option>
                <option value="RECEIVED">Received</option>
                <option value="CANCELLED">Cancelled</option>
              </FormSelect>
            </div>
          </SectionCard>

          <div className="grid gap-6 2xl:grid-cols-[1.08fr_0.92fr]">
            <SectionCard
              title="Purchase order directory"
              subtitle="Select an order to inspect its supplier, branch, line items, and receiving progress."
            >
              {purchaseOrders.length === 0 ? (
                <EmptyState text="No purchase orders match the current filters." />
              ) : (
                <div className="space-y-4">
                  {visibleRows.map((row) => (
                    <OrderCard
                      key={row.id}
                      row={row}
                      active={String(row.id) === String(selectedPOId)}
                      onSelect={(picked) =>
                        setSelectedPOId(String(picked?.id || ""))
                      }
                      locations={locationOptions}
                    />
                  ))}
                </div>
              )}

              {visibleCount < purchaseOrders.length ? (
                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                  >
                    Load 20 more
                  </button>
                </div>
              ) : null}
            </SectionCard>

            {detailPO ? (
              <SectionCard
                title="Selected purchase order"
                subtitle="Focused owner view of supplier order detail, receiving progress, and printable document."
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={detailPO?.status} />
                    <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
                      {normalizeCurrency(detailPO?.currency)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="rounded-[18px] border border-stone-300 px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
                    >
                      Print PO
                    </button>

                    {canEdit ? (
                      <AsyncButton
                        idleText="Edit order"
                        loadingText="Opening..."
                        successText="Ready"
                        onClick={async () => setEditingPO(detailPO)}
                        variant="secondary"
                      />
                    ) : null}

                    {canApprove ? (
                      <AsyncButton
                        idleText="Approve order"
                        loadingText="Opening..."
                        successText="Ready"
                        onClick={async () => setApprovingPO(detailPO)}
                        variant="secondary"
                      />
                    ) : null}

                    {canCancel ? (
                      <AsyncButton
                        idleText="Cancel order"
                        loadingText="Opening..."
                        successText="Ready"
                        onClick={async () => setCancellingPO(detailPO)}
                        variant="secondary"
                      />
                    ) : null}
                  </div>
                </div>

                {detailLoading ? (
                  <div className="mt-4 grid gap-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-24 animate-pulse rounded-[22px] bg-stone-100 dark:bg-stone-800"
                      />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <StatCard
                        label="Order"
                        value={
                          safe(detailPO?.poNo) || `#${safeNumber(detailPO?.id)}`
                        }
                        sub={safeDate(detailPO?.createdAt)}
                        valueClassName="text-[17px] leading-tight"
                      />

                      <StatCard
                        label="Supplier"
                        value={safe(detailPO?.supplierName) || "-"}
                        sub={displayCreatedBy(detailPO)}
                        valueClassName="text-[17px] leading-tight"
                      />

                      <StatCard
                        label="Branch"
                        value={displayBranch(detailPO, locationOptions)}
                        sub={safe(detailPO?.locationCode) || "No code"}
                        valueClassName="text-[17px] leading-tight"
                      />

                      <StatCard
                        label="Total"
                        value={money(detailPO?.totalAmount, detailPO?.currency)}
                        sub={`${safeNumber(detailPO?.itemsCount)} line${safeNumber(detailPO?.itemsCount) === 1 ? "" : "s"}`}
                        valueClassName="text-[17px] leading-tight"
                      />
                    </div>

                    <div className="mt-5 grid gap-4 xl:grid-cols-2">
                      <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                          Order profile
                        </p>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <InfoTile
                            label="Ordered date"
                            value={safeDate(detailPO?.orderedAt)}
                          />
                          <InfoTile
                            label="Expected date"
                            value={safeDate(detailPO?.expectedAt)}
                          />
                          <InfoTile
                            label="Created by"
                            value={displayCreatedBy(detailPO)}
                          />
                          <InfoTile
                            label="Approved by"
                            value={displayApprovedBy(detailPO)}
                            sub={
                              detailPO?.approvedAt
                                ? safeDate(detailPO?.approvedAt)
                                : ""
                            }
                          />
                          <InfoTile
                            label="Reference"
                            value={safe(detailPO?.reference) || "-"}
                          />
                          <InfoTile
                            label="Last updated"
                            value={safeDate(detailPO?.updatedAt)}
                          />
                        </div>

                        <div className="mt-3">
                          <InfoTile
                            label="Order note"
                            value={
                              safe(detailPO?.notes) || "No order note recorded"
                            }
                          />
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                          Receiving progress
                        </p>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <InfoTile
                            label="Qty ordered"
                            value={safeNumber(detailPO?.qtyOrderedTotal)}
                          />
                          <InfoTile
                            label="Qty received"
                            value={safeNumber(detailPO?.qtyReceivedTotal)}
                          />
                          <InfoTile
                            label="Remaining qty"
                            value={Math.max(
                              0,
                              safeNumber(detailPO?.qtyOrderedTotal) -
                                safeNumber(detailPO?.qtyReceivedTotal),
                            )}
                          />
                          <InfoTile
                            label="Status"
                            value={
                              safe(detailPO?.status)?.replaceAll("_", " ") ||
                              "-"
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                        Order lines
                      </div>

                      {(poDetail?.items || []).length === 0 ? (
                        <EmptyState text="No purchase order items found." />
                      ) : (
                        <div className="space-y-3">
                          {(poDetail?.items || []).map((item) => (
                            <div
                              key={item.id}
                              className="rounded-[22px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-black text-stone-950 dark:text-stone-50">
                                    {safe(
                                      item?.productDisplayName ||
                                        item?.productName,
                                    ) || "-"}
                                  </div>

                                  <div className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                                    SKU:{" "}
                                    <b className="text-stone-900 dark:text-stone-100">
                                      {safe(item?.productSku) || "-"}
                                    </b>
                                    {" • "}
                                    Product ID:{" "}
                                    <b className="text-stone-900 dark:text-stone-100">
                                      {item?.productId != null
                                        ? safeNumber(item?.productId)
                                        : "-"}
                                    </b>
                                  </div>

                                  {safe(item?.note) ? (
                                    <div className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                                      Note:{" "}
                                      <b className="text-stone-900 dark:text-stone-100">
                                        {safe(item.note)}
                                      </b>
                                    </div>
                                  ) : null}
                                </div>

                                <div className="shrink-0 text-right">
                                  <div className="text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                    Line total
                                  </div>
                                  <div className="mt-1 text-lg font-black text-stone-950 dark:text-stone-50">
                                    {money(item?.lineTotal, detailPO?.currency)}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
                                <InfoTile
                                  label="Qty ordered"
                                  value={safeNumber(item?.qtyOrdered)}
                                />
                                <InfoTile
                                  label="Qty received"
                                  value={safeNumber(item?.qtyReceived)}
                                />
                                <InfoTile
                                  label="Unit cost"
                                  value={money(
                                    item?.unitCost,
                                    detailPO?.currency,
                                  )}
                                />
                                <InfoTile
                                  label="Purchase unit"
                                  value={safe(item?.purchaseUnit) || "PIECE"}
                                  sub={`Stock unit: ${safe(item?.stockUnit) || "PIECE"}`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 hidden">
                      <PrintablePO
                        po={detailPO}
                        items={poDetail?.items || []}
                        locations={locationOptions}
                      />
                    </div>
                  </>
                )}
              </SectionCard>
            ) : (
              <SectionCard
                title="Selected purchase order"
                subtitle="This section appears after a purchase order is selected."
              >
                <EmptyState text="Select a purchase order to inspect details and print the document." />
              </SectionCard>
            )}
          </div>
        </>
      )}

      <PurchaseOrderFormModal
        open={creatingPO}
        mode="create"
        suppliers={supplierOptions}
        locations={locationOptions}
        onClose={() => setCreatingPO(false)}
        onSaved={(result) =>
          handleActionSaved("Purchase order created", result)
        }
      />

      <PurchaseOrderFormModal
        open={!!editingPO}
        mode="edit"
        suppliers={supplierOptions}
        locations={locationOptions}
        initialPO={editingPO}
        initialItems={poDetail?.items || []}
        onClose={() => setEditingPO(null)}
        onSaved={(result) =>
          handleActionSaved("Purchase order updated", result)
        }
      />

      <ApprovePOModal
        open={!!approvingPO}
        po={approvingPO}
        onClose={() => setApprovingPO(null)}
        onSaved={(result) =>
          handleActionSaved("Purchase order approved", result)
        }
      />

      <CancelPOModal
        open={!!cancellingPO}
        po={cancellingPO}
        onClose={() => setCancellingPO(null)}
        onSaved={(result) =>
          handleActionSaved("Purchase order cancelled", result)
        }
      />
    </div>
  );
}
