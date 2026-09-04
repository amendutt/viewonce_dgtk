import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Filter } from "lucide-react";
import { Panel, DataTable, Input, Select } from "../../components/ui/index.jsx";
import { eodApi, firmsApi, verticalsApi } from "../../api/resources";
import { useApi } from "../../api/hooks";

const today = new Date().toISOString().slice(0, 10);
const monthStart = today.slice(0, 8) + "01";

export default function EodReportsAdminPage() {
  const [firmId, setFirmId] = useState("");
  const [verticalId, setVerticalId] = useState("");
  const [fromDate, setFromDate] = useState(monthStart);
  const [toDate, setToDate] = useState(today);

  const { data: firmsData } = useApi(() => firmsApi.list({ limit: 100 }), []);
  const firms = Array.isArray(firmsData) ? firmsData : firmsData?.rows || [];

  const { data: verticalsData } = useApi(() => verticalsApi.list(), []);
  const verticals = Array.isArray(verticalsData) ? verticalsData : verticalsData?.rows || [];

  const buildParams = () => {
    const p = { page: 1, limit: 50, from_date: fromDate, to_date: toDate };
    if (firmId) p.firm_id = firmId;
    if (verticalId) p.vertical_id = verticalId;
    return p;
  };

  const { data, loading, refetch } = useApi(() => eodApi.list(buildParams()), [firmId, verticalId, fromDate, toDate]);
  const rawRows = Array.isArray(data) ? data : data?.rows || [];
  const rows = rawRows.map((r) => ({
    ...r,
    date: r.report_date || (r.createdAt ? r.createdAt.slice(0, 10) : ""),
    agent_name: r.SalesAgent?.User?.name || "—",
    firm: r.Firm?.name || "—",
    branch: r.Branch?.name || "—",
    vertical: r.Vertical ? r.Vertical.name : "N/A",
    cash_sales: Number(r.cash_sales || 0),
    credit_sales: Number(r.credit_sales || 0),
    advance: Number(r.advance_collection || 0),
    cash_recovery: Number(r.cash_recovery || 0),
    cheque_recovery: Number(r.cheque_online_upi_bank_recovery || 0),
    outstanding: Number(r.outstanding_amount || r.pending_amount || 0),
  }));

  const firmOptions = [{ label: "All Firms", value: "" }, ...firms.map((f) => ({ label: f.name, value: String(f.id) }))];
  const verticalOptions = [{ label: "All Verticals", value: "" }, ...verticals.map((v) => ({ label: v.name, value: String(v.id) }))];

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <p className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-1">Admin</p>
        <h1 className="font-display font-bold text-2xl text-slate-900">EOD Reports</h1>
        <p className="text-sm text-slate-500 mt-0.5">End-of-day submissions from sales agents</p>
      </motion.div>

      <div className="card-lg">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><Filter size={12} /> Filters</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
          <Input label="From Date" type="date" value={fromDate} onChange={setFromDate} />
          <Input label="To Date" type="date" value={toDate} onChange={setToDate} />
          <Select label="Firm" value={firmId} options={firmOptions} onChange={setFirmId} />
          <Select label="Vertical" value={verticalId} options={verticalOptions} onChange={setVerticalId} />
          <button onClick={refetch} disabled={loading} className="btn-secondary h-11 justify-center">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <Panel title="EOD Report Submissions" subtitle={`${rows.length} records`}>
        {loading ? (
          <div className="py-10 text-center"><div className="h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No EOD reports found for selected range.</p>
        ) : (
          <DataTable
            rows={rows}
            columns={[
              "date", "agent_name", "firm", "branch", "vertical",
              "cash_sales", "credit_sales", "advance",
              "cash_recovery", "cheque_recovery",
              "outstanding", "total_orders", "remarks",
            ]}
          />
        )}
      </Panel>
    </div>
  );
}
