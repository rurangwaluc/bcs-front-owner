"use client";

function getApiBaseUrl() {
  const envUrl =
    typeof import.meta !== "undefined" &&
    import.meta?.env &&
    (import.meta.env.VITE_API_URL ||
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_BACKEND_URL);

  if (envUrl) {
    return String(envUrl).replace(/\/+$/, "");
  }

  return "http://localhost:4000";
}

export function getPurchaseOrderPdfUrl(
  purchaseOrderId,
  { download = false } = {},
) {
  const id = Number(purchaseOrderId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid purchase order id");
  }

  const baseUrl = getApiBaseUrl();
  const query = download ? "?download=1" : "";

  return `${baseUrl}/purchase-orders/${id}/pdf${query}`;
}

export function previewPurchaseOrderPdf(purchaseOrderId) {
  const url = getPurchaseOrderPdfUrl(purchaseOrderId);
  window.open(url, "_blank", "noopener,noreferrer");
}

export async function downloadPurchaseOrderPdf(
  purchaseOrderId,
  fallbackName = "",
) {
  const id = Number(purchaseOrderId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid purchase order id");
  }

  const url = getPurchaseOrderPdfUrl(id, { download: true });

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    let message = "Failed to download purchase order PDF";
    try {
      const data = await response.json();
      message = data?.error || message;
    } catch {}
    throw new Error(message);
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);

  const disposition = response.headers.get("content-disposition") || "";
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  const plainMatch = disposition.match(/filename="?([^"]+)"?/i);

  const serverFileName = utf8Match?.[1]
    ? decodeURIComponent(utf8Match[1])
    : plainMatch?.[1]
      ? plainMatch[1]
      : "";

  const fileName = serverFileName || fallbackName || `purchase-order-${id}.pdf`;

  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(objectUrl);
}
