import { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";
import { firmsApi, dashboardApi, reportsApi } from "../api/resources";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // ── Firms ──────────────────────────────────────────────────────────────────
  const [firms, setFirms] = useState([]);
  // selectedFirmId: "" = All Firms, otherwise the numeric firm id as string
  const [selectedFirmId, setSelectedFirmId] = useState("");

  // ── Dashboard data (refetched on firm change) ──────────────────────────────
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [dashboardTargets, setDashboardTargets] = useState([]);
  const [verticalsData, setVerticalsData] = useState([]);
  const [salesOutstandingData, setSalesOutstandingData] = useState([]);
  const [purchaseOutstandingData, setPurchaseOutstandingData] = useState([]);

  // ── Other report data (managed per-page, kept here for compat) ────────────
  const [salesRows, setSalesRows] = useState([]);
  const [purchaseRows, setPurchaseRows] = useState([]);
  const [collectionData, setCollectionData] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // ── Helpers ────────────────────────────────────────────────────────────────
  const safe = (promise, key) =>
    promise.catch((e) => {
      setErrors((prev) => ({ ...prev, [key]: e?.response?.data?.message || e.message }));
      return { data: { data: [] } };
    });

  const unwrap = (res) => res?.data?.data ?? res?.data ?? [];
  const toRows = (r) => { const d = unwrap(r); return Array.isArray(d) ? d : d?.rows || []; };

  // ── Load firms (once) ──────────────────────────────────────────────────────
  const loadFirms = useCallback(async () => {
    try {
      const res = await firmsApi.list({ limit: 100 });
      const data = unwrap(res);
      setFirms(Array.isArray(data) ? data : data?.rows || []);
    } catch (_) {}
  }, []);

  // ── Load dashboard (re-runs when selectedFirmId changes) ──────────────────
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      // Build params — only include firm_id when a specific firm is selected
      const params = selectedFirmId ? { firm_id: selectedFirmId } : {};

      const [sumRes, tgtRes, vertRes, saOutRes, puOutRes] = await Promise.all([
        safe(dashboardApi.summary(params),              "dashboard"),
        safe(dashboardApi.targets(params),              "targets"),
        safe(reportsApi.verticals(params),              "verticals"),
        safe(reportsApi.salesOutstanding(params),       "salesOutstanding"),
        safe(reportsApi.purchaseOutstanding(params),    "purchaseOutstanding"),
      ]);

      setDashboardSummary(unwrap(sumRes) || sumRes?.data);
      setDashboardTargets(Array.isArray(toRows(tgtRes)) ? toRows(tgtRes) : []);
      setVerticalsData(toRows(vertRes));
      
      const getSalesmanFirmBranch = (row) => {
        if (row.firm || row.firm_name) {
          return {
            firm: row.firm || row.firm_name,
            branch: row.branch || row.branch_name
          };
        }
        const salesmanName = String(row.salesman || row.agent_name || "").toLowerCase();
        const verticalName = String(row.vertical || "").toLowerCase();
        if (salesmanName.includes("shailesh") || verticalName.includes("battery")) {
          return { firm: "DHARMESH WARI TYRES OLD", branch: "Dharmeshwari Tyres (DT OLD)" };
        }
        if (salesmanName.includes("amit") || verticalName.includes("solar")) {
          return { firm: "DHARMESH WARI TYRES OLD", branch: "Dharmeshwari Tyres (DT OLD)" };
        }
        if (salesmanName.includes("abhishek") || salesmanName.includes("manish") || verticalName.includes("tyre")) {
          return { firm: "DHARMESH WARI TYRES OLD", branch: "Dharmeshwari Tyres (DT OLD)" };
        }
        if (salesmanName.includes("anuj") || verticalName.includes("lube")) {
          return { firm: "DHARMESHWARI GORUP OF BUSINESS", branch: "New Dharmeshwari Tyres (NDT)" };
        }
        if (salesmanName.includes("gyanendra") || verticalName.includes("havell")) {
          return { firm: "NEW DHARMESH WARI TYRE", branch: "Group" };
        }
        return { firm: "", branch: "" };
      };

      const rawSales = toRows(saOutRes);
      const rawPurchase = toRows(puOutRes);

      setSalesOutstandingData(
        rawSales.map((row) => {
          const loc = getSalesmanFirmBranch(row);
          return {
            ...row,
            party: row.party || row.party_name || "",
            firm: loc.firm,
            branch: loc.branch,
            vertical: row.vertical || "",
            salesman: row.salesman || row.salesman_name || row.agent_name || "",
            outstanding: Number(row.outstanding_amount || row.pending_amount || row.outstanding || 0),
          };
        })
      );

      setPurchaseOutstandingData(
        rawPurchase.map((row) => ({
          ...row,
          vendor: row.vendor_name || row.vendor || "",
          firm: row.firm || row.firm_name || (row.branch === "Group" || row.branch_name === "Group" ? "NEW DHARMESH WARI TYRE" : ""),
          branch: row.branch || row.branch_name || "",
          total: Number(row.total_amount || row.total || 0),
          paid: Number(row.paid_amount || row.paid || 0),
          outstanding: Number(row.outstanding_amount || row.outstanding || 0),
        }))
      );
    } finally {
      setLoading(false);
    }
  }, [selectedFirmId]); // <-- key: re-fetches whenever firm selection changes

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => { loadFirms(); }, [loadFirms]);

  // Re-fetch dashboard every time selectedFirmId or loadDashboard changes
  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // ── Firm names for legacy dropdowns ───────────────────────────────────────
  const firmNames = useMemo(
    () => ["All Firms", ...firms.map((f) => f.name)],
    [firms]
  );

  // activeFirm (name) — kept for backward compatibility with other components
  const activeFirm = useMemo(() => {
    if (!selectedFirmId) return "All Firms";
    return firms.find((f) => String(f.id) === String(selectedFirmId))?.name || "All Firms";
  }, [selectedFirmId, firms]);

  // setActiveFirm by name — kept for backward compat
  const setActiveFirm = useCallback((nameOrId) => {
    if (!nameOrId || nameOrId === "All Firms") { setSelectedFirmId(""); return; }
    // If it looks like an id (numeric string)
    const byId = firms.find((f) => String(f.id) === String(nameOrId));
    if (byId) { setSelectedFirmId(String(byId.id)); return; }
    // Otherwise match by name
    const byName = firms.find((f) => f.name === nameOrId);
    setSelectedFirmId(byName ? String(byName.id) : "");
  }, [firms]);

  // ── Derived: metrics from dashboardSummary + report data as fallback ─────
  const metrics = useMemo(() => {
    const s = dashboardSummary;
    if (!s) return {
      total: 0, cash: 0, online: 0, credit: 0, advance: 0,
      salesOutstanding: 0, purchaseOutstanding: 0,
      totalOrders: 0, pendingOrders: 0, approvedOrders: 0, activeAgents: 0,
    };
    let cash     = Number(s.total_cash     ?? s.cash_sales    ?? s.cashSales    ?? s.cash    ?? 0);
    let online   = Number(s.total_online   ?? s.online_sales  ?? s.onlineSales  ?? 0);
    let credit   = Number(s.total_credit   ?? s.credit_sales  ?? s.creditSales  ?? s.credit  ?? 0);
    const advance  = Number(s.advance_collected ?? s.advanceCollected ?? s.advance ?? 0);

    // Fall back to verticals breakdown when summary returns zeros
    if (!cash && !online && !credit && verticalsData.length > 0) {
      cash   = verticalsData.reduce((sum, v) => sum + Number(v.cash ?? 0), 0);
      online = verticalsData.reduce((sum, v) => sum + Number(v.wallet_online ?? v.wallet ?? v.online ?? 0), 0);
      credit = verticalsData.reduce((sum, v) => sum + Number(v.credit ?? 0), 0);
    }

    // Sales outstanding: prefer summary value, fall back to summing report rows
    let salesOutstandingVal = Number(s.total_outstanding ?? s.sales_outstanding ?? s.salesOutstanding ?? 0);
    if (!salesOutstandingVal && salesOutstandingData.length > 0) {
      salesOutstandingVal = salesOutstandingData.reduce(
        (sum, row) => sum + Number(row.outstanding_amount || row.pending_amount || row.outstanding || 0), 0
      );
    }

    // Purchase outstanding: prefer summary value, fall back to summing report rows
    let purchaseOutstandingVal = Number(s.purchase_outstanding ?? s.purchaseOutstanding ?? 0);
    if (!purchaseOutstandingVal && purchaseOutstandingData.length > 0) {
      purchaseOutstandingVal = purchaseOutstandingData.reduce(
        (sum, row) => sum + Number(row.outstanding_amount || row.outstanding || 0), 0
      );
    }

    // Total revenue: prefer summary, fall back to verticals total, then cash+online+credit
    let total = Number(s.total_revenue ?? s.totalRevenue ?? 0);
    if (!total) {
      total = cash + online + credit;
    }
    if (!total && verticalsData.length > 0) {
      total = verticalsData.reduce(
        (sum, v) => sum + Number(v.cash ?? 0) + Number(v.wallet_online ?? v.wallet ?? v.online ?? 0) + Number(v.credit ?? 0), 0
      );
    }

    return {
      total, cash, online, credit, advance,
      salesOutstanding: salesOutstandingVal,
      purchaseOutstanding: purchaseOutstandingVal,
      totalOrders:    Number(s.total_orders    ?? s.totalOrders    ?? 0),
      pendingOrders:  Number(s.pending_orders  ?? s.pendingOrders  ?? 0),
      approvedOrders: Number(s.approved_orders ?? s.approvedOrders ?? 0),
      activeAgents:   Number(s.active_agents   ?? s.activeAgents   ?? 0),
    };
  }, [dashboardSummary, salesOutstandingData, purchaseOutstandingData, verticalsData]);

  // ── Derived: verticalRows ─────────────────────────────────────────────────
  const verticalRows = useMemo(() => {
    if (verticalsData.length > 0) {
      return verticalsData.map((v) => ({
        vertical:    v.name        || v.vertical,
        totalQty:    v.total_qty   ?? v.totalQty ?? 0,
        cash:        v.cash        ?? 0,
        wallet:      v.wallet_online ?? v.wallet ?? v.online ?? 0,
        credit:      v.credit      ?? 0,
        outstanding: v.outstanding ?? 0,
      }));
    }
    return [];
  }, [verticalsData]);

  // ── Derived: outstandingRows (branch-level) ───────────────────────────────
  const outstandingRows = useMemo(() => {
    const byKey = {};
    salesOutstandingData.forEach((row) => {
      const key = `${row.firm || row.firm_name}|${row.branch || row.branch_name}`;
      byKey[key] ||= { firm: row.firm || row.firm_name, branch: row.branch || row.branch_name, salesOutstanding: 0, purchaseOutstanding: 0, grandOutstanding: 0 };
      byKey[key].salesOutstanding += Number(row.outstanding || row.amount || 0);
    });
    purchaseOutstandingData.forEach((row) => {
      const key = `${row.firm || row.firm_name}|${row.branch || row.branch_name}`;
      byKey[key] ||= { firm: row.firm || row.firm_name, branch: row.branch || row.branch_name, salesOutstanding: 0, purchaseOutstanding: 0, grandOutstanding: 0 };
      byKey[key].purchaseOutstanding += Number(row.outstanding || row.amount || 0);
    });
    Object.values(byKey).forEach((r) => { r.grandOutstanding = r.salesOutstanding + r.purchaseOutstanding; });
    return Object.values(byKey);
  }, [salesOutstandingData, purchaseOutstandingData]);

  // ── Derived: salesOutstandingData formatted for Dashboard table ───────────
  const partyOutstandingRows = useMemo(() => {
    const byKey = {};
    salesOutstandingData.forEach((row) => {
      if (!row.outstanding || Number(row.outstanding) <= 0) return;
      const key = `${row.party || row.party_name}|${row.firm || row.firm_name}`;
      byKey[key] ||= { party: row.party || row.party_name, firm: row.firm || row.firm_name, branch: row.branch || row.branch_name, salesman: row.salesman || row.agent_name, outstanding: 0 };
      byKey[key].outstanding += Number(row.outstanding || 0);
    });
    return Object.values(byKey).sort((a, b) => b.outstanding - a.outstanding);
  }, [salesOutstandingData]);

  // ── Client-side filter for legacy pages ───────────────────────────────────
  const filterRows = useCallback((rows) =>
    rows.filter((row) => {
      const firmOk = !selectedFirmId || row.firm === activeFirm || row.firm_name === activeFirm;
      const q = query.trim().toLowerCase();
      if (!q) return firmOk;
      return firmOk && Object.values(row).join(" ").toLowerCase().includes(q);
    }),
    [selectedFirmId, activeFirm, query]
  );

  const filteredSales     = useMemo(() => filterRows(salesRows),     [filterRows, salesRows]);
  const filteredPurchases = useMemo(() => filterRows(purchaseRows),   [filterRows, purchaseRows]);

  return (
    <AppContext.Provider value={{
      // Firms
      firms, firmNames, activeFirm, setActiveFirm,
      selectedFirmId, setSelectedFirmId,
      // Dashboard data
      dashboardSummary, dashboardTargets,
      salesOutstandingData, purchaseOutstandingData,
      // Raw report data
      salesRows, setSalesRows,
      purchaseRows, setPurchaseRows,
      collectionData, verticalsData, comparisonData,
      // Filters/search
      query, setQuery,
      // Derived
      metrics, verticalRows, outstandingRows,
      partyOutstandingRows, filteredSales, filteredPurchases,
      // State
      loading, errors,
      // Refetch
      refetchDashboard: loadDashboard,
      refetchReports: loadDashboard,
      refetchFirms: loadFirms,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
};
