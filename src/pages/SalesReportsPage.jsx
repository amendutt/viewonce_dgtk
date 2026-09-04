import React, { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Filter, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Panel, DataTable, ExportButton, Input, Select } from "../components/ui/index.jsx";
import { reportsApi, exportsApi, verticalsApi, agentsApi, itemsApi, branchesApi, salesOrdersApi } from "../api/resources";
import { useApp } from "../context/AppContext";
import { useApi, downloadBlob } from "../api/hooks";
import { currency } from "../utils/helpers";

const today = new Date().toISOString().slice(0, 10);
const monthStart = today.slice(0, 8) + "01";

const VERTICAL_COLORS = [
  {
    headerBg: "#E6F4EA", // Light Green
    headerText: "#137333",
    agentBg: "#F1F8F5",
    agentText: "#188038",
    cellActiveBg: "#E6F4EA",
    cellActiveText: "#137333",
    footerAgentBg: "#E6F4EA",
    footerAgentText: "#137333",
    vertTotalBg: "#CEEAD6",
    vertTotalText: "#137333",
  },
  {
    headerBg: "#E8F0FE", // Light Blue
    headerText: "#1A73E8",
    agentBg: "#F4F8FE",
    agentText: "#1A73E8",
    cellActiveBg: "#E8F0FE",
    cellActiveText: "#1A73E8",
    footerAgentBg: "#E8F0FE",
    footerAgentText: "#1A73E8",
    vertTotalBg: "#D2E3FC",
    vertTotalText: "#1A73E8",
  },
  {
    headerBg: "#FEF7E0", // Light Yellow/Amber
    headerText: "#B06000",
    agentBg: "#FFFDF6",
    agentText: "#C46D00",
    cellActiveBg: "#FEF7E0",
    cellActiveText: "#B06000",
    footerAgentBg: "#FEF7E0",
    footerAgentText: "#B06000",
    vertTotalBg: "#FEEFC3",
    vertTotalText: "#B06000",
  },
  {
    headerBg: "#F3E8FD", // Light Purple
    headerText: "#9333EA",
    agentBg: "#FAF5FF",
    agentText: "#A855F7",
    cellActiveBg: "#F3E8FD",
    cellActiveText: "#7E22CE",
    footerAgentBg: "#F3E8FD",
    footerAgentText: "#7E22CE",
    vertTotalBg: "#E9D5FF",
    vertTotalText: "#6B21A8",
  },
  {
    headerBg: "#FCE8E6", // Light Red/Rose
    headerText: "#C5221F",
    agentBg: "#FDF4F3",
    agentText: "#D93025",
    cellActiveBg: "#FCE8E6",
    cellActiveText: "#C5221F",
    footerAgentBg: "#FCE8E6",
    footerAgentText: "#C5221F",
    vertTotalBg: "#FAD2CF",
    vertTotalText: "#C5221F",
  },
  {
    headerBg: "#E0F7FA", // Light Cyan/Teal
    headerText: "#006064",
    agentBg: "#F0FDFE",
    agentText: "#00838F",
    cellActiveBg: "#E0F7FA",
    cellActiveText: "#006064",
    footerAgentBg: "#E0F7FA",
    footerAgentText: "#006064",
    vertTotalBg: "#B2EBF2",
    vertTotalText: "#006064",
  },
  {
    headerBg: "#FFF0F6", // Light Pink/Magenta
    headerText: "#D01760",
    agentBg: "#FFF8FA",
    agentText: "#DF1B68",
    cellActiveBg: "#FFF0F6",
    cellActiveText: "#B71152",
    footerAgentBg: "#FFF0F6",
    footerAgentText: "#B71152",
    vertTotalBg: "#FFD8E6",
    vertTotalText: "#9C0D43",
  },
  {
    headerBg: "#F1F3F4", // Light Gray/Slate
    headerText: "#3C4043",
    agentBg: "#F8F9FA",
    agentText: "#5F6368",
    cellActiveBg: "#F1F3F4",
    cellActiveText: "#3C4043",
    footerAgentBg: "#F1F3F4",
    footerAgentText: "#3C4043",
    vertTotalBg: "#E8EAED",
    vertTotalText: "#3C4043",
  }
];

const getVerticalColors = (index) => {
  return VERTICAL_COLORS[index % VERTICAL_COLORS.length];
};

export default function SalesReportsPage() {
  const { firms, firmNames, loading: ctxLoading } = useApp();
  const [exporting, setExporting] = useState("");

  // View state
  const [viewMode, setViewMode] = useState("detailed"); // "detailed" | "matrix" | "itemsMatrix" | "targetReport"

  // Filter state (Detailed View)
  const [fromDate, setFromDate] = useState(monthStart);
  const [toDate, setToDate] = useState(today);
  const [firmId, setFirmId] = useState("");
  const [verticalId, setVerticalId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [itemId, setItemId] = useState("");

  // Filter state (Matrix View)
  const defaultMonth = new Date().getMonth() + 1;
  const defaultYear = new Date().getFullYear();
  const [matrixMonth, setMatrixMonth] = useState(String(defaultMonth));
  const [matrixYear, setMatrixYear] = useState(String(defaultYear));
  const [matrixFirmId, setMatrixFirmId] = useState("");
  const [matrixBranchId, setMatrixBranchId] = useState("");

  // Filter state (Items Matrix View)
  const [itemMatrixMonth, setItemMatrixMonth] = useState(String(defaultMonth));
  const [itemMatrixYear, setItemMatrixYear] = useState(String(defaultYear));
  const [itemMatrixVerticalId, setItemMatrixVerticalId] = useState("");
  const [itemMatrixFirmId, setItemMatrixFirmId] = useState("");
  const [itemMatrixBranchId, setItemMatrixBranchId] = useState("");
  const [itemMatrixSubItemId, setItemMatrixSubItemId] = useState("");
  const [itemMatrixGroupMode, setItemMatrixGroupMode] = useState("item"); // "item" | "subitem"

  // Filter state (Target vs Achieved View)
  const getCurrentFinancialYearStart = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed: 3 is April
    return month >= 3 ? year : year - 1;
  };

  const renderGenericSubMatrix = () => {
    if (!subMatrixData) return null;

    return (
      <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm bg-white">
        <table className="min-w-full border-collapse border-spacing-0 text-center">
          <thead>
            <tr className="bg-[#92D050] text-slate-900 border-b border-slate-300 font-bold text-xs">
              <th rowSpan={2} className="border-r border-slate-200 px-4 py-3 min-w-[120px] bg-[#FFE4C4] font-extrabold text-slate-900">
                DATE
              </th>
              {subMatrixData.columns.map((col, idx) => (
                <th
                  key={`${col.sub_item_id || 'null'}_${idx}`}
                  colSpan={col.agents?.length}
                  className="border-r border-slate-300 px-4 py-2 uppercase tracking-wide text-white bg-[#55A344]"
                >
                  {col.sub_item_name}
                </th>
              ))}
              <th rowSpan={2} className="border-l border-slate-300 px-4 py-3 min-w-[80px] bg-[#92D050] font-extrabold text-slate-900">
                TOTAL
              </th>
            </tr>
            
            <tr className="bg-[#FFF5EE] text-slate-700 border-b border-slate-200 font-bold text-[10px]">
              {subMatrixData.columns.map((col) =>
                col.agents.map((agent) => (
                  <th
                    key={`${col.sub_item_id || 'null'}_${agent.agent_id || 'office'}`}
                    className={`px-2 py-2 border-r border-slate-200 ${
                      agent.agent_id === null ? 'text-orange-600 bg-[#FFF3E8]' : 'text-slate-700'
                    }`}
                  >
                    {agent.short_name}
                  </th>
                ))
              )}
            </tr>
          </thead>

          <tbody>
            {subMatrixData.rows.map((row, rIdx) => (
              <tr key={row.date || rIdx} className="hover:bg-slate-50/50 transition border-b border-slate-200 text-xs">
                <td className="border-r border-slate-200 px-3 py-2 font-semibold bg-slate-50 text-slate-700 font-mono whitespace-nowrap">
                  {formatDate(row.date)}
                </td>
                
                {subMatrixData.columns.map((col) =>
                  col.agents.map((agent) => {
                    const valKey = `si_${col.sub_item_id || 'null'}_a_${agent.agent_id === null ? 'null' : agent.agent_id}`;
                    const val = row.sales[valKey] || 0;
                    const isZero = Number(val) === 0;
                    const isOffice = agent.agent_id === null;
                    return (
                      <td
                        key={`${row.date}_${col.sub_item_id || 'null'}_${agent.agent_id || 'office'}`}
                        className={`border-r border-slate-100 px-2 py-2 font-bold ${
                          isZero ? 'text-slate-300 font-normal' : isOffice ? 'text-[#c65911]' : 'text-[#2f5597]'
                        }`}
                      >
                        {val}
                      </td>
                    );
                  })
                )}

                <td className="border-l border-slate-300 px-3 py-2 font-extrabold text-[#385723] bg-[#e2f0d9]">
                  {row.row_total}
                </td>
              </tr>
            ))}

            <tr className="bg-[#F2F2F2] border-t border-slate-400 font-bold text-slate-800 border-b border-slate-300 text-xs">
              <td className="border-r border-slate-300 px-3 py-3 uppercase font-extrabold bg-[#E5E7EB]">
                TOTAL
              </td>
              {subMatrixData.columns.map((col) =>
                col.agents.map((agent) => {
                  const valKey = `si_${col.sub_item_id || 'null'}_a_${agent.agent_id === null ? 'null' : agent.agent_id}`;
                  const totalQty = subMatrixData.column_totals[valKey] || 0;
                  const isOffice = agent.agent_id === null;
                  return (
                    <td
                      key={`total_${col.sub_item_id || 'null'}_${agent.agent_id || 'office'}`}
                      className={`border-r border-slate-200 px-2 py-2 bg-[#F3F4F6] font-extrabold ${
                        isOffice ? 'text-[#c65911]' : 'text-[#2f5597]'
                      }`}
                    >
                      {totalQty}
                    </td>
                  );
                })
              )}
              <td className="border-l border-slate-300 px-3 py-3 bg-[#E5E7EB] text-slate-400 font-normal">
                -
              </td>
            </tr>

            <tr className="bg-[#EBF5E6] border-b border-slate-400 font-bold text-indigo-700 text-xs">
              <td className="border-r border-slate-300 px-3 py-3 uppercase font-extrabold bg-[#E5E7EB]">
                SUB-ITEM TOTAL
              </td>
              {subMatrixData.columns.map((col) => (
                <td
                  key={`sub_item_total_${col.sub_item_id || 'null'}`}
                  colSpan={col.agents?.length}
                  className="border-r border-slate-300 px-4 py-3 text-indigo-700 font-extrabold bg-[#E5E7EB]"
                >
                  {subMatrixData.sub_item_totals[col.sub_item_id || 'null'] || 0}
                </td>
              ))}
              <td className="border-l border-slate-300 px-3 py-3 bg-[#E5E7EB] font-extrabold text-red-600">
                {subMatrixData.grand_total}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );  };
  const defaultFYStart = getCurrentFinancialYearStart();
  const [targetStartYear, setTargetStartYear] = useState(String(defaultFYStart));
  const [targetFirmId, setTargetFirmId] = useState("");
  const [targetBranchId, setTargetBranchId] = useState("");

  // Fetch verticals, agents, items, and branches
  const { data: verticalsData } = useApi(() => verticalsApi.list(), []);
  const verticals = Array.isArray(verticalsData) ? verticalsData : verticalsData?.rows || [];

  const { data: agentsData } = useApi(() => agentsApi.list({ limit: 100 }), []);
  const agents = Array.isArray(agentsData) ? agentsData : agentsData?.rows || [];

  const { data: itemsData } = useApi(() => itemsApi.list({ limit: 1000 }), []);
  const items = Array.isArray(itemsData) ? itemsData : itemsData?.rows || [];

  const { data: branchesData } = useApi(() => branchesApi.list({ limit: 100 }), []);
  const branches = Array.isArray(branchesData) ? branchesData : branchesData?.rows || [];

  const { data: subItemsData } = useApi(() => subItemsApi.list({ limit: 100 }), []);
  const subItems = Array.isArray(subItemsData) ? subItemsData : subItemsData?.rows || [];

  // Auto-select first vertical for Items Matrix View
  useEffect(() => {
    if (verticals.length > 0 && !itemMatrixVerticalId) {
      const tyreVert = verticals.find(v => v.name?.toUpperCase() === "TYRES" || v.name?.toUpperCase() === "TYRE");
      setItemMatrixVerticalId(tyreVert ? String(tyreVert.id) : String(verticals[0].id));
    }
  }, [verticals, itemMatrixVerticalId]);

  // Report data
  const [salesRows, setSalesRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  // Matrix Report data
  const [matrixData, setMatrixData] = useState(null);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [matrixFetched, setMatrixFetched] = useState(false);

  // Items Matrix Report data
  const [itemMatrixData, setItemMatrixData] = useState(null);
  const [itemMatrixLoading, setItemMatrixLoading] = useState(false);
  const [itemMatrixFetched, setItemMatrixFetched] = useState(false);

  // Sub-Items Matrix Report data
  const [subMatrixMonth, setSubMatrixMonth] = useState(String(defaultMonth));
  const [subMatrixYear, setSubMatrixYear] = useState(String(defaultYear));
  const [subMatrixVerticalId, setSubMatrixVerticalId] = useState("");
  const [subMatrixFirmId, setSubMatrixFirmId] = useState("");
  const [subMatrixBranchId, setSubMatrixBranchId] = useState("");
  const [subMatrixData, setSubMatrixData] = useState(null);
  const [subMatrixLoading, setSubMatrixLoading] = useState(false);
  const [subMatrixFetched, setSubMatrixFetched] = useState(false);

  // Auto-select first vertical for Sub-Items Matrix View
  useEffect(() => {
    if (verticals.length > 0 && !subMatrixVerticalId) {
      const tyreVert = verticals.find(v => v.name?.toUpperCase() === "TYRES" || v.name?.toUpperCase() === "TYRE");
      setSubMatrixVerticalId(tyreVert ? String(tyreVert.id) : String(verticals[0].id));
    }
  }, [verticals, subMatrixVerticalId]);

  // Target vs Achieved Report data
  const [targetReportData, setTargetReportData] = useState(null);
  const [targetReportLoading, setTargetReportLoading] = useState(false);
  const [targetReportFetched, setTargetReportFetched] = useState(false);

  const targetYearOptions = Array.from({ length: 7 }, (_, i) => {
    const y = 2024 + i;
    return { label: `FY ${y}-${String(y + 1).slice(-2)}`, value: String(y) };
  });

  const firmOptions = [
    { label: "All Firms", value: "" },
    ...firms.map((f) => ({ label: f.name, value: String(f.id) })),
  ];

  const branchOptions = [
    { label: "All Branches", value: "" },
    ...branches.map((b) => ({ label: b.name, value: String(b.id) })),
  ];

  const verticalOptions = [
    { label: "All Verticals", value: "" },
    ...verticals.map((v) => ({ label: v.name, value: String(v.id) })),
  ];

  const itemVerticalOptions = verticals.map((v) => ({
    label: v.name,
    value: String(v.id),
  }));

  const agentOptions = [
    { label: "All Salesmen", value: "" },
    ...agents.map((a) => ({
      label: a.User?.name || a.name || `Salesman ${a.id}`,
      value: String(a.id),
    })),
  ];

  const itemOptions = [
    { label: "All Items", value: "" },
    ...items.map((i) => ({ label: i.name, value: String(i.id) })),
  ];

  const monthOptions = [
    { label: "January", value: "1" },
    { label: "February", value: "2" },
    { label: "March", value: "3" },
    { label: "April", value: "4" },
    { label: "May", value: "5" },
    { label: "June", value: "6" },
    { label: "July", value: "7" },
    { label: "August", value: "8" },
    { label: "September", value: "9" },
    { label: "October", value: "10" },
    { label: "November", value: "11" },
    { label: "December", value: "12" },
  ];

  const yearOptions = Array.from({ length: 7 }, (_, i) => {
    const y = 2024 + i;
    return { label: String(y), value: String(y) };
  });

  const monthNames = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];

  const buildParams = () => {
    const p = { from_date: fromDate, to_date: toDate };
    if (firmId) p.firm_id = firmId;
    if (verticalId) p.vertical_id = verticalId;
    if (agentId) p.agent_id = agentId;
    if (itemId) {
      p.item_id = itemId;
      p.product_id = itemId;
    }
    return p;
  };

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportsApi.dailySales(buildParams());
      const d = res?.data?.data ?? res?.data ?? [];
      const rawRows = Array.isArray(d) ? d : d?.rows || [];

      // Fetch order details in parallel to get item-level data
      const detailResults = await Promise.allSettled(
        rawRows.map((row) => salesOrdersApi.get(row.id))
      );

      // Build a map of order id -> orderItems
      const itemsMap = {};
      detailResults.forEach((result, idx) => {
        if (result.status === "fulfilled") {
          const detail = result.value?.data?.data ?? result.value?.data;
          if (detail?.orderItems && detail.orderItems.length > 0) {
            itemsMap[rawRows[idx].id] = detail.orderItems;
          }
        }
      });

      // Flatten: one row per order-item (or one row if no items found)
      const normalizedRows = [];
      rawRows.forEach((row) => {
        const isCredit = String(row.payment_mode || "").toLowerCase() === "credit";
        const totalAmt = Number(row.total_amount || row.total || 0);
        const orderItems = itemsMap[row.id];

        if (orderItems && orderItems.length > 0) {
          orderItems.forEach((oi, idx) => {
            normalizedRows.push({
              ...row,
              date: formatDate(row.order_date || row.date),
              cash: idx === 0 ? (row.cash ?? (isCredit ? 0 : totalAmt)) : 0,
              credit: idx === 0 ? (row.credit ?? (isCredit ? totalAmt : 0)) : 0,
              advance: idx === 0 ? (row.advance ?? Number(row.advance_amount || 0)) : 0,
              outstanding: idx === 0 ? (row.outstanding ?? Number(row.outstanding_amount || row.pending_amount || 0)) : 0,
              item: oi.item_name || oi.name || "",
              qty: Number(oi.quantity ?? oi.qty ?? 0),
              unit: oi.unit || "",
            });
          });
        } else {
          normalizedRows.push({
            ...row,
            date: formatDate(row.order_date || row.date),
            cash: row.cash ?? (isCredit ? 0 : totalAmt),
            credit: row.credit ?? (isCredit ? totalAmt : 0),
            advance: row.advance ?? Number(row.advance_amount || 0),
            outstanding: row.outstanding ?? Number(row.outstanding_amount || row.pending_amount || 0),
            item: row.item || row.item_name || "",
            qty: row.qty ?? "",
            unit: row.unit || "",
          });
        }
      });
      setSalesRows(normalizedRows);
      setFetched(true);
    } catch (e) {
      console.error("Report fetch failed:", e);
      setSalesRows([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, firmId, verticalId, agentId, itemId]);

  const fetchMatrixReport = useCallback(async () => {
    setMatrixLoading(true);
    try {
      const params = {
        month: matrixMonth,
        year: matrixYear,
      };
      if (matrixFirmId) params.firm_id = matrixFirmId;
      if (matrixBranchId) params.branch_id = matrixBranchId;

      const res = await reportsApi.dailySalesMatrix(params);
      const d = res?.data?.data ?? res?.data ?? null;
      setMatrixData(d);
      setMatrixFetched(true);
    } catch (e) {
      console.error("Matrix report fetch failed:", e);
      setMatrixData(null);
    } finally {
      setMatrixLoading(false);
    }
  }, [matrixMonth, matrixYear, matrixFirmId, matrixBranchId]);

  const fetchItemMatrixReport = useCallback(async () => {
    if (!itemMatrixVerticalId) return;
    setItemMatrixLoading(true);
    try {
      const params = {
        vertical_id: Number(itemMatrixVerticalId),
        month: Number(itemMatrixMonth),
        year: Number(itemMatrixYear),
      };
      if (itemMatrixFirmId) params.firm_id = Number(itemMatrixFirmId);
      if (itemMatrixBranchId) params.branch_id = Number(itemMatrixBranchId);
      if (itemMatrixSubItemId) params.sub_item_id = Number(itemMatrixSubItemId);

      const res = await reportsApi.dailyItemsSalesMatrix(params);
      const d = res?.data?.data ?? res?.data ?? null;
      setItemMatrixData(d);
      setItemMatrixFetched(true);
    } catch (e) {
      console.error("Item matrix report fetch failed:", e);
      setItemMatrixData(null);
    } finally {
      setItemMatrixLoading(false);
    }
  }, [itemMatrixVerticalId, itemMatrixMonth, itemMatrixYear, itemMatrixFirmId, itemMatrixBranchId, itemMatrixSubItemId, verticals]);

  const fetchSubMatrixReport = useCallback(async () => {
    if (!subMatrixVerticalId) return;
    setSubMatrixLoading(true);
    try {
      const params = {
        vertical_id: Number(subMatrixVerticalId),
        month: Number(subMatrixMonth),
        year: Number(subMatrixYear),
      };
      if (subMatrixFirmId) params.firm_id = Number(subMatrixFirmId);
      if (subMatrixBranchId) params.branch_id = Number(subMatrixBranchId);

      const res = await reportsApi.dailySubItemsSalesMatrix(params);
      const d = res?.data?.data ?? res?.data ?? null;

      setSubMatrixData(d);
      setSubMatrixFetched(true);
    } catch (e) {
      console.error("Sub-item matrix report fetch failed:", e);
      setSubMatrixData(null);
    } finally {
      setSubMatrixLoading(false);
    }
  }, [subMatrixVerticalId, subMatrixMonth, subMatrixYear, subMatrixFirmId, subMatrixBranchId, verticals]);

  const fetchTargetReport = useCallback(async () => {
    setTargetReportLoading(true);
    try {
      const params = {
        start_year: Number(targetStartYear),
      };
      if (targetFirmId) params.firm_id = Number(targetFirmId);
      if (targetBranchId) params.branch_id = Number(targetBranchId);

      const res = await reportsApi.targetReport(params);
      const d = res?.data?.data ?? res?.data ?? null;
      setTargetReportData(d);
      setTargetReportFetched(true);
    } catch (e) {
      console.error("Target report fetch failed:", e);
      setTargetReportData(null);
    } finally {
      setTargetReportLoading(false);
    }
  }, [targetStartYear, targetFirmId, targetBranchId]);

  const handleExportTargetReport = useCallback(async () => {
    setExporting("targetReport");
    try {
      const params = {
        start_year: Number(targetStartYear),
      };
      if (targetFirmId) params.firm_id = Number(targetFirmId);
      if (targetBranchId) params.branch_id = Number(targetBranchId);

      const res = await exportsApi.targetReport(params);
      const startYearNum = Number(targetStartYear);
      downloadBlob(res, `target_vs_achieved_report_${startYearNum}_${startYearNum + 1}.xlsx`);
    } catch (e) {
      console.error("Export target report failed:", e);
    } finally {
      setExporting("");
    }
  }, [targetStartYear, targetFirmId, targetBranchId]);

  const handleExportItemsMatrix = useCallback(async () => {
    if (!itemMatrixVerticalId) return;
    setExporting("itemsMatrix");
    try {
      const params = {
        vertical_id: Number(itemMatrixVerticalId),
        month: Number(itemMatrixMonth),
        year: Number(itemMatrixYear),
      };
      if (itemMatrixFirmId) params.firm_id = Number(itemMatrixFirmId);
      if (itemMatrixBranchId) params.branch_id = Number(itemMatrixBranchId);
      if (itemMatrixSubItemId) params.sub_item_id = Number(itemMatrixSubItemId);

      const res = await exportsApi.dailyItemsSalesMatrix(params);
      const verticalName = verticals.find(v => String(v.id) === String(itemMatrixVerticalId))?.name || "REPORT";
      const monthName = monthNames[parseInt(itemMatrixMonth) - 1];
      const fileName = `${monthName}_${itemMatrixYear}_Daily_${verticalName}_Items_Sales_Matrix.xlsx`;
      downloadBlob(res, fileName);
    } catch (e) {
      console.error("Export items matrix failed:", e);
    } finally {
      setExporting("");
    }
  }, [itemMatrixVerticalId, itemMatrixMonth, itemMatrixYear, itemMatrixFirmId, itemMatrixBranchId, itemMatrixSubItemId, verticals]);

  const handleExportSubMatrix = useCallback(async () => {
    if (!subMatrixVerticalId) return;
    setExporting("subItemsMatrix");
    try {
      const params = {
        vertical_id: Number(subMatrixVerticalId),
        month: Number(subMatrixMonth),
        year: Number(subMatrixYear),
      };
      if (subMatrixFirmId) params.firm_id = Number(subMatrixFirmId);
      if (subMatrixBranchId) params.branch_id = Number(subMatrixBranchId);

      const selectedVertName = verticals.find(v => String(v.id) === String(subMatrixVerticalId))?.name || "";
      const res = await exportsApi.dailySubItemsSalesMatrix(params);

      const verticalName = selectedVertName || "REPORT";
      const monthName = monthNames[parseInt(subMatrixMonth) - 1];
      const fileName = `${monthName}_${subMatrixYear}_Daily_${verticalName}_Sub_Items_Sales_Matrix.xlsx`;
      downloadBlob(res, fileName);
    } catch (e) {
      console.error("Export sub-items matrix failed:", e);
    } finally {
      setExporting("");
    }
  }, [subMatrixVerticalId, subMatrixMonth, subMatrixYear, subMatrixFirmId, subMatrixBranchId, verticals]);

  const handleExportMatrix = () => {
    if (!matrixData || !matrixData.columns || !matrixData.rows) return;

    // 1. Build column definitions
    const cols = [];
    matrixData.columns.forEach((col) => {
      col.agents.forEach((agent) => {
        cols.push({
          verticalId: col.vertical_id ?? col.id,
          verticalName: col.vertical_name,
          agentId: agent.agent_id ?? agent.id,
          shortName: agent.short_name,
        });
      });
    });

    const header1 = ["S.R"];
    matrixData.columns.forEach((col) => {
      header1.push(col.vertical_name);
      for (let i = 1; i < col.agents.length; i++) {
        header1.push("");
      }
    });
    header1.push("TOTAL");

    const header2 = [""];
    cols.forEach((c) => {
      header2.push(c.shortName);
    });
    header2.push("");

    const aoa = [header1, header2];

    // Data rows
    matrixData.rows.forEach((row) => {
      const line = [formatDate(row.date)];
      cols.forEach((col) => {
        const key = `v_${col.verticalId}a${col.agentId}`;
        line.push(row.sales[key] || 0);
      });
      line.push(row.row_total || 0);
      aoa.push(line);
    });

    // Footer 1: TOTAL
    const totalLine = ["TOTAL"];
    cols.forEach((col) => {
      const key = `v_${col.verticalId}a${col.agentId}`;
      totalLine.push(matrixData.column_totals[key] || 0);
    });
    totalLine.push(matrixData.grand_total || 0);
    aoa.push(totalLine);

    // Footer 2: VERT. TOTAL
    const vertTotalLine = ["VERT. TOTAL"];
    matrixData.columns.forEach((col) => {
      const v_id = col.vertical_id ?? col.id;
      const vertTotal = col.agents.reduce((sum, agent) => {
        const a_id = agent.agent_id ?? agent.id;
        return sum + (matrixData.column_totals[`v_${v_id}a${a_id}`] || 0);
      }, 0);
      vertTotalLine.push(vertTotal);
      for (let i = 1; i < col.agents.length; i++) {
        vertTotalLine.push("");
      }
    });
    vertTotalLine.push("");
    aoa.push(vertTotalLine);

    // 2. Build worksheet and merges
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    const merges = [];

    // Merge S.R vertically (Row 0 & Row 1)
    merges.push({ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } });

    // Merge vertical headers horizontally
    let currentCol = 1;
    matrixData.columns.forEach((col) => {
      const span = col.agents.length;
      if (span > 1) {
        merges.push({
          s: { r: 0, c: currentCol },
          e: { r: 0, c: currentCol + span - 1 }
        });
      }
      currentCol += span;
    });

    // Merge TOTAL vertically
    merges.push({ s: { r: 0, c: currentCol }, e: { r: 1, c: currentCol } });

    // Merge VERT. TOTAL footer cells horizontally
    const vertTotalRowIndex = aoa.length - 1;
    let currentFootCol = 1;
    matrixData.columns.forEach((col) => {
      const span = col.agents.length;
      if (span > 1) {
        merges.push({
          s: { r: vertTotalRowIndex, c: currentFootCol },
          e: { r: vertTotalRowIndex, c: currentFootCol + span - 1 }
        });
      }
      currentFootCol += span;
    });

    worksheet["!merges"] = merges;

    // 3. Save file
    const workbook = XLSX.utils.book_new();
    const fileName = `${monthNames[parseInt(matrixMonth) - 1]}_${matrixYear}_Daily_Sales_Matrix.xlsx`;
    XLSX.utils.book_append_sheet(workbook, worksheet, "Matrix Report");
    XLSX.writeFile(workbook, fileName);
  };

  const handleExport = useCallback(async (type, fileName) => {
    setExporting(type);
    try {
      const params = buildParams();
      let res;
      if (type === "sales") res = await exportsApi.dailySales(params);
      else if (type === "outstanding") res = await exportsApi.salesOutstanding(params);
      else if (type === "bulkItems") res = await exportsApi.bulkItems(params);
      downloadBlob(res, fileName);
    } catch (e) {
      console.error("Export failed:", e);
    } finally {
      setExporting("");
    }
  }, [fromDate, toDate, firmId, verticalId, agentId, itemId]);

  // Totals (Detailed View)
  const totals = salesRows.reduce(
    (acc, r) => {
      acc.cash += Number(r.cash || 0);
      acc.credit += Number(r.credit || r.credit_sales || 0);
      acc.advance += Number(r.advance || 0);
      acc.outstanding += Number(r.outstanding || r.sales_outstanding || 0);
      return acc;
    },
    { cash: 0, credit: 0, advance: 0, outstanding: 0 }
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        const parts = dateStr.split("T")[0].split("-");
        if (parts.length === 3 && parts[0].length === 4) {
          return `${parts[2].padStart(2, "0")}-${parts[1].padStart(2, "0")}-${parts[0]}`;
        }
        return dateStr;
      }
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Reports</p>
          <h1 className="font-display font-bold text-2xl text-slate-900">Daily Sales Report</h1>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">
            {viewMode === "detailed"
              ? (fetched ? `${salesRows.length} records · Filtered data` : "Apply filters and fetch report")
              : viewMode === "matrix"
              ? (matrixFetched ? "Matrix data loaded for period" : "Apply filters and fetch report")
              : viewMode === "itemsMatrix"
              ? (itemMatrixFetched ? "Item matrix data loaded for period" : "Apply filters and fetch report")
              : viewMode === "subItemsMatrix"
              ? (subMatrixFetched ? "Sub-item matrix data loaded for period" : "Apply filters and fetch report")
              : (targetReportFetched ? "Target vs Achieved data loaded for period" : "Apply filters and fetch report")}
          </p>
        </div>
      </motion.div>

      {/* View Switcher Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setViewMode("detailed")}
          className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            viewMode === "detailed"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Detailed Transactions
        </button>
        <button
          onClick={() => setViewMode("matrix")}
          className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            viewMode === "matrix"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Daily Sales Matrix
        </button>
        <button
          onClick={() => setViewMode("itemsMatrix")}
          className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            viewMode === "itemsMatrix"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Daily Items Sales Matrix
        </button>
        <button
          onClick={() => setViewMode("subItemsMatrix")}
          className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            viewMode === "subItemsMatrix"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Daily Sub-Items Sales Matrix
        </button>
        <button
          onClick={() => setViewMode("targetReport")}
          className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            viewMode === "targetReport"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Target vs Achieved
        </button>
      </div>

      {/* Filter Bar */}
      <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
        className="card-lg">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
          <Filter size={12} /> Filters
        </p>

        {viewMode === "detailed" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-end">
            <Input label="From Date" type="date" value={fromDate} onChange={setFromDate} />
            <Input label="To Date" type="date" value={toDate} onChange={setToDate} />
            <Select label="Firm" value={firmId} options={firmOptions} onChange={setFirmId} />
            <Select label="Vertical" value={verticalId} options={verticalOptions} onChange={setVerticalId} />
            <Select label="Salesman" value={agentId} options={agentOptions} onChange={setAgentId} />
            <Select label="Item" value={itemId} options={itemOptions} onChange={setItemId} />
            <button onClick={fetchReport} disabled={loading}
              className="btn-primary h-11 justify-center">
              {loading ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RefreshCw size={16} />}
              {loading ? "Fetching…" : "Fetch Report"}
            </button>
          </div>
        ) : viewMode === "matrix" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-end">
            <Select label="Month" value={matrixMonth} options={monthOptions} onChange={setMatrixMonth} />
            <Select label="Year" value={matrixYear} options={yearOptions} onChange={setMatrixYear} />
            <Select label="Firm" value={matrixFirmId} options={firmOptions} onChange={setMatrixFirmId} />
            <Select label="Branch" value={matrixBranchId} options={branchOptions} onChange={setMatrixBranchId} />
            <button onClick={fetchMatrixReport} disabled={matrixLoading}
              className="btn-primary h-11 justify-center">
              {matrixLoading ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RefreshCw size={16} />}
              {matrixLoading ? "Fetching…" : "Fetch Report"}
            </button>
          </div>
        ) : viewMode === "itemsMatrix" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-end">
            <Select label="Month" value={itemMatrixMonth} options={monthOptions} onChange={setItemMatrixMonth} />
            <Select label="Year" value={itemMatrixYear} options={yearOptions} onChange={setItemMatrixYear} />
            <Select label="Vertical" value={itemMatrixVerticalId} options={itemVerticalOptions} onChange={(v) => { setItemMatrixVerticalId(v); setItemMatrixSubItemId(""); }} />
            <Select 
              label="Sub-Item (Filter)" 
              value={itemMatrixSubItemId} 
              options={[
                { label: "All Sub-Items", value: "" },
                ...subItems
                  .filter(si => !itemMatrixVerticalId || String(si.vertical_id) === String(itemMatrixVerticalId))
                  .map(si => ({ label: si.name, value: String(si.id) }))
              ]} 
              onChange={setItemMatrixSubItemId} 
            />
            <Select label="Firm" value={itemMatrixFirmId} options={firmOptions} onChange={setItemMatrixFirmId} />
            <Select label="Branch" value={itemMatrixBranchId} options={branchOptions} onChange={setItemMatrixBranchId} />
            <button onClick={fetchItemMatrixReport} disabled={itemMatrixLoading || !itemMatrixVerticalId}
              className="btn-primary h-11 justify-center">
              {itemMatrixLoading ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RefreshCw size={16} />}
              {itemMatrixLoading ? "Fetching…" : "Fetch Report"}
            </button>
          </div>
        ) : viewMode === "subItemsMatrix" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-end">
            <Select label="Month" value={subMatrixMonth} options={monthOptions} onChange={setSubMatrixMonth} />
            <Select label="Year" value={subMatrixYear} options={yearOptions} onChange={setSubMatrixYear} />
            <Select label="Vertical" value={subMatrixVerticalId} options={itemVerticalOptions} onChange={setSubMatrixVerticalId} />
            <Select label="Firm" value={subMatrixFirmId} options={firmOptions} onChange={setSubMatrixFirmId} />
            <Select label="Branch" value={subMatrixBranchId} options={branchOptions} onChange={setSubMatrixBranchId} />
            <button onClick={fetchSubMatrixReport} disabled={subMatrixLoading || !subMatrixVerticalId}
              className="btn-primary h-11 justify-center">
              {subMatrixLoading ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RefreshCw size={16} />}
              {subMatrixLoading ? "Fetching…" : "Fetch Report"}
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-end">
            <Select label="Financial Year" value={targetStartYear} options={targetYearOptions} onChange={setTargetStartYear} />
            <Select label="Firm" value={targetFirmId} options={firmOptions} onChange={setTargetFirmId} />
            <Select label="Branch" value={targetBranchId} options={branchOptions} onChange={setTargetBranchId} />
            <button onClick={fetchTargetReport} disabled={targetReportLoading}
              className="btn-primary h-11 justify-center">
              {targetReportLoading ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RefreshCw size={16} />}
              {targetReportLoading ? "Fetching…" : "Fetch Report"}
            </button>
          </div>
        )}
      </motion.div>

      {/* Summary cards (Detailed View only) */}
      {viewMode === "detailed" && fetched && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Cash Sales", value: currency(totals.cash), color: "text-emerald-700", bg: "bg-emerald-50" },
            { label: "Credit Sales", value: currency(totals.credit), color: "text-amber-700", bg: "bg-amber-50" },
            { label: "Advance Collected", value: currency(totals.advance), color: "text-blue-700", bg: "bg-blue-50" },
            { label: "Pending Balance", value: currency(totals.outstanding), color: "text-rose-700", bg: "bg-rose-50" },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.06 }} className={`card ${card.bg}`}>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{card.label}</p>
              <p className={`text-xl font-display font-bold mt-1 ${card.color}`}>{card.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {viewMode === "detailed" ? (
        <Panel
          title="Sales Transactions"
          subtitle="All branch sales with party and payment breakdown"
          action={
            <>
              <button onClick={() => handleExport("sales", "daily-sales-report.xlsx")}
                disabled={exporting === "sales"}
                className="btn-secondary h-9 px-3 text-xs flex items-center gap-1.5">
                {exporting === "sales" ? <span className="h-3 w-3 border border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Download size={13} />}
                Export Sales
              </button>
              <button onClick={() => handleExport("outstanding", "sales-outstanding.xlsx")}
                disabled={exporting === "outstanding"}
                className="btn-secondary h-9 px-3 text-xs flex items-center gap-1.5">
                {exporting === "outstanding" ? <span className="h-3 w-3 border border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Download size={13} />}
                Pending Balance
              </button>
              <button onClick={() => handleExport("bulkItems", "bulk-item-export.xlsx")}
                disabled={exporting === "bulkItems"}
                className="btn-secondary h-9 px-3 text-xs flex items-center gap-1.5">
                {exporting === "bulkItems" ? <span className="h-3 w-3 border border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Download size={13} />}
                Bulk Items
              </button>
            </>
          }
        >
          {loading ? (
            <div className="py-12 text-center">
              <div className="h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-400 mt-2">Loading sales data…</p>
            </div>
          ) : !fetched ? (
            <p className="py-10 text-center text-sm text-slate-400">Select filters and click Fetch Report.</p>
          ) : salesRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No sales records found for selected range.</p>
          ) : (
            <DataTable
              rows={salesRows}
              columns={[
                "date", "firm", "branch", "vertical", "salesman", "party",
                "item", "qty", "unit",
                "cash", "credit", "advance", "outstanding",
              ]}
            />
          )}
        </Panel>
      ) : viewMode === "matrix" ? (
        <Panel
          title={
            matrixFetched && matrixData
              ? `${monthNames[parseInt(matrixMonth) - 1]} - ${matrixYear} - DAILY SALES REPORT`
              : "Daily Sales Matrix"
          }
          subtitle="Grid overview of daily sales by vertical and agent"
          action={
            matrixFetched && matrixData && matrixData.rows && matrixData.rows.length > 0 && (
              <button onClick={handleExportMatrix}
                className="btn-secondary h-9 px-3 text-xs flex items-center gap-1.5">
                <Download size={13} />
                Export Matrix
              </button>
            )
          }
        >
          {matrixLoading ? (
            <div className="py-12 text-center">
              <div className="h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-400 mt-2">Loading sales matrix…</p>
            </div>
          ) : !matrixFetched ? (
            <p className="py-10 text-center text-sm text-slate-400">Select filters and click Fetch Report.</p>
          ) : !matrixData || !matrixData.columns || !matrixData.rows || matrixData.rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No matrix records found for selected period.</p>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm bg-white">
              <table className="min-w-full border-collapse border-spacing-0">
                {/* Step 1: Render Headers */}
                <thead>
                  <tr>
                    <th rowSpan={2} className="bg-[#FFF2CC] text-[#92400e] font-bold text-center border-r border-b border-slate-200 px-3 py-3.5 text-[11px] uppercase tracking-wider font-display">
                      S.R
                    </th>
                    {matrixData.columns.map((col, colIdx) => {
                      const colors = getVerticalColors(colIdx);
                      return (
                        <th
                          key={col.vertical_id ?? col.id}
                          colSpan={col.agents.length}
                          style={{ backgroundColor: colors.headerBg, color: colors.headerText }}
                          className="font-bold text-center border-r border-b border-slate-200 px-3 py-2 text-[11px] uppercase tracking-wider font-display"
                        >
                          {col.vertical_name}
                        </th>
                      );
                    })}
                    <th rowSpan={2} className="bg-[#E2F0D9] text-[#385723] font-bold text-center border-b border-slate-200 px-3 py-3.5 text-[11px] uppercase tracking-wider font-display">
                      TOTAL
                    </th>
                  </tr>
                  <tr>
                    {matrixData.columns.map((col, colIdx) => {
                      const colors = getVerticalColors(colIdx);
                      return col.agents.map((agent) => {
                        const a_id = agent.agent_id ?? agent.id;
                        return (
                          <th
                            key={a_id}
                            style={{ backgroundColor: colors.agentBg, color: colors.agentText }}
                            className="font-bold text-center border-r border-b border-slate-200 px-2 py-2 text-[10px] tracking-wider uppercase"
                          >
                            {agent.short_name}
                          </th>
                        );
                      });
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {/* Step 2: Render Data Rows */}
                  {matrixData.rows.map((row, rIdx) => (
                    <tr key={row.date || rIdx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="bg-[#FFF2CC]/10 text-slate-700 font-mono text-center border-r border-b border-slate-200 px-3 py-2 text-xs font-semibold whitespace-nowrap">
                        {formatDate(row.date)}
                      </td>
                      {matrixData.columns.map((col, colIdx) => {
                        const colors = getVerticalColors(colIdx);
                        return col.agents.map((agent) => {
                          const v_id = col.vertical_id ?? col.id;
                          const a_id = agent.agent_id ?? agent.id;
                          const qty = row.sales[`v_${v_id}a${a_id}`] || 0;
                          const isZero = Number(qty) === 0;
                          return (
                            <td
                              key={a_id}
                              style={!isZero ? { backgroundColor: colors.cellActiveBg, color: colors.cellActiveText } : {}}
                              className={`text-center border-r border-b border-slate-200 px-2 py-2 text-xs font-medium ${isZero ? "text-slate-300 font-normal" : "font-bold"}`}
                            >
                              {qty}
                            </td>
                          );
                        });
                      })}
                      <td className="bg-amber-50/20 text-[#b45309] font-bold text-center border-b border-slate-200 px-3 py-2 text-xs">
                        {row.row_total}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  {/* Step 3: Render Footer Row (Totals) */}
                  <tr className="border-t-2 border-slate-300">
                    <td className="bg-slate-50 font-bold text-slate-800 text-center border-r border-b border-slate-200 px-3 py-2.5 text-xs uppercase tracking-wider">
                      TOTAL
                    </td>
                    {matrixData.columns.map((col, colIdx) => {
                      const colors = getVerticalColors(colIdx);
                      return col.agents.map((agent) => {
                        const v_id = col.vertical_id ?? col.id;
                        const a_id = agent.agent_id ?? agent.id;
                        const colTotal = matrixData.column_totals[`v_${v_id}a${a_id}`] || 0;
                        return (
                          <td
                            key={a_id}
                            style={{ backgroundColor: colors.footerAgentBg, color: colors.footerAgentText }}
                            className="font-bold text-center border-r border-b border-slate-200 px-2 py-2.5 text-xs"
                          >
                            {colTotal}
                          </td>
                        );
                      });
                    })}
                    <td className="bg-amber-50 font-extrabold text-[#b45309] text-center border-b border-slate-200 px-3 py-2.5 text-sm shadow-inner">
                      {matrixData.grand_total}
                    </td>
                  </tr>
                  {/* Row 2: Render Vertical Totals */}
                  <tr className="border-t border-slate-200">
                    <td className="bg-slate-100 border-r border-slate-200 text-[10px] font-bold text-slate-500 text-center py-2 uppercase tracking-wide">
                      VERT. TOTAL
                    </td>
                    {matrixData.columns.map((col, colIdx) => {
                      const v_id = col.vertical_id ?? col.id;
                      const colors = getVerticalColors(colIdx);
                      const vertTotal = col.agents.reduce((sum, agent) => {
                        const a_id = agent.agent_id ?? agent.id;
                        return sum + (matrixData.column_totals[`v_${v_id}a${a_id}`] || 0);
                      }, 0);
                      return (
                        <td
                          key={v_id}
                          colSpan={col.agents.length}
                          style={{ backgroundColor: colors.vertTotalBg, color: colors.vertTotalText }}
                          className="font-bold text-center border-r border-slate-200 px-2 py-2 text-xs"
                        >
                          {vertTotal}
                        </td>
                      );
                    })}
                    <td className="bg-slate-100 border-slate-200 border-t"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Panel>
      ) : viewMode === "itemsMatrix" ? (
        <Panel
          title={
            itemMatrixFetched && itemMatrixData && itemMatrixData.vertical
              ? `${monthNames[parseInt(itemMatrixMonth) - 1]} - ${itemMatrixYear} (DAILY ${itemMatrixData.vertical.name} SALE) REPORT NO. 11`
              : "Daily Items Sales Matrix"
          }
          subtitle="Grid overview of daily item sales segmented by agent and office"
          action={
            itemMatrixFetched && itemMatrixData && itemMatrixData.rows && itemMatrixData.rows.length > 0 && (
              <button onClick={handleExportItemsMatrix}
                disabled={exporting === "itemsMatrix"}
                className="btn-secondary h-9 px-3 text-xs flex items-center gap-1.5">
                {exporting === "itemsMatrix" ? <span className="h-3 w-3 border border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Download size={13} />}
                Export Matrix
              </button>
            )
          }
        >
          {itemMatrixLoading ? (
            <div className="py-12 text-center">
              <div className="h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-400 mt-2">Loading item sales matrix…</p>
            </div>
          ) : !itemMatrixFetched ? (
            <p className="py-10 text-center text-sm text-slate-400">Select filters and click Fetch Report.</p>
          ) : !itemMatrixData || !itemMatrixData.rows || itemMatrixData.rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No records found for selected filters.</p>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm bg-white">
              <table className="min-w-full border-collapse border-spacing-0">
                <thead>
                  {/* Row 0: Title row like in the image */}
                  <tr>
                    <th colSpan={1 + (itemMatrixData.columns || []).reduce((sum, col) => sum + col.agents.length, 0) + 1}
                      className="bg-[#fce4d6] text-[#c65911] font-bold text-center border-b border-slate-200 px-3 py-3 text-sm uppercase tracking-wider font-display font-black">
                      {monthNames[parseInt(itemMatrixMonth) - 1]} - {itemMatrixYear} (DAILY {itemMatrixData.vertical?.name || ""} SALE ) REPORT NO. 11
                    </th>
                  </tr>
                  {/* Row 1: Item headers */}
                  <tr>
                    <th rowSpan={2} className="bg-[#ffff00] text-slate-800 font-extrabold text-center border-r border-b border-slate-200 px-3 py-3.5 text-[11px] uppercase tracking-wider font-display">
                      S.R
                    </th>
                    {itemMatrixData.columns.map((col) => (
                      <th key={col.item_id ?? col.id} colSpan={col.agents.length} className="bg-[#c6e0b4] text-[#385723] font-bold text-center border-r border-b border-slate-200 px-3 py-2 text-[11px] uppercase tracking-wider font-display">
                        {col.item_name}
                      </th>
                    ))}
                    <th rowSpan={2} className="bg-[#c6e0b4] text-[#385723] font-bold text-center border-b border-slate-200 px-3 py-3.5 text-[11px] uppercase tracking-wider font-display">
                      TOTAL
                    </th>
                  </tr>
                  {/* Row 2: Agent headers */}
                  <tr>
                    {itemMatrixData.columns.map((col) =>
                      col.agents.map((agent, aIdx) => {
                        const a_id = agent.agent_id ?? agent.id;
                        const shortName = agent.short_name || agent.agent_name;
                        const isOffice = agent.agent_name === "Office" || shortName === "OFF.";
                        return (
                          <th key={`${col.item_id ?? col.id}_agent_${a_id ?? 'null'}_${aIdx}`}
                            className={`bg-slate-50 font-bold text-center border-r border-b border-slate-200 px-2 py-2 text-[10px] tracking-wider uppercase ${isOffice ? "text-[#ed7d31]" : "text-[#4472c4]"}`}>
                            {shortName}
                          </th>
                        );
                      })
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {itemMatrixData.rows.map((row, rIdx) => (
                    <tr key={row.date || rIdx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="bg-slate-50/50 text-slate-700 font-mono text-center border-r border-b border-slate-200 px-3 py-2 text-xs font-semibold whitespace-nowrap">
                        {formatDate(row.date)}
                      </td>
                      {itemMatrixData.columns.map((col) =>
                        col.agents.map((agent, aIdx) => {
                          const itemId = col.item_id ?? col.id;
                          const agentId = agent.agent_id ?? agent.id;
                          const key = `i_${itemId}a${agentId || 'null'}`;
                          const qty = row.sales[key] ?? 0;
                          const isZero = Number(qty) === 0;
                          return (
                            <td key={`${col.item_id ?? col.id}_agent_${agentId ?? 'null'}_${aIdx}`}
                              className={`text-center border-r border-b border-slate-200 px-2 py-2 text-xs ${isZero ? "text-orange-300 font-normal" : "text-slate-800 font-bold"}`}>
                              {qty}
                            </td>
                          );
                        })
                      )}
                      <td className="bg-[#e2f0d9]/30 text-[#385723] font-bold text-center border-b border-slate-200 px-3 py-2 text-xs">
                        {row.row_total}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  {/* Totals row */}
                  <tr className="border-t-2 border-slate-300">
                    <td className="bg-slate-50 font-bold text-slate-800 text-center border-r border-b border-slate-200 px-3 py-2.5 text-xs uppercase tracking-wider">
                      TOTAL
                    </td>
                    {itemMatrixData.columns.map((col) =>
                      col.agents.map((agent, aIdx) => {
                        const itemId = col.item_id ?? col.id;
                        const agentId = agent.agent_id ?? agent.id;
                        const key = `i_${itemId}a${agentId || 'null'}`;
                        const colTotal = itemMatrixData.column_totals[key] ?? 0;
                        return (
                          <td key={`total_${col.item_id ?? col.id}_agent_${agentId ?? 'null'}_${aIdx}`}
                            className="bg-slate-50 font-bold text-slate-800 text-center border-r border-b border-slate-200 px-2 py-2.5 text-xs">
                            {colTotal}
                          </td>
                        );
                      })
                    )}
                    <td className="bg-[#e2f0d9] font-extrabold text-[#385723] text-center border-b border-slate-200 px-3 py-2.5 text-sm shadow-inner">
                      {itemMatrixData.grand_total}
                    </td>
                  </tr>
                  {/* Item totals row */}
                  <tr className="border-t border-slate-200">
                    <td className="bg-slate-100 border-r border-slate-200 text-[10px] font-bold text-slate-500 text-center py-2 uppercase tracking-wide">
                    </td>
                    {itemMatrixData.columns.map((col) => {
                      const itemId = col.item_id ?? col.id;
                      const itemTotal = itemMatrixData.item_totals[String(itemId)] ?? 0;
                      return (
                        <td key={`item_total_${itemId}`} colSpan={col.agents.length}
                          className="bg-red-50/50 font-bold text-red-600 text-center border-r border-slate-200 px-2 py-2 text-xs">
                          {itemTotal}
                        </td>
                      );
                    })}
                    <td className="bg-slate-100 border-slate-200 border-t"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Panel>
      ) : viewMode === "subItemsMatrix" ? (
        <Panel
          title={
            subMatrixFetched && subMatrixData && subMatrixData.vertical
              ? `${monthNames[parseInt(subMatrixMonth) - 1]} - ${subMatrixYear} (DAILY ${subMatrixData.vertical.name} SUB-ITEMS SALE) REPORT NO. ${subMatrixData.vertical.id}`
              : "Daily Sub-Items Sales Matrix"
          }
          subtitle="Grid overview of daily sub-item sales segmented by agent and office"
          action={
            subMatrixFetched && subMatrixData && subMatrixData.rows && subMatrixData.rows.length > 0 && (
              <button onClick={handleExportSubMatrix}
                disabled={exporting === "subItemsMatrix"}
                className="btn-secondary h-9 px-3 text-xs flex items-center gap-1.5">
                {exporting === "subItemsMatrix" ? <span className="h-3 w-3 border border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Download size={13} />}
                Export Matrix
              </button>
            )
          }
        >
          {subMatrixLoading ? (
            <div className="py-12 text-center">
              <div className="h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-400 mt-2">Loading sub-item sales matrix…</p>
            </div>
          ) : !subMatrixFetched ? (
            <p className="py-10 text-center text-sm text-slate-400">Select filters and click Fetch Report.</p>
          ) : !subMatrixData || !subMatrixData.rows || subMatrixData.rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No records found for selected filters.</p>
          ) : (
            renderGenericSubMatrix()
          )}
        </Panel>
      ) : (
        <Panel
          title={
            targetReportFetched && targetReportData
              ? `FY ${targetReportData.start_year}-${String(targetReportData.end_year).slice(-2)} Target vs Achieved Report`
              : "Target vs Achieved Report"
          }
          subtitle="Dynamic monthly comparison matrix of sales target, achieved, and pending amounts"
          action={
            targetReportFetched && targetReportData && targetReportData.rows && targetReportData.rows.length > 0 && (
              <button onClick={handleExportTargetReport}
                disabled={exporting === "targetReport"}
                className="btn-secondary h-9 px-3 text-xs flex items-center gap-1.5">
                {exporting === "targetReport" ? <span className="h-3 w-3 border border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Download size={13} />}
                Export Excel
              </button>
            )
          }
        >
          {targetReportLoading ? (
            <div className="py-12 text-center">
              <div className="h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-400 mt-2">Loading target report data…</p>
            </div>
          ) : !targetReportFetched ? (
            <p className="py-10 text-center text-sm text-slate-400">Select filters and click Fetch Report.</p>
          ) : !targetReportData || !targetReportData.columns?.verticals || !targetReportData.rows || targetReportData.rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No report records found for selected period.</p>
          ) : (() => {
              const targetReportAgents = targetReportData.columns.verticals.reduce((acc, v) => [...acc, ...v.agents], []);
              return (
                <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm bg-white">
                  <table className="min-w-full border-collapse border-spacing-0">
                    <thead>
                      {/* Tier 1 Header */}
                      <tr className="bg-slate-100">
                        <th rowSpan={3} className="border border-slate-300 px-3 py-2 text-center font-bold text-slate-700 text-xs bg-slate-100">SL</th>
                        <th rowSpan={3} className="border border-slate-300 px-4 py-2 text-center font-bold text-slate-700 text-xs bg-slate-100">Month</th>
                        <th colSpan={targetReportAgents.length + 1} className="border border-slate-300 bg-[#ffff00] text-slate-900 px-3 py-2 text-center font-bold text-sm tracking-wide">Sales Target</th>
                        <th colSpan={targetReportAgents.length + 1} className="border border-slate-300 bg-[#00b050] text-white px-3 py-2 text-center font-bold text-sm tracking-wide">Achieved</th>
                        <th colSpan={targetReportAgents.length + 1} className="border border-slate-300 bg-[#ff0000] text-white px-3 py-2 text-center font-bold text-sm tracking-wide">Pending or Extra</th>
                      </tr>
                      
                      {/* Tier 2 Header (Verticals Categories) */}
                      <tr className="bg-slate-50">
                        {/* Target Category Headers */}
                        {targetReportData.columns.verticals.map(v => (
                          <th key={`t-v-${v.id}`} colSpan={v.agents.length} className="border border-slate-300 bg-slate-50 text-slate-800 px-2 py-1 font-semibold text-xs text-center">{v.name}</th>
                        ))}
                        <th rowSpan={2} className="border border-slate-300 bg-yellow-200 text-slate-800 px-2 py-1 font-bold text-xs text-center">Total</th>
                        {/* Achieved Category Headers */}
                        {targetReportData.columns.verticals.map(v => (
                          <th key={`a-v-${v.id}`} colSpan={v.agents.length} className="border border-slate-300 bg-slate-50 text-slate-800 px-2 py-1 font-semibold text-xs text-center">{v.name}</th>
                        ))}
                        <th rowSpan={2} className="border border-slate-300 bg-emerald-100 text-slate-800 px-2 py-1 font-bold text-xs text-center">Total</th>
                        {/* Pending Category Headers */}
                        {targetReportData.columns.verticals.map(v => (
                          <th key={`p-v-${v.id}`} colSpan={v.agents.length} className="border border-slate-300 bg-slate-50 text-slate-800 px-2 py-1 font-semibold text-xs text-center">{v.name}</th>
                        ))}
                        <th rowSpan={2} className="border border-slate-300 bg-rose-200 text-slate-800 px-2 py-1 font-bold text-xs text-center">Total</th>
                      </tr>
                      {/* Tier 3 Header (Agent Names) */}
                      <tr className="bg-slate-50">
                        {/* Target Agent Names */}
                        {targetReportAgents.map((a, idx) => <th key={`t-a-name-${a.id}-${idx}`} className="border border-slate-300 bg-white text-slate-600 px-2 py-1 text-xs font-semibold text-center">{a.clean_name}</th>)}
                        {/* Achieved Agent Names */}
                        {targetReportAgents.map((a, idx) => <th key={`a-a-name-${a.id}-${idx}`} className="border border-slate-300 bg-white text-slate-600 px-2 py-1 text-xs font-semibold text-center">{a.clean_name}</th>)}
                        {/* Pending Agent Names */}
                        {targetReportAgents.map((a, idx) => <th key={`p-a-name-${a.id}-${idx}`} className="border border-slate-300 bg-white text-slate-600 px-2 py-1 text-xs font-semibold text-center">{a.clean_name}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white font-mono">
                      {targetReportData.rows.map(row => (
                        <tr key={row.month_key} className="hover:bg-slate-50/50 transition-colors">
                          <td className="border border-slate-300 px-2 py-1.5 text-center font-semibold bg-slate-50 text-slate-700 text-xs">{row.sl}</td>
                          <td className="border border-slate-300 px-4 py-1.5 font-semibold bg-slate-50 text-slate-700 text-xs font-sans whitespace-nowrap">{row.month}</td>
                          
                          {/* Sales Target Cells */}
                          {targetReportAgents.map((a, idx) => (
                            <td key={`t-cell-${row.month_key}-${a.id}-${idx}`} className="border border-slate-200 px-2 py-1.5 text-right text-slate-700 text-xs">
                              {row.targets[a.id] !== undefined ? row.targets[a.id].toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                            </td>
                          ))}
                          <td className="border border-slate-300 bg-yellow-50 px-2 py-1.5 text-right font-bold text-slate-900 text-xs">{(row.totals.target ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          
                          {/* Achieved Cells */}
                          {targetReportAgents.map((a, idx) => (
                            <td key={`a-cell-${row.month_key}-${a.id}-${idx}`} className="border border-slate-200 px-2 py-1.5 text-right text-slate-700 text-xs">
                              {row.achieved[a.id] !== undefined ? row.achieved[a.id].toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                            </td>
                          ))}
                          <td className="border border-slate-300 bg-emerald-50 px-2 py-1.5 text-right font-bold text-slate-900 text-xs">{(row.totals.achieved ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          
                          {/* Pending/Extra Cells */}
                          {targetReportAgents.map((a, idx) => {
                            const pValue = row.pending[a.id] ?? 0;
                            return (
                              <td key={`p-cell-${row.month_key}-${a.id}-${idx}`} className={`border border-slate-200 px-2 py-1.5 text-right text-xs ${pValue < 0 ? 'text-emerald-600 font-bold bg-emerald-50/30' : 'text-slate-700'}`}>
                                {pValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            );
                          })}
                          <td className="border border-slate-300 bg-rose-50 px-2 py-1.5 text-right font-bold text-slate-900 text-xs">{(row.totals.pending ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                      {/* Grand Totals Row */}
                      {targetReportData.grand_totals && (
                        <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                          <td colSpan={2} className="border border-slate-300 px-2 py-2 text-center bg-slate-200 text-slate-800 text-xs font-sans">Total</td>
                          
                          {/* Target Grand Totals */}
                          {targetReportAgents.map((a, idx) => (
                            <td key={`gt-t-${a.id}-${idx}`} className="border border-slate-300 px-2 py-2 text-right text-slate-800 text-xs">
                              {(targetReportData.grand_totals.targets?.[a.id] ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          ))}
                          <td className="border border-slate-300 bg-yellow-100 px-2 py-2 text-right text-slate-900 text-xs">{(targetReportData.grand_totals.totals?.target ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          
                          {/* Achieved Grand Totals */}
                          {targetReportAgents.map((a, idx) => (
                            <td key={`gt-a-${a.id}-${idx}`} className="border border-slate-300 px-2 py-2 text-right text-slate-800 text-xs">
                              {(targetReportData.grand_totals.achieved?.[a.id] ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          ))}
                          <td className="border border-slate-300 bg-emerald-100 px-2 py-2 text-right text-slate-900 text-xs">{(targetReportData.grand_totals.totals?.achieved ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          
                          {/* Pending Grand Totals */}
                          {targetReportAgents.map((a, idx) => (
                            <td key={`gt-p-${a.id}-${idx}`} className="border border-slate-300 px-2 py-2 text-right text-slate-800 text-xs">
                              {(targetReportData.grand_totals.pending?.[a.id] ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          ))}
                          <td className="border border-slate-300 bg-rose-100 px-2 py-2 text-right text-slate-900 text-xs">{(targetReportData.grand_totals.totals?.pending ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })()}
        </Panel>
      )}
    </div>
  );
}

