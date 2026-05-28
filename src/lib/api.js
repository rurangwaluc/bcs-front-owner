"use client";

function normalizeBase(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

const BASE = normalizeBase(process.env.NEXT_PUBLIC_API_BASE);

async function readBodySafe(res) {
  const ct = res.headers.get("content-type") || "";

  if (ct.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return {};
    }
  }

  try {
    const text = await res.text();
    return text ? { error: text } : {};
  } catch {
    return {};
  }
}

function buildQuery(params = {}) {
  const qs = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    qs.set(key, String(value));
  });

  const s = qs.toString();
  return s ? `?${s}` : "";
}

export async function apiFetch(path, opts = {}) {
  if (!BASE) {
    throw new Error(
      "Missing NEXT_PUBLIC_API_BASE in .env.local. Restart dev server after setting it.",
    );
  }

  const hasBody =
    Object.prototype.hasOwnProperty.call(opts, "body") &&
    opts.body !== undefined &&
    opts.body !== null;

  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers: {
      ...(opts.headers || {}),
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
    },
    credentials: "include",
    body: hasBody ? JSON.stringify(opts.body) : undefined,
  });

  const data = await readBodySafe(res);

  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

/**
 * Expenses API
 */
export function listExpenses(params = {}) {
  return apiFetch(`/cash/expenses${buildQuery(params)}`);
}

export function createExpense(payload) {
  return apiFetch("/cash/expenses", {
    method: "POST",
    body: payload,
  });
}

export function voidExpense(expenseId, reason) {
  return apiFetch(`/cash/expenses/${expenseId}/void`, {
    method: "POST",
    body: { reason },
  });
}

/**
 * Owner given-out loans API
 */
export function listOwnerLoans(params = {}) {
  return apiFetch(`/owner/payments/owner-loans${buildQuery(params)}`);
}

export function getOwnerLoansSummary(params = {}) {
  return apiFetch(`/owner/payments/owner-loans/summary${buildQuery(params)}`);
}

export function createOwnerLoan(payload) {
  return apiFetch("/owner/payments/owner-loans", {
    method: "POST",
    body: payload,
  });
}

export function repayOwnerLoan(loanId, payload) {
  return apiFetch(`/owner/payments/owner-loans/${loanId}/repayments`, {
    method: "POST",
    body: payload,
  });
}

export function voidOwnerLoan(loanId, payload) {
  return apiFetch(`/owner/payments/owner-loans/${loanId}/void`, {
    method: "POST",
    body: payload,
  });
}

export { buildQuery };
