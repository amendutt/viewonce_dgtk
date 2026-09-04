import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Filter, Download } from "lucide-react";
import { Panel, DataTable, Input, Select } from "../../components/ui/index.jsx";
import { reportsApi, exportsApi, branchesApi, agentsApi } from "../../api/resources";
import { useApi, downloadBlob } from "../../api/hooks";
import { useApp } from "../../context/AppContext";

const today = new Date().toISOString().slice(0, 10);

export default function SalesmanActivityAdminPage() {
  const { firms } = useApp();
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [firmId, setFirmId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [salesmanId, setSalesmanId] = useState("");

  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Fetch all agents / salesmen
  const { data: agentsData, loading: agentsLoading } = useApi(
    () => agentsApi.list({ limit: 100 }),
    []
  );
  const agents = Array.isArray(agentsData) ? agentsData : agentsData?.rows || [];

  // Filter agents based on selected firm and branch
  const filteredAgents = agents.filter((a) => {
    if (firmId && a.firm_id && String(a.firm_id) !== String(firmId)) return false;
    if (branchId) {
      const bIds = Array.isArray(a.branch_ids)
        ? a.branch_ids.map(String)
        : a.branch_id
        ? [String(a.branch_id)]
        : [];
      if (bIds.length > 0 && !bIds.includes(String(branchId))) return false;
    }
    return true;
  });

  // Reset selected salesman if not in filtered list
  useEffect(() => {
    if (salesmanId && !filteredAgents.some((a) => String(a.id) === String(salesmanId))) {
      setSalesmanId("");
    }
  }, [firmId, branchId, filteredAgents, salesmanId]);

  // Load and filter branches based on selected firm
  useEffect(() => {
    let active = true;
    const fetchBranches = async () => {
      setBranchesLoading(true);
      try {
        const params = { limit: 100 };
        if (firmId) {
          params.firm_id = firmId;
        }
        const res = await branchesApi.list(params);
        if (!active) return;
        const data = res?.data?.data ?? res?.data ?? [];
        const rows = Array.isArray(data) ? data : data?.rows || [];
        setBranches(rows);

        // Reset selected branch if it doesn't belong to the new branches list
        setBranchId((currentBranchId) => {
          if (currentBranchId && !rows.some((b) => String(b.id) === String(currentBranchId))) {
            return "";
          }
          return currentBranchId;
        });
      } catch (err) {
        console.error("Failed to fetch branches:", err);
        if (active) setBranches([]);
      } finally {
        if (active) setBranchesLoading(false);
      }
    };
    fetchBranches();
    return () => {
      active = false;
    };
  }, [firmId]);

  const buildParams = useCallback(() => {
    const p = {
      from_date: fromDate,
      to_date: toDate,
    };
    if (firmId) p.firm_id = Number(firmId);
    if (branchId) p.branch_id = Number(branchId);
    if (salesmanId) {
      p.agent_id = Number(salesmanId);
      p.salesman_id = Number(salesmanId);
    }
    return p;
  }, [fromDate, toDate, firmId, branchId, salesmanId]);

  const { data, loading, error, refetch } = useApi(
    () => reportsApi.salesmanActivity(buildParams()),
    [fromDate, toDate, firmId, branchId, salesmanId]
  );

  const rawRows = Array.isArray(data) ? data : data?.rows || [];
  const filteredRawRows = rawRows.filter((r) => {
    if (!salesmanId) return true;
    const sId = String(r.salesman_id || r.agent_id || r.id || "");
    const targetId = String(salesmanId);
    const targetCode = `AG${String(salesmanId).padStart(3, "0")}`;
    return sId === targetId || sId === targetCode || sId.toLowerCase() === targetCode.toLowerCase();
  });

  const rows = filteredRawRows.map((r, idx) => {
    // Format salesman_id as AGxxx if numeric, e.g. 1 -> AG001, or return string as is
    const rawId = r.salesman_id || "";
    const formattedSalesmanId = String(rawId).startsWith("AG")
      ? rawId
      : !isNaN(Number(rawId)) && rawId !== ""
        ? `AG${String(rawId).padStart(3, "0")}`
        : rawId || "—";

    return {
      id: r.id || `${r.salesman_id || idx}-${r.date || idx}`,
      date: r.date || "—",
      firm: r.firm || "—",
      branch: r.branch || "—",
      salesman_id: formattedSalesmanId,
      salesman_name: r.salesman_name || "—",
      login_time: r.login_time || "—",
      logout_time: r.logout_time || "—",
      working_hours: r.working_hours || "—",
      live_tracking_status: r.live_tracking_status || "Inactive",
      visits: typeof r.visits === "number" ? r.visits : 0,
      orders: typeof r.orders === "number" ? r.orders : 0,
      order_value: typeof r.order_value === "number" ? r.order_value : Number(r.order_value || 0),
      cash_collection: typeof r.cash_collection === "number" ? r.cash_collection : Number(r.cash_collection || 0),
      pending_balance: typeof r.pending_balance === "number" ? r.pending_balance : Number(r.pending_balance || 0),
      new_parties_added: typeof r.new_parties_added === "number" ? r.new_parties_added : 0,
      remarks: r.remarks || "—",
      total_km: r.total_km !== undefined && r.total_km !== null ? `${Number(r.total_km).toFixed(2)} km` : "0.00 km",
    };
  });

  const handleExportExcel = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const p = buildParams();
      const res = await exportsApi.salesmanActivity(p);
      const filename = `salesman_activity_${fromDate}_to_${toDate}.xlsx`;
      downloadBlob(res, filename);
    } catch (err) {
      console.error("Excel export error:", err);
    } finally {
      setExporting(false);
    }
  };

  const firmOptions = [
    { label: "All Firms", value: "" },
    ...firms.map((f) => ({ label: f.name, value: String(f.id) })),
  ];

  const branchOptions = [
    { label: "All Branches", value: "" },
    ...branches.map((b) => ({ label: b.name, value: String(b.id) })),
  ];

  const salesmanOptions = [
    { label: "All Salesmen", value: "" },
    ...filteredAgents.map((a) => {
      const name = a.User?.name || a.name || `Salesman ${a.id}`;
      const code = a.id ? ` (AG${String(a.id).padStart(3, "0")})` : "";
      return {
        label: `${name}${code}`,
        value: String(a.id),
      };
    }),
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Admin</p>
        <h1 className="font-display font-bold text-2xl text-slate-900">Salesman Activity Report</h1>
        <p className="text-sm text-slate-500 mt-0.5">Daily timesheets, tracking status, and key performance indicators of salesmen</p>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl px-4 py-3 text-sm font-medium bg-rose-50 border border-rose-100 text-rose-700">
          {error}
        </motion.div>
      )}

      <div className="card-lg">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
          <Filter size={12} /> Filters
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
          <Input label="From Date" type="date" value={fromDate} onChange={setFromDate} />
          <Input label="To Date" type="date" value={toDate} onChange={setToDate} />
          <Select label="Firm" value={firmId} options={firmOptions} onChange={setFirmId} />
          <Select label="Branch" value={branchId} options={branchOptions} onChange={setBranchId} disabled={branchesLoading} />
          <Select label="Search Salesman" value={salesmanId} options={salesmanOptions} onChange={setSalesmanId} disabled={agentsLoading} />
        </div>
      </div>

      <Panel
        title="Activity Log"
        subtitle={`${rows.length} records`}
        action={
          <div className="flex gap-2">
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="btn-secondary h-9 text-xs flex items-center gap-1.5"
            >
              <Download size={14} className={exporting ? "animate-bounce" : ""} />
              {exporting ? "Exporting..." : "Export Excel"}
            </button>
            <button
              onClick={refetch}
              disabled={loading}
              className="btn-secondary h-9 px-3 flex items-center gap-1.5 text-xs justify-center"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        }
      >
        {loading ? (
          <div className="py-10 text-center">
            <div className="h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No activity records found for the selected filters.</p>
        ) : (
          <DataTable
            rows={rows}
            columns={[
              "date",
              "firm",
              "branch",
              "salesman_id",
              "salesman_name",
              "login_time",
              "logout_time",
              "working_hours",
              "live_tracking_status",
              "visits",
              "orders",
              "order_value",
              "cash_collection",
              "pending_balance",
              "new_parties_added",
              "remarks",
              "total_km",
            ]}
          />
        )}
      </Panel>
    </div>
  );
}
