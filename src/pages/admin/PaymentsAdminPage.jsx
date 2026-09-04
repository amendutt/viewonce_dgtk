import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Filter, Download } from "lucide-react";
import { Panel, Input, Select } from "../../components/ui/index.jsx";
import { reportsApi, firmsApi, agentsApi } from "../../api/resources";
import { useApi } from "../../api/hooks";
import * as XLSX from "xlsx";

const today = new Date().toISOString().slice(0, 10);
const monthStart = today.slice(0, 8) + "01";

// Format Date safely without timezone shifting
const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`;
    }
    const dmyMatch = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})/);
    if (dmyMatch) {
      return dateStr;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (e) {
    return dateStr;
  }
};

// Format Pay Method nicely
const formatPayMethod = (method) => {
  if (!method) return "—";
  const lower = method.toLowerCase();
  if (lower === "cheque_online_upi_bank") return "UPI/Bank/Cheque";
  if (lower === "cash") return "Cash";
  if (lower === "cheque") return "Cheque";
  return method
    .replace(/_/g, " ")
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Format amount to Indian standards with 2 decimal places
const formatAmount = (val) => {
  const num = Number(val);
  if (isNaN(num) || num === 0) return "0.00";
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export default function PaymentsAdminPage() {
  const [firmId, setFirmId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [fromDate, setFromDate] = useState(monthStart);
  const [toDate, setToDate] = useState(today);

  const { data: firmsData } = useApi(() => firmsApi.list({ limit: 100 }), []);
  const { data: agentsData } = useApi(() => agentsApi.list({ limit: 100 }), []);
  const firms = Array.isArray(firmsData) ? firmsData : firmsData?.rows || [];
  const agents = Array.isArray(agentsData) ? agentsData : agentsData?.rows || [];

  const buildParams = () => {
    const p = { from_date: fromDate, to_date: toDate };
    if (firmId) p.firm_id = firmId;
    if (agentId) p.agent_id = agentId;
    return p;
  };

  const { data, loading, refetch } = useApi(() => reportsApi.collectionDetailed(buildParams()), [firmId, agentId, fromDate, toDate]);
  
  const rows = data?.rows || [];
  const summary = data?.summary || { total_cash: 0, total_ac: 0, grand_total: 0 };

  const firmOptions = [{ label: "All Firms", value: "" }, ...firms.map((f) => ({ label: f.name, value: String(f.id) }))];
  const agentOptions = [
    { label: "All Sales Persons", value: "" },
    ...agents.map((a) => ({
      label: a.User?.name || a.name || `Sales Person ${a.id}`,
      value: String(a.id),
    })),
  ];

  const exportToExcel = () => {
    const selectedFirm = firms.find(f => String(f.id) === String(firmId));
    const selectedAgent = agents.find(a => String(a.id) === String(agentId));
    
    let titleParts = [];
    if (selectedFirm) titleParts.push(selectedFirm.name.toUpperCase());
    if (selectedAgent) titleParts.push((selectedAgent.User?.name || selectedAgent.name || "").toUpperCase());
    
    const titleText = titleParts.length > 0
      ? `(DAILY COLLECTION (${titleParts.join(" - ")}) REPORT NO.1)`
      : `(DAILY COLLECTION REPORT NO.1)`;

    const headerRow = ["SN", "DATE", "DSR NAME", "PARTY NAME", "AREA", "CASH", "A/C", "PAY METHOD", "TOTAL"];
    
    const sheetData = [];
    sheetData.push([titleText]);
    sheetData.push(headerRow);
    
    rows.forEach((row, idx) => {
      const cashVal = row.cash ? Number(row.cash) : "";
      const acVal = row.ac_amount ? Number(row.ac_amount) : "";
      const totalVal = Number(row.total || (Number(row.cash || 0) + Number(row.ac_amount || 0)));
      
      const rowData = [
        idx + 1,
        formatDate(row.date),
        row.dsr_name || "—",
        row.party_name || "—",
        row.area || "—",
        cashVal,
        acVal,
        formatPayMethod(row.pay_method),
        totalVal
      ];
      
      if (idx === 0) {
        rowData.push(
          "CASH",
          Number(summary.total_cash || 0),
          "A/C",
          Number(summary.total_ac || 0),
          "TOTAL",
          Number(summary.grand_total || 0)
        );
      }
      
      sheetData.push(rowData);
    });
    
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    
    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }
    ];
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Collection");
    const fileSuffix = selectedAgent ? `-${selectedAgent.User?.name || selectedAgent.name}` : "";
    XLSX.writeFile(workbook, `daily-collection-detailed-${fromDate}-to-${toDate}${fileSuffix}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">Admin</p>
        <h1 className="font-display font-bold text-2xl text-slate-900">Payment Records</h1>
        <p className="text-sm text-slate-500 mt-0.5">All collected payments and outstanding recoveries</p>
      </motion.div>

      <div className="card-lg">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><Filter size={12} /> Filters</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 items-end">
          <Input label="From Date" type="date" value={fromDate} onChange={setFromDate} />
          <Input label="To Date" type="date" value={toDate} onChange={setToDate} />
          <Select label="Firm" value={firmId} options={firmOptions} onChange={setFirmId} />
          <Select label="Sales Person" value={agentId} options={agentOptions} onChange={setAgentId} />
          <button onClick={refetch} disabled={loading} className="btn-secondary h-11 justify-center">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {data?.summary && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card bg-emerald-50 border border-emerald-100 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Total Cash Collection</p>
            <p className="text-2xl font-display font-bold text-emerald-700 mt-1">{formatAmount(summary.total_cash)}</p>
          </div>
          <div className="card bg-blue-50 border border-blue-100 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Total Bank/UPI/Cheque (A/C) Collection</p>
            <p className="text-2xl font-display font-bold text-blue-700 mt-1">{formatAmount(summary.total_ac)}</p>
          </div>
          <div className="card bg-brand-50 border border-brand-100 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600">Grand Total Collection</p>
            <p className="text-2xl font-display font-bold text-brand-700 mt-1">{formatAmount(summary.grand_total)}</p>
          </div>
        </div>
      )}

      <Panel 
        title="All Payments" 
        subtitle={`${rows.length} records`}
        action={
          rows.length > 0 && (
            <button
              onClick={exportToExcel}
              className="btn-secondary h-9 px-3 text-xs flex items-center gap-1.5"
            >
              <Download size={13} />
              Export Report
            </button>
          )
        }
      >
        {loading ? (
          <div className="py-10 text-center"><div className="h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No payment records for selected range.</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="text-left w-16">SN</th>
                  <th className="text-left w-28">DATE</th>
                  <th className="text-left">DSR NAME</th>
                  <th className="text-left">PARTY NAME</th>
                  <th className="text-left">AREA</th>
                  <th className="text-right w-32">CASH</th>
                  <th className="text-right w-32">A/C</th>
                  <th className="text-left w-36">PAY METHOD</th>
                  <th className="text-right w-32">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {rows.map((row, index) => {
                  const cashVal = row.cash ? Number(row.cash) : 0;
                  const acVal = row.ac_amount ? Number(row.ac_amount) : 0;
                  const totalVal = row.total ? Number(row.total) : (cashVal + acVal);

                  return (
                    <tr key={row.id || index}>
                      <td className="text-left font-semibold text-slate-500">{index + 1}</td>
                      <td className="text-left whitespace-nowrap">{formatDate(row.date)}</td>
                      <td className="text-left font-bold text-slate-800">{row.dsr_name || "—"}</td>
                      <td className="text-left">{row.party_name || "—"}</td>
                      <td className="text-left text-slate-500">{row.area || "—"}</td>
                      <td className="text-right font-mono text-emerald-600 font-semibold">
                        {cashVal > 0 ? formatAmount(cashVal) : "—"}
                      </td>
                      <td className="text-right font-mono text-blue-600 font-semibold">
                        {acVal > 0 ? formatAmount(acVal) : "—"}
                      </td>
                      <td className="text-left">
                        {row.pay_method ? (
                          <span className="badge badge-brand">
                            {formatPayMethod(row.pay_method)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="text-right font-mono font-bold text-brand-700">
                        {totalVal > 0 ? formatAmount(totalVal) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
