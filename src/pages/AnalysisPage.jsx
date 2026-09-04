import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { BadgeIndianRupee, RefreshCw, Filter, ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import { Panel, Input, Select } from "../components/ui/index.jsx";
import { reportsApi } from "../api/resources";
import { currency } from "../utils/helpers";

const today = new Date().toISOString().slice(0, 10);
const prevMonthStart = (() => {
  const d = new Date(); d.setMonth(d.getMonth() - 1); d.setDate(1);
  return d.toISOString().slice(0, 10);
})();
const prevMonthEnd = (() => {
  const d = new Date(); d.setDate(0);
  return d.toISOString().slice(0, 10);
})();
const currMonthStart = today.slice(0, 8) + "01";

export default function AnalysisPage() {
  const [fromDate, setFromDate] = useState(currMonthStart);
  const [toDate, setToDate] = useState(today);
  const [compareFrom, setCompareFrom] = useState(prevMonthStart);
  const [compareTo, setCompareTo] = useState(prevMonthEnd);
  
  // Dimension: 'vertical', 'category', 'product'
  const [dimension, setDimension] = useState("vertical");
  
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const dimensionOptions = [
    { label: "Vertical-wise", value: "vertical" },
    { label: "Category-wise", value: "category" },
    { label: "Product-wise", value: "product" },
  ];

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        dimension,
        from_date: fromDate,
        to_date: toDate,
        compare_from: compareFrom,
        compare_to: compareTo,
      };

      const res = await reportsApi.comparisonByDimension(params);
      // Backend returns list of items under data.data (or res.data)
      const data = res?.data?.data?.data ?? res?.data?.data ?? [];
      setRows(Array.isArray(data) ? data : []);
      setFetched(true);
    } catch (e) {
      console.error("Comparison fetch failed:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, compareFrom, compareTo, dimension]);

  // Derived metrics
  const totalCurrentSales = rows.reduce((acc, r) => acc + Number(r.current_sales || 0), 0);
  const totalPreviousSales = rows.reduce((acc, r) => acc + Number(r.previous_sales || 0), 0);
  const salesDifference = totalCurrentSales - totalPreviousSales;
  const overallGrowth = totalPreviousSales ? ((salesDifference / totalPreviousSales) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Analysis</p>
        <h1 className="font-display font-bold text-2xl text-slate-900">Comparison Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5 font-medium">Compare performance metrics across business dimensions</p>
      </motion.div>

      {/* Filter Bar */}
      <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="card-lg">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
          <Filter size={12} /> Comparison Parameters
        </p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5 items-end">
          <Input label="Current Period From" type="date" value={fromDate} onChange={setFromDate} />
          <Input label="Current Period To" type="date" value={toDate} onChange={setToDate} />
          <Input label="Previous Period From" type="date" value={compareFrom} onChange={setCompareFrom} />
          <Input label="Previous Period To" type="date" value={compareTo} onChange={setCompareTo} />
          <button onClick={fetchReport} disabled={loading} className="btn-primary h-11 justify-center">
            {loading ? (
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {loading ? "Analyzing…" : "Analyse"}
          </button>
        </div>
        <div className="mt-4 max-w-xs">
          <Select label="Compare Dimension" value={dimension} options={dimensionOptions} onChange={setDimension} />
        </div>
      </motion.div>

      {fetched && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: BadgeIndianRupee, label: "Current Period Sales", value: currency(totalCurrentSales), bg: "bg-brand-50/50 border border-brand-100", clr: "text-brand-800" },
            { icon: RefreshCw, label: "Previous Period Sales", value: currency(totalPreviousSales), bg: "bg-slate-50 border border-slate-200/50", clr: "text-slate-700" },
            { 
              icon: TrendingUp, 
              label: "Growth Margin", 
              value: `${overallGrowth}%`, 
              bg: Number(overallGrowth) >= 0 ? "bg-emerald-50 border border-emerald-100" : "bg-rose-50 border border-rose-100", 
              clr: Number(overallGrowth) >= 0 ? "text-emerald-700 font-bold" : "text-rose-700 font-bold",
              trend: true
            },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.07 }} className={`card-lg p-5 flex flex-col justify-between ${card.bg}`}>
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm text-brand-600">
                  <card.icon size={18} />
                </div>
                {card.trend && (
                  <span>
                    {Number(overallGrowth) >= 0 ? (
                      <ArrowUpRight className="text-emerald-500" size={20} />
                    ) : (
                      <ArrowDownRight className="text-rose-500" size={20} />
                    )}
                  </span>
                )}
              </div>
              <div className="mt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{card.label}</p>
                <p className={`mt-1 text-lg font-display font-bold ${card.clr}`}>{card.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Panel title={`${dimensionOptions.find(d => d.value === dimension)?.label} Sales Breakdown`} subtitle="Revenue comparison and volume growth metrics">
        {loading ? (
          <div className="py-12 text-center"><div className="h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : !fetched ? (
          <div className="py-12 text-center max-w-sm mx-auto">
            <TrendingUp size={28} className="text-brand-500 mx-auto mb-3 animate-pulse" />
            <h3 className="font-display font-bold text-slate-800 text-base">Ready to Compare</h3>
            <p className="text-xs text-slate-500 mt-1">Select date ranges, pick a dimension (Vertical, Category, or Product) and click Analyse to view performance metrics.</p>
          </div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No comparison data available for the selected parameters.</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Dimension Item</th>
                  <th>Current Sales</th>
                  <th>Previous Sales</th>
                  <th>Current Orders</th>
                  <th>Previous Orders</th>
                  <th>Growth %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {rows.map((row, idx) => {
                  const growth = parseFloat(row.growth_percent || 0);
                  const isPositive = growth >= 0;
                  const tagClass = isPositive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : "bg-rose-50 text-rose-700 border-rose-100";
                  const arrow = isPositive ? "▲" : "▼";

                  return (
                    <tr key={idx}>
                      <td className="font-bold text-slate-800">{row.name || "—"}</td>
                      <td className="font-semibold">{currency(row.current_sales || 0)}</td>
                      <td className="text-slate-500">{currency(row.previous_sales || 0)}</td>
                      <td className="text-xs">{row.current_orders || 0} orders</td>
                      <td className="text-xs text-slate-400">{row.previous_orders || 0} orders</td>
                      <td>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-bold ${tagClass}`}>
                          {arrow} {Math.abs(growth).toFixed(1)}%
                        </span>
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
