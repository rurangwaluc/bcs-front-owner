"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../lib/api";
import AsyncButton from "../../AsyncButton";
import {
  AlertBox,
  EmptyState,
  FieldLabel,
  FormInput,
  FormSelect,
  FormTextarea,
  OverlayModal,
  SectionCard,
  StatCard,
  safe,
  safeDate,
  safeNumber,
} from "../OwnerShared";

const PRODUCT_STATUS_FILTERS = [
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "ARCHIVED", label: "Archived" },
];

const PAGE_SIZE = 20;

function money(v) {
  return safeNumber(v).toLocaleString();
}

function productStatusTone(isActive) {
  return isActive
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
    : "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
}

function ProductListRow({ row, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(row)}
      className={
        "hidden w-full grid-cols-[minmax(220px,2fr)_120px_160px_120px_120px_90px_110px] items-center gap-3 border-b border-stone-200 px-4 py-3 text-left transition last:border-b-0 lg:grid " +
        (active
          ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950"
          : "bg-white hover:bg-stone-50 dark:bg-stone-900 dark:hover:bg-stone-800/70")
      }
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{safe(row?.name) || "-"}</p>
        <p
          className={
            "mt-1 truncate text-xs " +
            (active
              ? "text-stone-300 dark:text-stone-600"
              : "text-stone-500 dark:text-stone-400")
          }
        >
          Unit: {safe(row?.unit) || "-"}
        </p>
      </div>

      <div className="truncate text-sm font-medium">
        {safe(row?.sku) || "-"}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {safe(row?.locationName) || "-"}
        </p>
        <p
          className={
            "mt-1 truncate text-xs " +
            (active
              ? "text-stone-300 dark:text-stone-600"
              : "text-stone-500 dark:text-stone-400")
          }
        >
          {safe(row?.locationCode) || "-"}
        </p>
      </div>

      <div className="text-sm font-semibold">{money(row?.sellingPrice)}</div>
      <div className="text-sm font-semibold">{money(row?.purchasePrice)}</div>
      <div className="text-sm font-bold">{safeNumber(row?.qtyOnHand)}</div>

      <div className="flex flex-wrap gap-2 justify-start">
        <span
          className={
            "rounded-full px-2.5 py-1 text-xs font-semibold " +
            (active
              ? "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950"
              : productStatusTone(row?.isActive !== false))
          }
        >
          {row?.isActive === false ? "Archived" : "Active"}
        </span>
      </div>
    </button>
  );
}

function ProductMobileRow({ row, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(row)}
      className={
        "w-full rounded-2xl border p-4 text-left transition lg:hidden " +
        (active
          ? "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950"
          : "border-stone-200 bg-white hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{safe(row?.name) || "-"}</p>
          <p
            className={
              "mt-1 truncate text-xs " +
              (active
                ? "text-stone-300 dark:text-stone-600"
                : "text-stone-500 dark:text-stone-400")
            }
          >
            SKU: {safe(row?.sku) || "-"}
          </p>
          <p
            className={
              "mt-1 truncate text-xs " +
              (active
                ? "text-stone-300 dark:text-stone-600"
                : "text-stone-500 dark:text-stone-400")
            }
          >
            {safe(row?.locationName) || "-"}
            {safe(row?.locationCode) ? ` (${safe(row.locationCode)})` : ""}
          </p>
        </div>

        <span
          className={
            "rounded-full px-2.5 py-1 text-xs font-semibold " +
            (active
              ? "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950"
              : productStatusTone(row?.isActive !== false))
          }
        >
          {row?.isActive === false ? "Archived" : "Active"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-2 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Sell
          </p>
          <p className="mt-1 text-sm font-bold">{money(row?.sellingPrice)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-2 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Buy
          </p>
          <p className="mt-1 text-sm font-bold">{money(row?.purchasePrice)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-2 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Qty
          </p>
          <p className="mt-1 text-sm font-bold">{safeNumber(row?.qtyOnHand)}</p>
        </div>
      </div>
    </button>
  );
}

export default function OwnerProductsTab({ locations = [] }) {
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedProductBranches, setSelectedProductBranches] = useState(null);
  const [branchesLoading, setBranchesLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [locationFilter, setLocationFilter] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);

  const [modalError, setModalError] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const [createForm, setCreateForm] = useState({
    locationId: "",
    name: "",
    sku: "",
    unit: "unit",
    sellingPrice: "",
    costPrice: "",
    maxDiscountPercent: "",
    openingQty: "",
    notes: "",
  });

  const [pricingForm, setPricingForm] = useState({
    purchasePrice: "",
    sellingPrice: "",
    maxDiscountPercent: "",
  });

  const [archiveReason, setArchiveReason] = useState("");

  const locationOptions = useMemo(() => {
    return Array.isArray(locations)
      ? locations.filter(
          (row) => safe(row?.status).toUpperCase() !== "ARCHIVED",
        )
      : [];
  }, [locations]);

  async function loadProducts() {
    setLoading(true);
    setErrorText("");
    setSuccessText("");

    const summaryParams = new URLSearchParams();
    if (includeArchived) summaryParams.set("includeInactive", "1");

    const listParams = new URLSearchParams();
    if (locationFilter) listParams.set("locationId", locationFilter);
    if (search.trim()) listParams.set("search", search.trim());
    if (statusFilter && statusFilter !== "ALL")
      listParams.set("status", statusFilter);
    if (includeArchived) listParams.set("includeInactive", "1");

    const summaryUrl = `/owner/products/summary${
      summaryParams.toString() ? `?${summaryParams.toString()}` : ""
    }`;
    const listUrl = `/owner/products${
      listParams.toString() ? `?${listParams.toString()}` : ""
    }`;

    const [summaryRes, listRes] = await Promise.allSettled([
      apiFetch(summaryUrl, { method: "GET" }),
      apiFetch(listUrl, { method: "GET" }),
    ]);

    let firstError = "";

    if (summaryRes.status === "fulfilled") {
      setSummary(summaryRes.value?.summary || null);
    } else {
      setSummary(null);
      firstError =
        firstError ||
        summaryRes.reason?.data?.error ||
        summaryRes.reason?.message ||
        "Failed to load products summary";
    }

    if (listRes.status === "fulfilled") {
      const rows = Array.isArray(listRes.value?.products)
        ? listRes.value.products
        : [];
      setProducts(rows);
      setSelectedProductId((prev) =>
        prev && rows.some((x) => String(x.productId) === String(prev))
          ? prev
          : null,
      );
    } else {
      setProducts([]);
      firstError =
        firstError ||
        listRes.reason?.data?.error ||
        listRes.reason?.message ||
        "Failed to load owner products";
    }

    setErrorText(firstError);
    setLoading(false);
  }

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [locationFilter, statusFilter, includeArchived, search]);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationFilter, statusFilter, includeArchived]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadProducts();
    }, 300);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const visibleRows = useMemo(
    () => products.slice(0, visibleCount),
    [products, visibleCount],
  );

  const hasMoreRows = visibleCount < products.length;

  const selectedProduct =
    selectedProductId == null
      ? null
      : products.find(
          (row) => String(row.productId) === String(selectedProductId),
        ) || null;

  useEffect(() => {
    async function loadBranches() {
      if (!selectedProduct?.productId) {
        setSelectedProductBranches(null);
        return;
      }

      setBranchesLoading(true);

      try {
        const result = await apiFetch(
          `/owner/products/${selectedProduct.productId}/branches?includeInactive=1`,
          { method: "GET" },
        );
        setSelectedProductBranches(result?.product || null);
      } catch {
        setSelectedProductBranches(null);
      } finally {
        setBranchesLoading(false);
      }
    }

    loadBranches();
  }, [selectedProduct?.productId]);

  const summaryTotals = summary?.totals || {
    branchesCount: 0,
    productsCount: 0,
    activeProductsCount: 0,
    archivedProductsCount: 0,
  };

  function resetCreateModal() {
    setCreateModalOpen(false);
    setModalError("");
    setModalSubmitting(false);
    setCreateForm({
      locationId: locationOptions[0]?.id ? String(locationOptions[0].id) : "",
      name: "",
      sku: "",
      unit: "unit",
      sellingPrice: "",
      costPrice: "",
      maxDiscountPercent: "",
      openingQty: "",
      notes: "",
    });
  }

  function openCreateModal() {
    setCreateForm({
      locationId: locationOptions[0]?.id ? String(locationOptions[0].id) : "",
      name: "",
      sku: "",
      unit: "unit",
      sellingPrice: "",
      costPrice: "",
      maxDiscountPercent: "",
      openingQty: "",
      notes: "",
    });
    setModalError("");
    setCreateModalOpen(true);
  }

  function openPricingModal() {
    if (!selectedProduct) return;

    setPricingForm({
      purchasePrice: String(safeNumber(selectedProduct.purchasePrice)),
      sellingPrice: String(safeNumber(selectedProduct.sellingPrice)),
      maxDiscountPercent: String(
        safeNumber(selectedProduct.maxDiscountPercent),
      ),
    });
    setModalError("");
    setPricingModalOpen(true);
  }

  function openArchiveModal() {
    if (!selectedProduct) return;
    setArchiveReason("");
    setModalError("");
    setArchiveModalOpen(true);
  }

  function closePricingModal() {
    setPricingModalOpen(false);
    setModalError("");
    setModalSubmitting(false);
  }

  function closeArchiveModal() {
    setArchiveModalOpen(false);
    setArchiveReason("");
    setModalError("");
    setModalSubmitting(false);
  }

  async function createProduct() {
    setModalSubmitting(true);
    setModalError("");

    try {
      await apiFetch("/owner/products", {
        method: "POST",
        body: {
          locationId: safeNumber(createForm.locationId),
          name: safe(createForm.name),
          sku: safe(createForm.sku) || null,
          unit: safe(createForm.unit) || "unit",
          sellingPrice: safeNumber(createForm.sellingPrice),
          costPrice: safeNumber(createForm.costPrice),
          maxDiscountPercent: safeNumber(createForm.maxDiscountPercent),
          openingQty: safeNumber(createForm.openingQty),
          notes: safe(createForm.notes) || null,
        },
      });

      resetCreateModal();
      await loadProducts();
      setSuccessText("Product created successfully.");
    } catch (error) {
      setModalError(
        error?.data?.error || error?.message || "Failed to create product",
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  async function updatePricing() {
    if (!selectedProduct?.productId) return;

    setModalSubmitting(true);
    setModalError("");

    try {
      await apiFetch(`/owner/products/${selectedProduct.productId}/pricing`, {
        method: "PUT",
        body: {
          purchasePrice: safeNumber(pricingForm.purchasePrice),
          sellingPrice: safeNumber(pricingForm.sellingPrice),
          maxDiscountPercent: safeNumber(pricingForm.maxDiscountPercent),
        },
      });

      closePricingModal();
      await loadProducts();
      setSelectedProductId(selectedProduct.productId);
      setSuccessText("Product pricing updated successfully.");
    } catch (error) {
      setModalError(
        error?.data?.error || error?.message || "Failed to update pricing",
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  async function archiveProduct() {
    if (!selectedProduct?.productId) return;

    setModalSubmitting(true);
    setModalError("");

    try {
      await apiFetch(`/owner/products/${selectedProduct.productId}/archive`, {
        method: "PATCH",
        body: {
          reason: safe(archiveReason) || null,
        },
      });

      closeArchiveModal();
      await loadProducts();
      setSelectedProductId(selectedProduct.productId);
      setSuccessText("Product archived successfully.");
    } catch (error) {
      setModalError(
        error?.data?.error || error?.message || "Failed to archive product",
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  async function restoreProduct() {
    if (!selectedProduct?.productId) return;

    setErrorText("");
    setSuccessText("");

    try {
      await apiFetch(`/owner/products/${selectedProduct.productId}/restore`, {
        method: "PATCH",
      });

      await loadProducts();
      setSelectedProductId(selectedProduct.productId);
      setSuccessText("Product restored successfully.");
    } catch (error) {
      setErrorText(
        error?.data?.error || error?.message || "Failed to restore product",
      );
    }
  }

  return (
    <div className="space-y-6">
      <AlertBox message={errorText} />
      <AlertBox message={successText} tone="success" />

      {loading ? (
        <SectionCard
          title="Products"
          subtitle="Loading owner cross-branch products."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
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
            title="Cross-branch products summary"
            subtitle="Owner-wide product visibility across branches."
            right={
              <AsyncButton
                idleText="Create product"
                loadingText="Opening..."
                successText="Ready"
                onClick={async () => openCreateModal()}
              />
            }
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Branches"
                value={safeNumber(summaryTotals.branchesCount)}
                sub="Branches with product records"
              />
              <StatCard
                label="Products"
                value={safeNumber(summaryTotals.productsCount)}
                sub="Product records across branches"
              />
              <StatCard
                label="Active"
                value={safeNumber(summaryTotals.activeProductsCount)}
                sub="Currently active product records"
              />
              <StatCard
                label="Archived"
                value={safeNumber(summaryTotals.archivedProductsCount)}
                sub="Archived product records"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Products directory"
            subtitle="Search, filter, and inspect products across branches."
          >
            <div className="grid gap-3 lg:grid-cols-4">
              <FormInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product, SKU, unit, branch, code"
              />

              <FormSelect
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {PRODUCT_STATUS_FILTERS.map((row) => (
                  <option key={row.value} value={row.value}>
                    {row.label}
                  </option>
                ))}
              </FormSelect>

              <label className="inline-flex h-12 items-center gap-2 rounded-2xl border border-stone-300 bg-white px-4 text-sm text-stone-700 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-200">
                <input
                  type="checkbox"
                  checked={includeArchived}
                  onChange={(e) => setIncludeArchived(e.target.checked)}
                />
                <span>Include archived</span>
              </label>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 text-sm text-stone-600 dark:text-stone-300">
              <p>
                Showing {Math.min(visibleRows.length, products.length)} of{" "}
                {products.length}
              </p>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800">
              <div className="hidden grid-cols-[minmax(220px,2fr)_120px_160px_120px_120px_90px_110px] gap-3 bg-stone-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 dark:bg-stone-950 dark:text-stone-400 lg:grid">
                <div>Product</div>
                <div>SKU</div>
                <div>Branch</div>
                <div>Selling</div>
                <div>Purchase</div>
                <div>Qty</div>
                <div>Status</div>
              </div>

              {products.length === 0 ? (
                <div className="p-4">
                  <EmptyState text="No products match the current owner filters." />
                </div>
              ) : (
                <div>
                  {visibleRows.map((row) => (
                    <div key={row.productId}>
                      <ProductListRow
                        row={row}
                        active={
                          String(row.productId) === String(selectedProductId)
                        }
                        onSelect={(picked) =>
                          setSelectedProductId(picked?.productId)
                        }
                      />
                      <div className="p-3 lg:hidden">
                        <ProductMobileRow
                          row={row}
                          active={
                            String(row.productId) === String(selectedProductId)
                          }
                          onSelect={(picked) =>
                            setSelectedProductId(picked?.productId)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {hasMoreRows ? (
              <div className="mt-4 flex justify-center">
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

          {selectedProduct ? (
            <SectionCard
              title="Selected product detail"
              subtitle="Focused branch-aware product detail and direct owner actions."
              right={
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${productStatusTone(
                      selectedProduct.isActive !== false,
                    )}`}
                  >
                    {selectedProduct.isActive === false ? "Archived" : "Active"}
                  </span>
                </div>
              }
            >
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <StatCard
                    label="Product"
                    value={safe(selectedProduct.name) || "-"}
                    valueClassName="text-2xl sm:text-[20px] leading-tight"
                    sub={`SKU: ${safe(selectedProduct.sku) || "-"}`}
                  />
                  <StatCard
                    label="Branch"
                    value={safe(selectedProduct.locationName) || "-"}
                    valueClassName="text-2xl sm:text-[20px] leading-tight"
                    sub={safe(selectedProduct.locationCode) || "-"}
                  />
                  <StatCard
                    label="Selling price"
                    value={money(selectedProduct.sellingPrice)}
                    sub="Current selling price"
                  />
                  <StatCard
                    label="Purchase price"
                    value={money(selectedProduct.purchasePrice)}
                    sub="Current purchase price"
                  />
                  <StatCard
                    label="Qty on hand"
                    value={safeNumber(selectedProduct.qtyOnHand)}
                    sub="Current recorded stock"
                  />
                </div>

                <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                  <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                      Product detail
                    </p>

                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Product
                        </span>
                        <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                          {safe(selectedProduct.name) || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          SKU
                        </span>
                        <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                          {safe(selectedProduct.sku) || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Unit
                        </span>
                        <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                          {safe(selectedProduct.unit) || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Branch
                        </span>
                        <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                          {safe(selectedProduct.locationName) || "-"}{" "}
                          {safe(selectedProduct.locationCode)
                            ? `(${safe(selectedProduct.locationCode)})`
                            : ""}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Branch status
                        </span>
                        <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                          {safe(selectedProduct.locationStatus) || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Created
                        </span>
                        <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                          {safeDate(selectedProduct.createdAt)}
                        </span>
                      </div>

                      <div className="border-t border-stone-200 pt-3 dark:border-stone-800">
                        <p className="text-stone-500 dark:text-stone-400">
                          Notes
                        </p>
                        <p className="mt-2 leading-6 text-stone-800 dark:text-stone-200">
                          {safe(selectedProduct.notes) || "No notes recorded."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                      Owner actions
                    </p>

                    <div className="mt-4 space-y-3">
                      <AsyncButton
                        idleText="Update pricing"
                        loadingText="Opening..."
                        successText="Ready"
                        onClick={async () => openPricingModal()}
                        className="w-full"
                      />

                      {selectedProduct?.isActive !== false ? (
                        <AsyncButton
                          idleText="Archive product"
                          loadingText="Opening..."
                          successText="Ready"
                          onClick={async () => openArchiveModal()}
                          variant="secondary"
                          className="w-full"
                        />
                      ) : (
                        <AsyncButton
                          idleText="Restore product"
                          loadingText="Restoring..."
                          successText="Done"
                          onClick={async () => restoreProduct()}
                          className="w-full"
                        />
                      )}
                    </div>

                    <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
                      This tab now uses a scalable row view better suited for
                      larger product lists.
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                    Product branches view
                  </p>

                  {branchesLoading ? (
                    <div className="mt-4 space-y-3">
                      {[1, 2].map((i) => (
                        <div
                          key={i}
                          className="h-24 animate-pulse rounded-2xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-800"
                        />
                      ))}
                    </div>
                  ) : !selectedProductBranches ? (
                    <div className="mt-4">
                      <EmptyState text="No branch product detail available." />
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {(selectedProductBranches.branches || []).map(
                        (branch) => (
                          <div
                            key={`${selectedProductBranches.productId}-${branch.locationId}`}
                            className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                                  {safe(branch.locationName) || "-"}
                                </p>
                                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                                  {safe(branch.locationCode) || "-"} ·{" "}
                                  {safe(branch.locationStatus) || "-"}
                                </p>
                              </div>

                              <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${productStatusTone(
                                  branch.isActive !== false,
                                )}`}
                              >
                                {branch.isActive === false
                                  ? "Archived"
                                  : "Active"}
                              </span>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-4">
                              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                                <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                                  Qty
                                </p>
                                <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
                                  {safeNumber(branch.qtyOnHand)}
                                </p>
                              </div>

                              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                                <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                                  Sell
                                </p>
                                <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
                                  {money(branch.sellingPrice)}
                                </p>
                              </div>

                              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                                <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                                  Buy
                                </p>
                                <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
                                  {money(branch.purchasePrice)}
                                </p>
                              </div>

                              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                                <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                                  Updated
                                </p>
                                <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
                                  {safeDate(branch.updatedAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>
          ) : (
            <SectionCard
              title="Selected product detail"
              subtitle="This section appears after the owner deliberately selects a product."
            >
              <EmptyState text="Click any product row above to inspect details and manage the product." />
            </SectionCard>
          )}
        </>
      )}

      <OverlayModal
        open={createModalOpen}
        title="Create product"
        subtitle="Create a product record in a chosen active branch."
        onClose={resetCreateModal}
        footer={
          <>
            <button
              type="button"
              onClick={resetCreateModal}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={createProduct}
              disabled={
                modalSubmitting ||
                !safe(createForm.locationId) ||
                !safe(createForm.name) ||
                safeNumber(createForm.sellingPrice) <= 0
              }
              className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
            >
              {modalSubmitting ? "Creating..." : "Create product"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <AlertBox message={modalError} />

          <div>
            <FieldLabel htmlFor="product-branch">Active branch</FieldLabel>
            <FormSelect
              id="product-branch"
              value={createForm.locationId}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  locationId: e.target.value,
                }))
              }
            >
              <option value="">Select active branch</option>
              {locationOptions
                .filter((row) => safe(row?.status).toUpperCase() === "ACTIVE")
                .map((row) => (
                  <option key={row.id} value={row.id}>
                    {safe(row.name)}{" "}
                    {safe(row.code) ? `(${safe(row.code)})` : ""}
                  </option>
                ))}
            </FormSelect>
          </div>

          <div>
            <FieldLabel htmlFor="product-name">Product name</FieldLabel>
            <FormInput
              id="product-name"
              value={createForm.name}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g. Samsung A15"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="product-sku">SKU</FieldLabel>
              <FormInput
                id="product-sku"
                value={createForm.sku}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, sku: e.target.value }))
                }
                placeholder="Optional SKU"
              />
            </div>

            <div>
              <FieldLabel htmlFor="product-unit">Unit</FieldLabel>
              <FormInput
                id="product-unit"
                value={createForm.unit}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, unit: e.target.value }))
                }
                placeholder="unit / pcs / box"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <FieldLabel htmlFor="product-selling">Selling price</FieldLabel>
              <FormInput
                id="product-selling"
                type="number"
                min="0"
                value={createForm.sellingPrice}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    sellingPrice: e.target.value,
                  }))
                }
                placeholder="0"
              />
            </div>

            <div>
              <FieldLabel htmlFor="product-cost">Purchase price</FieldLabel>
              <FormInput
                id="product-cost"
                type="number"
                min="0"
                value={createForm.costPrice}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    costPrice: e.target.value,
                  }))
                }
                placeholder="0"
              />
            </div>

            <div>
              <FieldLabel htmlFor="product-discount">Max discount %</FieldLabel>
              <FormInput
                id="product-discount"
                type="number"
                min="0"
                value={createForm.maxDiscountPercent}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    maxDiscountPercent: e.target.value,
                  }))
                }
                placeholder="0"
              />
            </div>

            <div>
              <FieldLabel htmlFor="product-opening-qty">Opening qty</FieldLabel>
              <FormInput
                id="product-opening-qty"
                type="number"
                min="0"
                value={createForm.openingQty}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    openingQty: e.target.value,
                  }))
                }
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="product-notes">Notes</FieldLabel>
            <FormTextarea
              id="product-notes"
              value={createForm.notes}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Optional notes"
            />
          </div>
        </div>
      </OverlayModal>

      <OverlayModal
        open={pricingModalOpen}
        title="Update pricing"
        subtitle="Update pricing for the selected branch product record."
        onClose={closePricingModal}
        footer={
          <>
            <button
              type="button"
              onClick={closePricingModal}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={updatePricing}
              disabled={modalSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
            >
              {modalSubmitting ? "Saving..." : "Save pricing"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <AlertBox message={modalError} />

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <FieldLabel htmlFor="pricing-purchase">Purchase price</FieldLabel>
              <FormInput
                id="pricing-purchase"
                type="number"
                min="0"
                value={pricingForm.purchasePrice}
                onChange={(e) =>
                  setPricingForm((prev) => ({
                    ...prev,
                    purchasePrice: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <FieldLabel htmlFor="pricing-selling">Selling price</FieldLabel>
              <FormInput
                id="pricing-selling"
                type="number"
                min="0"
                value={pricingForm.sellingPrice}
                onChange={(e) =>
                  setPricingForm((prev) => ({
                    ...prev,
                    sellingPrice: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <FieldLabel htmlFor="pricing-discount">Max discount %</FieldLabel>
              <FormInput
                id="pricing-discount"
                type="number"
                min="0"
                value={pricingForm.maxDiscountPercent}
                onChange={(e) =>
                  setPricingForm((prev) => ({
                    ...prev,
                    maxDiscountPercent: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </div>
      </OverlayModal>

      <OverlayModal
        open={archiveModalOpen}
        title="Archive product"
        subtitle="Archive the selected branch product record without losing history."
        onClose={closeArchiveModal}
        footer={
          <>
            <button
              type="button"
              onClick={closeArchiveModal}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={archiveProduct}
              disabled={modalSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
            >
              {modalSubmitting ? "Archiving..." : "Confirm archive"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <AlertBox message={modalError} />

          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
            Product: <strong>{safe(selectedProduct?.name)}</strong> —{" "}
            {safe(selectedProduct?.locationName)}
            {safe(selectedProduct?.locationCode)
              ? ` (${safe(selectedProduct.locationCode)})`
              : ""}
          </div>

          <div>
            <FieldLabel htmlFor="archive-reason">Reason</FieldLabel>
            <FormTextarea
              id="archive-reason"
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.target.value)}
              placeholder="Why is this product being archived?"
            />
          </div>
        </div>
      </OverlayModal>
    </div>
  );
}
