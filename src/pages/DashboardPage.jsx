import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, BadgeIndianRupee, Building2, FileSpreadsheet,
  RefreshCw, Route, Target, TrendingUp, Wallet,
  ShoppingCart, Clock, CheckCircle, Users, BarChart2, ShieldAlert
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { MetricCard, Panel, DataTable } from "../components/ui/index.jsx";
import { currency, formatPercent } from "../utils/helpers";
import { dashboardApi } from "../api/resources";

const targetColors = {
  brand:   { bar: "bg-brand-600",   text: "text-brand-700",   bg: "bg-brand-50"   },
  accent:  { bar: "bg-accent-500",  text: "text-accent-600",  bg: "bg-accent-50"  },
  emerald: { bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  violet:  { bar: "bg-violet-500",  text: "text-violet-700",  bg: "bg-violet-50"  },
  rose:    { bar: "bg-rose-500",    text: "text-rose-700",    bg: "bg-rose-50"    },
};
const COLOR_CYCLE = ["brand", "accent", "emerald", "violet", "rose"];

function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="h-8 w-8 rounded-xl bg-slate-100 mb-4" />
      <div className="h-3 w-20 bg-slate-100 rounded mb-2" />
      <div className="h-6 w-28 bg-slate-100 rounded" />
    </div>
  );
}

// ─── Custom Donut / Pie Chart Component ──────────────────────────────────────
function DonutChart({ title, data, valueKey = "value", labelKey = "label", colorScale }) {
  const total = data.reduce((sum, item) => sum + Number(item[valueKey] || 0), 0);
  let currentOffset = 0;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col p-5 bg-slate-50/50 rounded-2xl border border-slate-100 h-full justify-between">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">{title}</h3>
      {total === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">No data available</div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative h-32 w-32 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
              {data.map((item, idx) => {
                const val = Number(item[valueKey] || 0);
                const pct = val / total;
                const dashArray = `${pct * circumference} ${circumference}`;
                const dashOffset = -currentOffset;
                currentOffset += pct * circumference;
                const color = colorScale[idx % colorScale.length] || "#cbd5e1";

                return (
                  <circle
                    key={idx}
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    stroke={color}
                    strokeWidth="12"
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Total</span>
              <span className="text-xs font-bold text-slate-800">
                {total > 10000 ? currency(total) : total}
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-2 min-w-0 w-full">
            {data.map((item, idx) => {
              const val = Number(item[valueKey] || 0);
              const pct = ((val / total) * 100).toFixed(1);
              const color = colorScale[idx % colorScale.length] || "#cbd5e1";
              return (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-semibold text-slate-700 truncate">{item[labelKey]}</span>
                  </div>
                  <div className="text-right font-medium text-slate-500 pl-2 shrink-0">
                    <span>{pct}%</span>
                    <span className="text-slate-300 mx-1">·</span>
                    <span className="font-bold text-slate-700">{val > 1000 ? currency(val) : val}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const {
    metrics, verticalRows, dashboardTargets, salesOutstandingData,
    loading, refetchDashboard, activeFirm, selectedFirmId,
  } = useApp();

  const isFiltered = Boolean(selectedFirmId);

  // Tab View state: 'overall', 'pie-chart', 'firm-wise'
  const [activeTab, setActiveTab] = useState("overall");

  // Extra dashboard state
  const [pieChartData, setPieChartData] = useState(null);
  const [firmWiseData, setFirmWiseData] = useState([]);
  const [extraLoading, setExtraLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Heartbeat tracking refs
  const lastCountsRef = useRef({ pending_orders_count: null, pending_parties_count: null, active_agents_count: null });

  // Load Extra Dashboard data
  const loadExtraData = useCallback(async () => {
    setExtraLoading(true);
    try {
      const params = selectedFirmId ? { firm_id: selectedFirmId } : {};
      const [pieRes, firmRes] = await Promise.all([
        dashboardApi.pieChart(params).catch(() => null),
        dashboardApi.firmWise(params).catch(() => null),
      ]);
      if (pieRes?.data?.success) {
        setPieChartData(pieRes.data.data);
      }
      if (firmRes?.data?.success) {
        setFirmWiseData(firmRes.data.data?.firms || []);
      }
      setLastRefreshed(new Date());
    } catch (e) {
      console.error("Failed to load extra dashboard views:", e);
    } finally {
      setExtraLoading(false);
    }
  }, [selectedFirmId]);

  // Initial load of extras
  useEffect(() => {
    loadExtraData();
  }, [loadExtraData]);

  // 1. Hard reload of dashboard metrics every 30 minutes
  useEffect(() => {
    const hardRefreshTimer = setInterval(() => {
      console.log("30-minute auto-refresh triggered...");
      refetchDashboard();
      loadExtraData();
    }, 30 * 60 * 1000);

    return () => clearInterval(hardRefreshTimer);
  }, [refetchDashboard, loadExtraData]);

  // 2. Poll heartbeat endpoint every 30 seconds
  useEffect(() => {
    const pollHeartbeat = async () => {
      try {
        const params = selectedFirmId ? { firm_id: selectedFirmId } : {};
        const res = await dashboardApi.refreshPoll(params);
        if (res.data?.success && res.data?.data) {
          const data = res.data.data;
          const { pending_orders_count, pending_parties_count, active_agents_count } = data;

          if (lastCountsRef.current.pending_orders_count !== null) {
            const hasChanged =
              lastCountsRef.current.pending_orders_count !== pending_orders_count ||
              lastCountsRef.current.pending_parties_count !== pending_parties_count ||
              lastCountsRef.current.active_agents_count !== active_agents_count;

            if (hasChanged) {
              console.log("Heartbeat detected change! Refreshing dashboard metrics...");
              refetchDashboard();
              loadExtraData();
            }
          }

          // Sync local ref
          lastCountsRef.current = { pending_orders_count, pending_parties_count, active_agents_count };
        }
      } catch (err) {
        console.error("Heartbeat poll error:", err);
      }
    };

    pollHeartbeat();
    const heartbeatTimer = setInterval(pollHeartbeat, 30000);

    return () => clearInterval(heartbeatTimer);
  }, [selectedFirmId, refetchDashboard, loadExtraData]);

  const handleManualRefresh = () => {
    refetchDashboard();
    loadExtraData();
  };

  const financialCards = [
    { icon: BadgeIndianRupee, label: "Total Revenue",          value: currency(metrics.total),               tone: "brand",  trend: isFiltered ? activeFirm : "All branches combined" },
    { icon: Building2,        label: "Cash Sales",             value: currency(metrics.cash),                tone: "emerald" },
    { icon: Wallet,           label: "Online Sales",           value: currency(metrics.online),              tone: "cyan"    },
    { icon: FileSpreadsheet,  label: "Credit Sales",           value: currency(metrics.credit),              tone: "amber"   },
    { icon: Route,            label: "Sales Outstanding",      value: currency(metrics.salesOutstanding),    tone: "rose"    },
  ];

  const operationsCards = [
    { icon: ShoppingCart, label: "Total Orders",    value: String(metrics.totalOrders),    tone: "violet"  },
    { icon: Clock,        label: "Pending Orders",  value: String(metrics.pendingOrders),  tone: "amber"   },
    { icon: CheckCircle,  label: "Approved Orders", value: String(metrics.approvedOrders), tone: "emerald" },
    { icon: Users,        label: "Active Agents",   value: String(metrics.activeAgents),   tone: "cyan"    },
  ];

  const sortedDashboardTargets = [...dashboardTargets].sort((a, b) => {
    const timeA = new Date(a.createdAt || a.created_at || a.period_start || 0).getTime();
    const timeB = new Date(b.createdAt || b.created_at || b.period_start || 0).getTime();
    return timeB - timeA;
  });
  const targets = sortedDashboardTargets.map((t, i) => ({
    branch:   t.branch_name || t.branch || t.name || `Branch ${i + 1}`,
    target:   Number(t.target_amount || t.target || 0),
    achieved: Number(t.achieved_amount || t.achieved || 0),
    color:    COLOR_CYCLE[i % COLOR_CYCLE.length],
  }));

  const formattedSalesOutstanding = (salesOutstandingData || []).map((row, i) => ({
    id:                i,
    orderNumber:       row.order_number  || row.id  || "-",
    orderDate:         row.order_date    || row.date || "-",
    party:             row.party         || row.party_name  || "-",
    salesman:          row.salesman      || row.agent_name  || "-",
    totalAmount:       Number(row.total_amount      || row.total       || 0),
    advanceAmount:     Number(row.advance_amount    || row.advance     || 0),
    outstandingAmount: Number(row.outstanding_amount || row.outstanding || 0),
  })).filter((r) => r.outstandingAmount > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Overview</p>
          <h1 className="font-display font-bold text-2xl text-slate-900">Sales Operations Dashboard</h1>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <p className="text-sm text-slate-500 font-medium">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <span className="text-slate-300">|</span>
            <p className="text-xs text-slate-400 font-semibold flex items-center gap-1">
              <Clock size={11} /> Auto-refresh active · Updated {lastRefreshed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
            <AnimatePresence>
              {isFiltered && (
                <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  className="badge badge-brand text-[11px]">
                  {activeFirm}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* View Selection & Manual Refresh */}
        <div className="flex items-center gap-3 self-end md:self-auto flex-wrap">
          {/* Tab buttons */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("overall")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "overall" ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Overall Summary
            </button>
            <button
              onClick={() => setActiveTab("pie-chart")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "pie-chart" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Pie Charts
            </button>
            <button
              onClick={() => setActiveTab("firm-wise")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "firm-wise" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Firm Breakdown
            </button>
          </div>

          <button onClick={handleManualRefresh} disabled={loading || extraLoading} className="btn-secondary h-9 px-3 flex items-center gap-2">
            <RefreshCw size={14} className={loading || extraLoading ? "animate-spin" : ""} />
            {loading || extraLoading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </motion.div>

      {/* Main View Area */}
      <AnimatePresence mode="wait">
        {activeTab === "overall" && (
          <motion.div
            key="overall"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Financial Overview */}
            <div className="space-y-3">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Financial Performance</h2>
              <div className="grid gap-4 grid-cols-2 xl:grid-cols-5 md:grid-cols-3">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
                ) : (
                  financialCards.map((card, i) => <MetricCard key={card.label} {...card} index={i} />)
                )}
              </div>
            </div>

            {/* Operations */}
            <div className="space-y-3">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Operations & Agents</h2>
              <div className="grid gap-4 grid-cols-2 xl:grid-cols-4 md:grid-cols-2">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                ) : (
                  operationsCards.map((card, i) => <MetricCard key={card.label} {...card} index={i + 6} />)
                )}
              </div>
            </div>

            {/* Branch Targets + Verticals */}
            <div className="grid gap-5 xl:grid-cols-2">
              <Panel
                title="Branch Target Tracking"
                subtitle={isFiltered ? `${activeFirm} — Monthly achievement` : "Monthly turnover achievement"}
                action={<span className="badge badge-brand"><TrendingUp size={11} /> Live</span>}
              >
                {loading ? (
                  <div className="space-y-5 animate-pulse">
                    {[1, 2, 3].map((n) => (
                      <div key={n}>
                        <div className="flex justify-between mb-2"><div className="h-3 w-24 bg-slate-100 rounded" /><div className="h-3 w-32 bg-slate-100 rounded" /></div>
                        <div className="h-2 bg-slate-100 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : targets.length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">No target data available</p>
                ) : (
                  <div className="space-y-5">
                    {targets.map((target, i) => {
                      const pct = formatPercent(target.achieved, target.target);
                      const colors = targetColors[target.color] || targetColors.brand;
                      return (
                        <motion.div key={target.branch + i} initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${colors.bar}`} />
                              <span className="text-sm font-semibold text-slate-800">{target.branch}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <span className="font-semibold text-slate-600">{currency(target.achieved)}</span>
                              <span className="text-slate-300">/</span>
                              <span className="font-medium text-slate-400">{currency(target.target)}</span>
                              <span className={`badge text-[10px] font-bold ${colors.bg} ${colors.text}`}>{pct}%</span>
                            </div>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(pct, 100)}%` }}
                              transition={{ delay: i * 0.1 + 0.3, duration: 0.8, ease: "easeOut" }}
                              className={`h-full rounded-full ${colors.bar}`}
                            />
                          </div>
                          <p className="mt-1 text-xs text-slate-400 font-medium">
                            Remaining {currency(Math.max(target.target - target.achieved, 0))}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </Panel>

              <Panel
                title="Vertical Performance"
                subtitle={isFiltered ? `${activeFirm} — By product category` : "Sales breakdown by product category"}
              >
                {loading ? (
                  <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                        <div className="h-9 w-9 rounded-xl bg-slate-100" />
                        <div className="flex-1"><div className="h-3 w-24 bg-slate-100 rounded mb-1" /><div className="h-2 w-16 bg-slate-100 rounded" /></div>
                        <div className="h-4 w-16 bg-slate-100 rounded" />
                      </div>
                    ))}
                  </div>
                ) : verticalRows.length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">No vertical data available</p>
                ) : (
                  <div className="space-y-3">
                    {verticalRows.map((row, i) => {
                      const total = Number(row.cash || 0) + Number(row.wallet || 0) + Number(row.credit || 0);
                      return (
                        <motion.div key={row.vertical + i} initial={{ x: 16, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-brand-50/60 transition-colors group">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:border-brand-200 transition-colors">
                              <span className="text-xs font-bold text-slate-700">{row.vertical?.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{row.vertical}</p>
                              <p className="text-xs text-slate-400">{row.totalQty} units sold</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-900">{currency(total)}</p>
                            {Number(row.outstanding) > 0 && (
                              <p className="text-xs text-rose-500 font-semibold">{currency(row.outstanding)} due</p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </Panel>
            </div>

            {/* Sales Outstanding Report */}
            <Panel
              title="Sales Outstanding Report"
              subtitle={isFiltered ? `${activeFirm} — Pending customer balances` : "All firms — Recent outstanding balances"}
            >
              {loading ? (
                <div className="py-10 text-center">
                  <div className="h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-400 mt-2">Fetching{isFiltered ? ` ${activeFirm}` : ""} data…</p>
                </div>
              ) : formattedSalesOutstanding.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">
                  {isFiltered ? `No outstanding records for ${activeFirm}` : "No outstanding records"}
                </p>
              ) : (
                <DataTable
                  rows={formattedSalesOutstanding}
                  columns={["orderNumber", "orderDate", "party", "salesman", "totalAmount", "advanceAmount", "outstandingAmount"]}
                />
              )}
            </Panel>
          </motion.div>
        )}

        {activeTab === "pie-chart" && (
          <motion.div
            key="pie-chart"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {extraLoading && !pieChartData ? (
              <div className="py-20 text-center">
                <div className="h-8 w-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-slate-400 mt-2 font-medium">Rendering distribution charts…</p>
              </div>
            ) : !pieChartData ? (
              <div className="py-12 card text-center text-slate-400">Failed to load chart metrics.</div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* 1. Payment Mode Distribution */}
                <DonutChart
                  title="Sales Revenue by Payment Mode"
                  data={pieChartData.payment_mode_distribution || []}
                  valueKey="total"
                  labelKey="payment_mode"
                  colorScale={["#10B981", "#EF4444", "#3B82F6", "#F59E0B"]}
                />

                {/* 2. Order Status Distribution */}
                <DonutChart
                  title="Orders Count by Status"
                  data={pieChartData.order_status_distribution || []}
                  valueKey="count"
                  labelKey="status"
                  colorScale={["#10B981", "#F59E0B", "#EF4444"]}
                />

                {/* 3. Product Vertical Distribution */}
                <DonutChart
                  title="Category Sales Performance"
                  data={pieChartData.vertical_distribution || []}
                  valueKey="total"
                  labelKey="vertical"
                  colorScale={["#6366F1", "#EC4899", "#8B5CF6", "#F59E0B", "#10B981"]}
                />
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "firm-wise" && (
          <motion.div
            key="firm-wise"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {extraLoading && firmWiseData.length === 0 ? (
              <div className="py-20 text-center">
                <div className="h-8 w-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-slate-400 mt-2 font-medium">Fetching firm ledger matrix…</p>
              </div>
            ) : firmWiseData.length === 0 ? (
              <div className="py-12 card text-center text-slate-400">No firm-wise performance metrics found.</div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {firmWiseData.map((firm) => {
                  const color = firm.color_code || "#4F46E5";
                  return (
                    <motion.div
                      key={firm.firm_id}
                      whileHover={{ y: -2 }}
                      className="card bg-white relative overflow-hidden border border-slate-100 flex flex-col justify-between"
                      style={{ borderLeft: `6px solid ${color}` }}
                    >
                      {/* Top Row */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span
                            className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                            style={{ backgroundColor: `${color}12`, color: color }}
                          >
                            Firm ID: #{firm.firm_id}
                          </span>
                          <span className="badge badge-slate text-[10px] font-mono">Active Salesman: {firm.active_agents}/{firm.total_agents}</span>
                        </div>
                        <h3 className="font-display font-bold text-lg text-slate-900 mb-1">{firm.firm_name}</h3>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Financial Overview</p>
                      </div>

                      {/* Middle Grid */}
                      <div className="grid grid-cols-2 gap-4 my-5 bg-slate-50/50 p-4 rounded-xl border border-slate-100/50">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Sales Turnover</p>
                          <p className="text-lg font-bold text-emerald-600 mt-1">{currency(firm.total_sales)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Outstanding Balances</p>
                          <p className="text-lg font-bold text-rose-600 mt-1">{currency(firm.total_outstanding)}</p>
                        </div>
                      </div>

                      {/* Bottom Row */}
                      <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <ShoppingCart size={13} className="text-brand-500" />
                          <span>Orders: <strong>{firm.total_orders}</strong></span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-emerald-600">✓ {firm.approved_orders} Approved</span>
                          {firm.pending_orders > 0 && (
                            <span className="text-amber-600 font-bold">● {firm.pending_orders} Pending</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
