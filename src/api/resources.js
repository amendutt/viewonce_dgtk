import client from "./client";

// ── Firms ────────────────────────────────────────────────────────────────────
export const firmsApi = {
  list: (params = {}) => client.get("/firms", { params }),
  get: (id) => client.get(`/firms/${id}`),
  create: (data) => client.post("/firms", data),
  update: (id, data) => client.put(`/firms/${id}`, data),
  delete: (id) => client.delete(`/firms/${id}`),
};

// ── Branches ─────────────────────────────────────────────────────────────────
export const branchesApi = {
  list: (params = {}) => client.get("/branches", { params }),
  get: (id) => client.get(`/branches/${id}`),
  create: (data) => client.post("/branches", data),
  update: (id, data) => client.put(`/branches/${id}`, data),
  delete: (id) => client.delete(`/branches/${id}`),
};

// ── Verticals ─────────────────────────────────────────────────────────────────
export const verticalsApi = {
  list: () => client.get("/verticals"),
  create: (data) => client.post("/verticals", data),
  update: (id, data) => client.put(`/verticals/${id}`, data),
  delete: (id) => client.delete(`/verticals/${id}`),
};

// ── Items / Products ──────────────────────────────────────────────────────────
export const itemsApi = {
  list: (params = {}) => client.get("/items", { params }),
  get: (id) => client.get(`/items/${id}`),
  create: (data) => client.post("/items", data),
  update: (id, data) => client.put(`/items/${id}`, data),
  delete: (id) => client.delete(`/items/${id}`),
};

// ── Sub-Items ─────────────────────────────────────────────────────────────────
export const subItemsApi = {
  list: (params = {}) => client.get("/sub-items", { params }),
  get: (id) => client.get(`/sub-items/${id}`),
  create: (data) => client.post("/sub-items", data),
  update: (id, data) => client.put(`/sub-items/${id}`, data),
  delete: (id) => client.delete(`/sub-items/${id}`),
};

// ── Parties (Customers) ───────────────────────────────────────────────────────
export const partiesApi = {
  list: (params = {}) => client.get("/parties", { params }),
  get: (id) => client.get(`/parties/${id}`),
  create: (data) => client.post("/parties", data),
  update: (id, data) => client.put(`/parties/${id}`, data),
  delete: (id) => client.delete(`/parties/${id}`),
  getPending: (params = {}) => client.get("/parties/pending", { params }),
  approve: (id) => client.post(`/parties/${id}/approve`),
  reject: (id, data) => client.post(`/parties/${id}/reject`, data),
};

// ── Agents ────────────────────────────────────────────────────────────────────
export const agentsApi = {
  list: (params = {}) => client.get("/agents", { params }),
  get: (id) => client.get(`/agents/${id}`),
  update: (id, data) => client.put(`/agents/${id}`, data),
  updateKyc: (id, data) => client.put(`/agents/${id}/kyc`, data),
  upload: (id, formData) =>
    client.post(`/agents/${id}/uploads`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  toggleDuty: () => client.post("/agents/duty/toggle"),
  delete: (id) => client.delete(`/agents/${id}`),
};

// ── Sales Orders ──────────────────────────────────────────────────────────────
export const salesOrdersApi = {
  list: (params = {}) => client.get("/sales-orders", { params }),
  get: (id) => client.get(`/sales-orders/${id}`),
  create: (data) => client.post("/sales-orders", data),
  update: (id, data) => client.put(`/sales-orders/${id}`, data),
  approve: (id, data = {}) => client.post(`/sales-orders/${id}/approve`, data),
  reject: (id, reason) => client.post(`/sales-orders/${id}/reject`, { reason }),
};

// ── Purchases ─────────────────────────────────────────────────────────────────
export const purchasesApi = {
  list: (params = {}) => client.get("/purchases", { params }),
  get: (id) => client.get(`/purchases/${id}`),
  create: (data) => client.post("/purchases", data),
  pay: (id, paid_amount) => client.post(`/purchases/${id}/pay`, { paid_amount }),
  update: (id, data) => client.put(`/purchases/${id}`, data),
  delete: (id) => client.delete(`/purchases/${id}`),
};

// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentsApi = {
  list: (params = {}) => client.get("/payments", { params }),
  get: (id) => client.get(`/payments/${id}`),
  collectOutstanding: (data) => client.post("/payments/collect-outstanding", data),
};

// ── Location Tracking ─────────────────────────────────────────────────────────
export const locationApi = {
  log: (data) => client.post("/location/log", data),
  live: (params = {}) => client.get("/location/live", { params }),
  journeySummary: (params = {}) => client.get("/location/journey-summary", { params }),
};

// ── EOD Reports ───────────────────────────────────────────────────────────────
export const eodApi = {
  list: (params = {}) => client.get("/eod-reports", { params }),
  today: () => client.get("/eod-reports/today"),
  create: (data) => client.post("/eod-reports", data),
};

// ── Targets ───────────────────────────────────────────────────────────────────
export const targetsApi = {
  list: (params = {}) => client.get("/targets", { params }),
  create: (data) => client.post("/targets", data),
  update: (id, data) => client.put(`/targets/${id}`, data),
  updateAchieved: (id, achieved_amount) =>
    client.patch(`/targets/${id}/achieved`, { achieved_amount }),
  delete: (id) => client.delete(`/targets/${id}`),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  summary: (params = {}) => client.get("/dashboard/summary", { params }),
  targets: (params = {}) => client.get("/dashboard/targets", { params }),
  pieChart: (params = {}) => client.get("/dashboard/pie-chart", { params }),
  firmWise: (params = {}) => client.get("/dashboard/firm-wise", { params }),
  refreshPoll: (params = {}) => client.get("/dashboard/refresh-poll", { params }),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = {
  dailySales: (params = {}) => client.get("/reports/daily-sales", { params }),
  dailySalesMatrix: (params = {}) => client.get("/reports/daily-sales-matrix", { params }),
  dailyItemsSalesMatrix: (params = {}) => client.get("/reports/daily-items-sales-matrix", { params }),
  dailySubItemsSalesMatrix: (params = {}) => client.get("/reports/daily-sub-items-sales-matrix", { params }),
  dailyCollection: (params = {}) => client.get("/reports/daily-collection", { params }),
  collectionDetailed: (params = {}) =>
    client.get("/reports/collection-detailed", { params }),
  verticals: (params = {}) => client.get("/reports/verticals", { params }),
  comparisonAnalytics: (params = {}) =>
    client.get("/reports/comparison-analytics", { params }),
  comparisonByDimension: (params = {}) =>
    client.get("/reports/comparison-by-dimension", { params }),
  salesOutstanding: (params = {}) =>
    client.get("/reports/sales-outstanding", { params }),
  purchaseOutstanding: (params = {}) =>
    client.get("/reports/purchase-outstanding", { params }),
  targetReport: (params = {}) => client.get("/reports/target-report", { params }),
  salesmanActivity: (params = {}) => client.get("/reports/salesman-activity", { params }),
};

// ── Exports ───────────────────────────────────────────────────────────────────
export const exportsApi = {
  dailySales: (params = {}) =>
    client.get("/exports/daily-sales", { params, responseType: "blob" }),
  collection: (params = {}) =>
    client.get("/exports/collection", { params, responseType: "blob" }),
  salesOutstanding: (params = {}) =>
    client.get("/exports/sales-outstanding", { params, responseType: "blob" }),
  purchaseOutstanding: (params = {}) =>
    client.get("/exports/purchase-outstanding", { params, responseType: "blob" }),
  bulkItems: (params = {}) =>
    client.get("/exports/bulk-items", { params, responseType: "blob" }),
  dailyItemsSalesMatrix: (params = {}) =>
    client.get("/exports/daily-items-sales-matrix", { params, responseType: "blob" }),
  dailySubItemsSalesMatrix: (params = {}) =>
    client.get("/exports/daily-sub-items-sales-matrix", { params, responseType: "blob" }),
  targetReport: (params = {}) =>
    client.get("/exports/target-report", { params, responseType: "blob" }),
  salesmanActivity: (params = {}) =>
    client.get("/exports/salesman-activity", { params, responseType: "blob" }),
};

// ── Imports ───────────────────────────────────────────────────────────────────
export const importsApi = {
  salesOrders: (formData) =>
    client.post("/imports/sales-orders", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  purchases: (formData) =>
    client.post("/imports/purchases", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  items: (formData) =>
    client.post("/imports/items", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// ── Route Plans ───────────────────────────────────────────────────────────────
export const routePlansApi = {
  list: (params = {}) => client.get("/route-plans", { params }),
  getById: (id) => client.get(`/route-plans/${id}`),
  create: (data) => client.post("/route-plans", data),
  update: (id, data) => client.put(`/route-plans/${id}`, data),
  delete: (id) => client.delete(`/route-plans/${id}`),
};

// ── Health ────────────────────────────────────────────────────────────────────
export const healthApi = {
  check: () => client.get("/health"),
};
