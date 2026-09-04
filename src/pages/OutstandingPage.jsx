import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { AlertCircle, RefreshCw, Download, Filter } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Panel, DataTable, Select } from "../components/ui/index.jsx";
import { reportsApi, exportsApi, verticalsApi, agentsApi } from "../api/resources";
import { useApi, downloadBlob } from "../api/hooks";
import { currency } from "../utils/helpers";

export default function OutstandingPage() {
  const { firms } = useApp();
  const [firmId, setFirmId] = useState("");
  const [verticalId, setVerticalId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [salesOutRows, setSalesOutRows] = useState([]);
  const [purchaseOutRows, setPurchaseOutRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [exporting, setExporting] = useState("");

  const { data: verticalsData } = useApi(() => verticalsApi.list(), []);
  const verticals = Array.isArray(verticalsData) ? verticalsData : verticalsData?.rows || [];

  const { data: agentsData } = useApi(() => agentsApi.list({ limit: 100 }), []);
  const agents = Array.isArray(agentsData) ? agentsData : agentsData?.rows || [];

  const firmOptions = [
    { label: "All Firms", value: "" },
    ...firms.map((f) => ({ label: f.name, value: String(f.id) })),
  ];

  const verticalOptions = [
    { label: "All Verticals", value: "" },
    ...verticals.map((v) => ({ label: v.name, value: String(v.id) })),
  ];

  const agentOptions = [
    { label: "All Salesmen", value: "" },
    ...agents.map((a) => ({
      label: a.User?.name || a.name || `Salesman ${a.id}`,
      value: String(a.id),
    })),
  ];

  const buildParams = () => {
    const p = {};
    if (firmId) p.firm_id = firmId;
    if (verticalId) p.vertical_id = verticalId;
    if (agentId) p.agent_id = agentId;
    return p;
  };

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const salesRes = await reportsApi.salesOutstanding(buildParams());
      const unwrap = (r) => { const d = r?.data?.data ?? r?.data ?? []; return Array.isArray(d) ? d : d?.rows || []; };
      const rawSales = unwrap(salesRes);

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

      setSalesOutRows(
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

      setPurchaseOutRows([]);
      setFetched(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [firmId, verticalId, agentId]);

  const handleExport = async (type, fileName) => {
    setExporting(type);
    try {
      const params = buildParams();
      const res = type === "sales" ? await exportsApi.salesOutstanding(params) : await exportsApi.purchaseOutstanding(params);
      downloadBlob(res, fileName);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting("");
    }
  };

  const grandSalesOut = salesOutRows.reduce((s, r) => s + Number(r.outstanding || r.amount || 0), 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <p className="text-xs font-bold uppercase tracking-widest text-rose-600 mb-1">Receivables</p>
        <h1 className="font-display font-bold text-2xl text-slate-900">Outstanding Summary</h1>
        <p className="text-sm text-slate-500 mt-0.5 font-medium">Sales outstanding by firm</p>
      </motion.div>

      {/* Filter Bar */}
      <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="card-lg">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><Filter size={12} /> Filters</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
          <Select label="Firm" value={firmId} options={firmOptions} onChange={setFirmId} />
          <Select label="Vertical" value={verticalId} options={verticalOptions} onChange={setVerticalId} />
          <Select label="Salesman" value={agentId} options={agentOptions} onChange={setAgentId} />
          <button onClick={fetchReport} disabled={loading} className="btn-primary h-11 justify-center col-span-1">
            {loading ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RefreshCw size={16} />}
            {loading ? "Fetching…" : "Fetch Outstanding"}
          </button>
        </div>
      </motion.div>

      {fetched && (
        <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          className="card-lg bg-gradient-to-r from-rose-500 to-rose-600 text-white">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <AlertCircle size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-rose-100 text-xs font-bold uppercase tracking-wider">Total Sales Outstanding Balance</p>
              <p className="text-4xl font-display font-bold mt-1">{currency(grandSalesOut)}</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid gap-5 xl:grid-cols-1">
        <Panel
          title="Sales Outstanding"
          subtitle="Party-wise pending balances"
          action={
            <button onClick={() => handleExport("sales", "sales-outstanding.xlsx")}
              disabled={exporting === "sales"}
              className="btn-secondary h-9 px-3 text-xs flex items-center gap-1.5">
              {exporting === "sales" ? <span className="h-3 w-3 border border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Download size={13} />}
              Export
            </button>
          }
        >
          {loading ? (
            <div className="py-8 text-center"><div className="h-5 w-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : !fetched ? (
            <p className="py-8 text-center text-sm text-slate-400">Apply filters to load data.</p>
          ) : (
            <DataTable rows={salesOutRows} columns={["party", "firm", "branch", "vertical", "salesman", "outstanding"]} />
          )}
        </Panel>
      </div>
    </div>
  );
}
