import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Filter, Download, RefreshCw } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Panel, DataTable, Input, Select, MultiSelect } from "../components/ui/index.jsx";
import { reportsApi, exportsApi, agentsApi, verticalsApi } from "../api/resources";
import { useApi, downloadBlob } from "../api/hooks";
import { currency } from "../utils/helpers";

const today = new Date().toISOString().slice(0, 10);
const monthStart = today.slice(0, 8) + "01";

export default function CollectionPage() {
  const { firms } = useApp();
  const [fromDate, setFromDate] = useState(monthStart);
  const [toDate, setToDate] = useState(today);
  const [firmId, setFirmId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [verticalIds, setVerticalIds] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Fetch agents and verticals
  const { data: agentsData } = useApi(() => agentsApi.list({ limit: 100 }), []);
  const { data: verticalsData } = useApi(() => verticalsApi.list(), []);

  const agents = Array.isArray(agentsData) ? agentsData : agentsData?.rows || [];
  const verticals = Array.isArray(verticalsData) ? verticalsData : verticalsData?.rows || [];

  const firmOptions = [
    { label: "All Firms", value: "" },
    ...firms.map((f) => ({ label: f.name, value: String(f.id) })),
  ];

  const agentOptions = [
    { label: "All Agents", value: "" },
    ...agents.map((a) => ({
      label: a.User?.name || a.name || `Agent ${a.id}`,
      value: String(a.id),
    })),
  ];

  const verticalOptions = verticals.map((v) => ({ label: v.name, value: String(v.id) }));

  const buildParams = () => {
    const p = { from_date: fromDate, to_date: toDate };
    if (firmId) p.firm_id = firmId;
    if (agentId) p.agent_id = agentId;
    if (verticalIds.length > 0) p.vertical_id = verticalIds.join(",");
    return p;
  };

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportsApi.dailyCollection(buildParams());
      const d = res?.data?.data ?? res?.data ?? [];
      const dataArray = Array.isArray(d) ? d : d?.rows || [];
      
      const result = [];
      const onlineUpiGroups = {};
      dataArray.forEach((row) => {
        const mode = String(row.payment_mode || "").trim().toLowerCase();
        const isOnlineOrUpi = mode === "online" || mode === "upi";
        if (isOnlineOrUpi) {
          const key = `${row.salesman || ""}|${row.party_id || row.party_name || ""}|${row.vertical || ""}`;
          if (onlineUpiGroups[key] !== undefined) {
            onlineUpiGroups[key].amount = Number(onlineUpiGroups[key].amount || 0) + Number(row.amount || 0);
          } else {
            const newRow = {
              ...row,
              payment_mode: "Online/UPI",
              amount: Number(row.amount || 0),
            };
            onlineUpiGroups[key] = newRow;
            result.push(newRow);
          }
        } else {
          result.push({ ...row });
        }
      });

      setRows(result);
      setFetched(true);
    } catch (e) {
      console.error("Collection fetch failed:", e);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, firmId, agentId, verticalIds]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportsApi.collection(buildParams());
      downloadBlob(res, "daily-collection-report.xlsx");
    } catch (e) {
      console.error("Export failed:", e);
    } finally {
      setExporting(false);
    }
  };

  const totals = rows.reduce(
    (acc, r) => {
      const mode = String(r.payment_mode || "").toLowerCase();
      const amt = Number(r.amount || 0);
      if (mode === "cash") {
        acc.cash += amt;
      } else if (mode === "cheque") {
        acc.cheque += amt;
      } else if (mode === "online/upi" || mode === "online" || mode === "upi") {
        acc.onlineUpi += amt;
      } else if (mode === "advance") {
        acc.advance += amt;
      } else {
        acc.onlineUpi += amt;
      }
      acc.grand += amt;
      return acc;
    },
    { cash: 0, cheque: 0, onlineUpi: 0, advance: 0, grand: 0 }
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Finance</p>
          <h1 className="font-display font-bold text-2xl text-slate-900">Daily Collection Report</h1>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">Agent-wise payment collection summary</p>
        </div>
      </motion.div>

      {/* Filter Bar */}
      <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="card-lg">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
          <Filter size={12} /> Filters
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 items-end">
          <Input label="From Date" type="date" value={fromDate} onChange={setFromDate} />
          <Input label="To Date" type="date" value={toDate} onChange={setToDate} />
          <Select label="Firm" value={firmId} options={firmOptions} onChange={setFirmId} />
          <Select label="Agent" value={agentId} options={agentOptions} onChange={setAgentId} />
          <MultiSelect label="Verticals" selectedValues={verticalIds} options={verticalOptions} onChange={setVerticalIds} />
          <button onClick={fetchReport} disabled={loading} className="btn-primary h-11 justify-center">
            {loading ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RefreshCw size={16} />}
            {loading ? "Fetching…" : "Fetch Report"}
          </button>
        </div>
      </motion.div>

      {/* Summary Banner */}
      {fetched && (
        <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          className="card-lg bg-gradient-to-r from-brand-600 to-brand-700 text-white">
          <p className="text-brand-100 text-xs font-bold uppercase tracking-wider">Total Collections</p>
          <p className="text-4xl font-display font-bold mt-2">{currency(totals.grand)}</p>
          <div className="mt-3 flex flex-wrap gap-6">
            <div><p className="text-brand-200 text-xs">Cash</p><p className="font-bold">{currency(totals.cash)}</p></div>
            <div><p className="text-brand-200 text-xs">Cheque</p><p className="font-bold">{currency(totals.cheque)}</p></div>
            <div><p className="text-brand-200 text-xs">Online / UPI</p><p className="font-bold">{currency(totals.onlineUpi)}</p></div>
            <div><p className="text-brand-200 text-xs">Records</p><p className="font-bold">{rows.length}</p></div>
          </div>
        </motion.div>
      )}

      <Panel
        title="Collection Breakdown"
        subtitle="Transaction-level collections received by salesperson"
        action={
          <button onClick={handleExport} disabled={exporting}
            className="btn-secondary h-9 px-3 text-xs flex items-center gap-1.5">
            {exporting ? <span className="h-3 w-3 border border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Download size={13} />}
            Export Collection
          </button>
        }
      >
        {loading ? (
          <div className="py-12 text-center">
            <div className="h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : !fetched ? (
          <p className="py-10 text-center text-sm text-slate-400">Select filters and click Fetch Report.</p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No collection records found.</p>
        ) : (
          <DataTable
            rows={rows}
            columns={["salesman", "vertical", "party_name", "payment_mode", "amount", "remaining_balance"]}
          />
        )}
      </Panel>
    </div>
  );
}
