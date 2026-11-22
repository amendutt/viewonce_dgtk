import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  RefreshCw,
  Download,
  Filter,
  FileText,
  Users,
  Eye,
  X,
  Search,
  ShoppingBag,
  Building2,
  Calendar,
  CheckCircle2
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Panel, DataTable, Select } from "../components/ui/index.jsx";
import { reportsApi, exportsApi, verticalsApi, agentsApi } from "../api/resources";
import { useApi, downloadBlob } from "../api/hooks";
import { currency, downloadExcel } from "../utils/helpers";

export default function OutstandingPage() {
  const { firms } = useApp();
  const [firmId, setFirmId] = useState("");
  const [verticalId, setVerticalId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [salesOutRows, setSalesOutRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [exporting, setExporting] = useState("");
  const [viewMode, setViewMode] = useState("orders"); // "orders" | "parties"
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParty, setSelectedParty] = useState(null);

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
        rawSales.map((row, idx) => {
          const loc = getSalesmanFirmBranch(row);
          return {
            ...row,
            id: row.id || `order-${idx}-${row.order_number || idx}`,
            order_number: row.order_number || row.orderNumber || `SO-${row.id || idx + 1}`,
            order_date: row.order_date || row.orderDate || "-",
            party: row.party || row.party_name || "Unknown Party",
            firm: loc.firm || "-",
            branch: loc.branch || "-",
            vertical: row.vertical || "-",
            salesman: row.salesman || row.salesman_name || row.agent_name || "-",
            total_amount: Number(row.total_amount || 0),
            advance_amount: Number(row.advance_amount || 0),
            outstanding: Number(row.outstanding_amount || row.pending_amount || row.outstanding || 0),
          };
        })
      );

      setFetched(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [firmId, verticalId, agentId]);

  // Group orders by party
  const partyGroups = useMemo(() => {
    const map = {};
    for (const row of salesOutRows) {
      const key = (row.party || "Unknown").trim().toLowerCase();
      if (!map[key]) {
        map[key] = {
          id: `party-${key}`,
          party: row.party,
          firm: row.firm,
          branch: row.branch,
          vertical: row.vertical,
          salesman: row.salesman,
          total_amount: 0,
          advance_amount: 0,
          outstanding: 0,
          orders: [],
        };
      }
      map[key].total_amount += Number(row.total_amount || 0);
      map[key].advance_amount += Number(row.advance_amount || 0);
      map[key].outstanding += Number(row.outstanding || 0);
      map[key].orders.push(row);
    }
    return Object.values(map).sort((a, b) => b.outstanding - a.outstanding);
  }, [salesOutRows]);

  // Filtered rows for Search
  const filteredOrderRows = useMemo(() => {
    if (!searchTerm.trim()) return salesOutRows;
    const term = searchTerm.toLowerCase();
    return salesOutRows.filter(
      (r) =>
        r.party?.toLowerCase().includes(term) ||
        r.order_number?.toLowerCase().includes(term) ||
        r.salesman?.toLowerCase().includes(term) ||
        r.vertical?.toLowerCase().includes(term)
    );
  }, [salesOutRows, searchTerm]);

  const filteredPartyRows = useMemo(() => {
    if (!searchTerm.trim()) return partyGroups;
    const term = searchTerm.toLowerCase();
    return partyGroups.filter(
      (p) =>
        p.party?.toLowerCase().includes(term) ||
        p.salesman?.toLowerCase().includes(term) ||
        p.vertical?.toLowerCase().includes(term) ||
        p.orders.some((o) => o.order_number?.toLowerCase().includes(term))
    );
  }, [partyGroups, searchTerm]);

  const handleExport = async () => {
    setExporting("excel");
    try {
      if (viewMode === "orders") {
        const rowsToExport = filteredOrderRows.map((r) => ({
          "Order Number": r.order_number || "-",
          "Order Date": r.order_date || "-",
          "Party Name": r.party || "-",
          "Firm": r.firm || "-",
          "Branch": r.branch || "-",
          "Vertical": r.vertical || "-",
          "Salesman": r.salesman || "-",
          "Total Amount (₹)": Number(r.total_amount || 0),
          "Advance Paid (₹)": Number(r.advance_amount || 0),
          "Pending Balance (₹)": Number(r.outstanding || 0),
        }));
        downloadExcel("sales-outstanding-by-orders.xlsx", rowsToExport);
      } else {
        const rowsToExport = filteredPartyRows.map((p) => ({
          "Party Name": p.party || "-",
          "Firm": p.firm || "-",
          "Branch": p.branch || "-",
          "Vertical": p.vertical || "-",
          "Salesman": p.salesman || "-",
          "Total Orders": p.orders.length,
          "Order Numbers": p.orders.map((o) => o.order_number).filter(Boolean).join(", "),
          "Total Amount (₹)": Number(p.total_amount || 0),
          "Advance Paid (₹)": Number(p.advance_amount || 0),
          "Pending Balance (₹)": Number(p.outstanding || 0),
        }));
        downloadExcel("sales-outstanding-by-party.xlsx", rowsToExport);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setExporting("");
    }
  };

  const grandSalesOut = salesOutRows.reduce((s, r) => s + Number(r.outstanding || 0), 0);
  const totalOrdersCount = salesOutRows.length;
  const totalPartiesCount = partyGroups.length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <p className="text-xs font-bold uppercase tracking-widest text-rose-600 mb-1">Receivables</p>
        <h1 className="font-display font-bold text-2xl text-slate-900">Outstanding Summary</h1>
        <p className="text-sm text-slate-500 mt-0.5 font-medium">Sales outstanding and sales order breakdown</p>
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
          className="grid gap-4 sm:grid-cols-3">
          <div className="card-lg bg-gradient-to-r from-rose-500 to-rose-600 text-white sm:col-span-2 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <AlertCircle size={24} className="text-white" />
            </div>
            <div>
              <p className="text-rose-100 text-xs font-bold uppercase tracking-wider">Total Sales Outstanding Balance</p>
              <p className="text-3xl sm:text-4xl font-display font-bold mt-0.5">{currency(grandSalesOut)}</p>
            </div>
          </div>
          <div className="card-lg bg-white border border-slate-100 flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Breakdown</p>
            <div className="flex items-center gap-4 mt-2">
              <div>
                <p className="text-2xl font-bold font-display text-slate-800">{totalPartiesCount}</p>
                <p className="text-xs text-slate-400 font-medium">Parties with Dues</p>
              </div>
              <div className="h-8 w-[1px] bg-slate-200" />
              <div>
                <p className="text-2xl font-bold font-display text-brand-600">{totalOrdersCount}</p>
                <p className="text-xs text-slate-400 font-medium">Pending Sales Orders</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Outstanding Panel */}
      <div className="grid gap-5 xl:grid-cols-1">
        <Panel
          title="Sales Outstanding"
          subtitle={
            viewMode === "orders"
              ? "Order-wise pending balances showing exact sales orders"
              : "Party-wise pending balances with sales order breakdown"
          }
          action={
            <div className="flex items-center gap-2 flex-wrap">
              {/* View Switcher Tabs */}
              <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setViewMode("orders")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                    viewMode === "orders"
                      ? "bg-white text-brand-600 font-bold shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FileText size={13} />
                  By Orders ({totalOrdersCount})
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("parties")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                    viewMode === "parties"
                      ? "bg-white text-brand-600 font-bold shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Users size={13} />
                  By Party ({totalPartiesCount})
                </button>
              </div>

              {/* Export Button */}
              {fetched && (
                <button
                  onClick={handleExport}
                  disabled={exporting !== ""}
                  className="btn-secondary h-9 px-3 text-xs flex items-center gap-1.5"
                >
                  {exporting ? (
                    <span className="h-3 w-3 border border-slate-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download size={13} />
                  )}
                  Export {viewMode === "orders" ? "Orders" : "Parties"}
                </button>
              )}
            </div>
          }
        >
          {loading ? (
            <div className="py-12 text-center">
              <div className="h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400 mt-2">Loading sales outstanding data…</p>
            </div>
          ) : !fetched ? (
            <p className="py-10 text-center text-sm text-slate-400">Apply filters to load data.</p>
          ) : salesOutRows.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No outstanding records found for selected filters.</p>
          ) : (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by party, order #, salesman, vertical…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-9 h-9 text-xs w-full"
                />
              </div>

              {/* View 1: Detailed Order-Wise Table */}
              {viewMode === "orders" && (
                <DataTable
                  rows={filteredOrderRows}
                  columns={[
                    "order_number",
                    "order_date",
                    "party",
                    "firm",
                    "branch",
                    "vertical",
                    "salesman",
                    "total_amount",
                    "advance_amount",
                    "outstanding",
                  ]}
                />
              )}

              {/* View 2: Party-Wise Table with Sales Orders Breakdown Button */}
              {viewMode === "parties" && (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Party</th>
                        <th>Firm</th>
                        <th>Branch</th>
                        <th>Vertical</th>
                        <th>Salesman</th>
                        <th>Orders</th>
                        <th>Total Amount</th>
                        <th>Advance Paid</th>
                        <th>Pending Balance</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 bg-white">
                      {filteredPartyRows.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-10 text-center text-slate-400 text-sm">
                            No parties match search criteria
                          </td>
                        </tr>
                      ) : (
                        filteredPartyRows.map((partyItem) => (
                          <tr key={partyItem.id} className="hover:bg-brand-50/40 transition-colors">
                            <td className="font-semibold text-slate-900">{partyItem.party}</td>
                            <td>{partyItem.firm || "-"}</td>
                            <td>{partyItem.branch || "-"}</td>
                            <td>
                              <span className="badge badge-brand">{partyItem.vertical || "-"}</span>
                            </td>
                            <td>{partyItem.salesman || "-"}</td>
                            <td>
                              <span className="inline-flex items-center gap-1 font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full text-xs border border-brand-100">
                                {partyItem.orders.length} {partyItem.orders.length === 1 ? "Order" : "Orders"}
                              </span>
                            </td>
                            <td>{currency(partyItem.total_amount)}</td>
                            <td>{currency(partyItem.advance_amount)}</td>
                            <td className="font-bold text-rose-600">{currency(partyItem.outstanding)}</td>
                            <td className="text-right">
                              <button
                                onClick={() => setSelectedParty(partyItem)}
                                className="btn-secondary h-8 px-2.5 text-xs text-brand-600 hover:text-brand-700 font-semibold inline-flex items-center gap-1 shadow-sm"
                              >
                                <Eye size={13} />
                                View Orders ({partyItem.orders.length})
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </Panel>
      </div>

      {/* Modal: Sales Orders Contributing to Party Pending Balance */}
      <AnimatePresence>
        {selectedParty && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedParty(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50/80">
                <div className="flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center shadow-sm">
                    <ShoppingBag size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-display font-bold text-xl text-slate-900">
                        {selectedParty.party}
                      </h3>
                      {selectedParty.vertical && (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full border text-xs font-bold bg-blue-50 text-blue-700 border-blue-200">
                          {selectedParty.vertical}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 font-medium flex items-center gap-2 mt-1">
                      <span>Salesman: <strong className="text-slate-900">{selectedParty.salesman}</strong></span>
                      {selectedParty.firm && <span>· Firm: <strong className="text-slate-900">{selectedParty.firm}</strong></span>}
                      {selectedParty.branch && <span>· Branch: <strong className="text-slate-900">{selectedParty.branch}</strong></span>}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedParty(null)}
                  className="h-9 w-9 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors shadow-sm"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 p-5 bg-slate-50/50 border-b border-slate-200">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Orders</p>
                  <p className="text-2xl font-bold font-display text-slate-900 mt-1">{selectedParty.orders.length}</p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Invoiced</p>
                  <p className="text-2xl font-bold font-display text-slate-900 mt-1">{currency(selectedParty.total_amount)}</p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-emerald-200/80 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Advance Paid</p>
                  <p className="text-2xl font-bold font-display text-emerald-600 mt-1">{currency(selectedParty.advance_amount)}</p>
                </div>
                <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-rose-700">Net Pending Balance</p>
                  <p className="text-2xl font-bold font-display text-rose-600 mt-1">{currency(selectedParty.outstanding)}</p>
                </div>
              </div>

              {/* Sales Orders Table */}
              <div className="p-6 overflow-y-auto flex-1 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Contributing Sales Orders ({selectedParty.orders.length})
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    This party's pending balance is derived from the sales orders below:
                  </p>
                </div>

                <div className="table-container border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
                  <table className="w-full text-left text-sm divide-y divide-slate-200">
                    <thead className="bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 whitespace-nowrap">Order #</th>
                        <th className="px-4 py-3 whitespace-nowrap">Order Date</th>
                        <th className="px-4 py-3 whitespace-nowrap">Vertical</th>
                        <th className="px-4 py-3 whitespace-nowrap">Salesman</th>
                        <th className="px-4 py-3 whitespace-nowrap text-right">Order Total</th>
                        <th className="px-4 py-3 whitespace-nowrap text-right">Advance Paid</th>
                        <th className="px-4 py-3 whitespace-nowrap text-right">Pending Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {selectedParty.orders.map((ord, idx) => {
                        const vert = String(ord.vertical || "").toUpperCase();
                        const vertBadgeClass = vert.includes("TYRE")
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : vert.includes("BATTERY")
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : vert.includes("SOLAR")
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : vert.includes("HAVELL")
                          ? "bg-violet-50 text-violet-700 border-violet-200"
                          : vert.includes("LUBE")
                          ? "bg-orange-50 text-orange-700 border-orange-200"
                          : vert.includes("GOV")
                          ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                          : "bg-slate-100 text-slate-700 border-slate-200";

                        return (
                          <tr key={ord.id || idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className="font-mono font-semibold text-brand-700 bg-brand-50/80 px-2.5 py-1 rounded-md text-xs border border-brand-200">
                                {ord.order_number || `SO-${idx + 1}`}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-slate-700 font-medium text-xs">
                              {ord.order_date || "-"}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full border text-xs font-semibold ${vertBadgeClass}`}>
                                {ord.vertical || "-"}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-slate-800 font-medium text-xs">
                              {ord.salesman || "-"}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap font-semibold text-slate-900 text-right">
                              {currency(ord.total_amount)}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-emerald-700 font-semibold text-right">
                              {currency(ord.advance_amount)}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap font-bold text-rose-600 text-right">
                              {currency(ord.outstanding)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const exportData = selectedParty.orders.map((o) => ({
                      "Order Number": o.order_number || "-",
                      "Order Date": o.order_date || "-",
                      "Party Name": selectedParty.party,
                      "Salesman": o.salesman || "-",
                      "Vertical": o.vertical || "-",
                      "Total Amount (₹)": Number(o.total_amount || 0),
                      "Advance Paid (₹)": Number(o.advance_amount || 0),
                      "Pending Balance (₹)": Number(o.outstanding || 0),
                    }));
                    downloadExcel(`${selectedParty.party}-sales-orders.xlsx`, exportData);
                  }}
                  className="btn-secondary h-10 px-4 text-xs font-semibold flex items-center gap-2 shadow-sm"
                >
                  <Download size={14} />
                  Export These Orders
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedParty(null)}
                  className="btn-primary h-10 px-5 text-xs font-semibold shadow-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
