import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Filter, Download } from "lucide-react";
import { Panel, DataTable, Select } from "../components/ui/index.jsx";
import { purchasesApi, reportsApi, exportsApi, firmsApi } from "../api/resources";
import { useApi } from "../api/hooks";
import { downloadBlob } from "../api/hooks";
import { currency } from "../utils/helpers";

export default function PurchasePage() {
  const [firmId, setFirmId] = useState("");
  const [exporting, setExporting] = useState("");

  const { data: firmsData } = useApi(() => firmsApi.list({ limit: 100 }), []);
  const firms = Array.isArray(firmsData) ? firmsData : firmsData?.rows || [];

  const buildParams = () => firmId ? { firm_id: firmId } : {};

  const { data: purchasesData, loading: purchasesLoading, refetch: refetchPurchases } = useApi(
    () => purchasesApi.list({ limit: 50, ...buildParams() }), [firmId]
  );
  const { data: salesOutData, loading: salesOutLoading, refetch: refetchSalesOut } = useApi(
    () => reportsApi.salesOutstanding(buildParams()), [firmId]
  );
  const { data: purchaseOutData, loading: purchaseOutLoading, refetch: refetchPurchaseOut } = useApi(
    () => reportsApi.purchaseOutstanding(buildParams()), [firmId]
  );

  const rawPurchases = Array.isArray(purchasesData) ? purchasesData : purchasesData?.rows || [];
  const purchases = rawPurchases.map((row) => {
    const fName = row.firm || row.Firm?.name || (row.Branch?.name === "Group" ? "NEW DHARMESH WARI TYRE" : "");
    const bName = row.branch || row.Branch?.name || "";
    return {
      ...row,
      date: row.date || row.order_date || "",
      firm: fName,
      branch: bName,
      vendor: row.vendor || row.vendor_name || "",
      invoice_no: row.invoice_no || row.order_number || "-",
      items_count: `${row.orderItems?.length || 0} ${row.orderItems?.length === 1 ? "item" : "items"}`,
      total_amount: Number(row.total_amount || 0),
      paid_amount: Number(row.paid_amount || 0),
      outstanding: Number(row.outstanding_amount || row.outstanding || 0),
    };
  });

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

  const salesOutRaw = Array.isArray(salesOutData) ? salesOutData : salesOutData?.rows || [];
  const purchaseOutRaw = Array.isArray(purchaseOutData) ? purchaseOutData : purchaseOutData?.rows || [];

  const salesOut = salesOutRaw.map((row) => {
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
  });

  const purchaseOut = purchaseOutRaw.map((row) => ({
    ...row,
    vendor: row.vendor_name || row.vendor || "",
    firm: row.firm || row.firm_name || (row.branch === "Group" || row.branch_name === "Group" ? "NEW DHARMESH WARI TYRE" : ""),
    branch: row.branch || row.branch_name || "",
    total: Number(row.total_amount || row.total || 0),
    paid: Number(row.paid_amount || row.paid || 0),
    outstanding: Number(row.outstanding_amount || row.outstanding || 0),
  }));

  // Build combined outstanding by firm/branch
  const combinedOut = (() => {
    const byKey = {};
    salesOut.forEach((r) => {
      const key = `${r.firm || r.firm_name}|${r.branch || r.branch_name}`;
      byKey[key] ||= { firm: r.firm || r.firm_name, branch: r.branch || r.branch_name, salesOutstanding: 0, purchaseOutstanding: 0, grandOutstanding: 0 };
      byKey[key].salesOutstanding += Number(r.outstanding || r.amount || 0);
    });
    purchaseOut.forEach((r) => {
      const key = `${r.firm || r.firm_name}|${r.branch || r.branch_name}`;
      byKey[key] ||= { firm: r.firm || r.firm_name, branch: r.branch || r.branch_name, salesOutstanding: 0, purchaseOutstanding: 0, grandOutstanding: 0 };
      byKey[key].purchaseOutstanding += Number(r.outstanding || r.amount || 0);
    });
    Object.values(byKey).forEach((r) => { r.grandOutstanding = r.salesOutstanding + r.purchaseOutstanding; });
    return Object.values(byKey);
  })();

  const loading = purchasesLoading || salesOutLoading || purchaseOutLoading;

  const refetchAll = () => { refetchPurchases(); refetchSalesOut(); refetchPurchaseOut(); };

  const handleExport = async (type, fileName) => {
    setExporting(type);
    try {
      const res = type === "purchase"
        ? await exportsApi.purchaseOutstanding(buildParams())
        : await exportsApi.salesOutstanding(buildParams());
      downloadBlob(res, fileName);
    } catch (e) {
      console.error("Export failed:", e);
    } finally {
      setExporting("");
    }
  };

  const firmOptions = [{ label: "All Firms", value: "" }, ...firms.map((f) => ({ label: f.name, value: String(f.id) }))];
  const totalPurchaseOut = purchases.reduce((s, r) => s + Number(r.outstanding || r.balance || 0), 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Procurement</p>
          <h1 className="font-display font-bold text-2xl text-slate-900">Purchase Outstanding</h1>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">Vendor payments and combined outstanding</p>
        </div>
        <button onClick={refetchAll} disabled={loading} className="btn-secondary h-9 px-3 flex items-center gap-2">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Loading…" : "Refresh"}
        </button>
      </motion.div>

      {/* Firm Filter */}
      <div className="card-lg">
        <div className="flex items-end gap-4">
          <div className="w-64">
            <Select label="Filter by Firm" value={firmId} options={firmOptions} onChange={setFirmId} />
          </div>
          {totalPurchaseOut > 0 && (
            <div className="flex-1">
              <p className="text-xs text-slate-400 font-medium">Purchase Outstanding</p>
              <p className="text-xl font-display font-bold text-rose-600">{currency(totalPurchaseOut)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="Purchase Records"
          subtitle="All vendor invoices and payment status"
          action={
            <button onClick={() => handleExport("purchase", "purchase-outstanding.xlsx")}
              disabled={exporting === "purchase"}
              className="btn-secondary h-9 px-3 text-xs flex items-center gap-1.5">
              {exporting === "purchase" ? <span className="h-3 w-3 border border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Download size={13} />}
              Export
            </button>
          }
        >
          {purchasesLoading ? (
            <div className="py-10 text-center"><div className="h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : purchases.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No purchase records.</p>
          ) : (
            <DataTable rows={purchases} columns={["date", "firm", "branch", "vendor", "invoice_no", "items_count", "total_amount", "paid_amount", "outstanding"]} />
          )}
        </Panel>

        <Panel
          title="Combined Outstanding"
          subtitle="Sales + Purchase outstanding by firm & branch"
          action={
            <button onClick={() => handleExport("sales", "sales-outstanding.xlsx")}
              disabled={exporting === "sales"}
              className="btn-secondary h-9 px-3 text-xs flex items-center gap-1.5">
              {exporting === "sales" ? <span className="h-3 w-3 border border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Download size={13} />}
              Export Sales
            </button>
          }
        >
          {loading ? (
            <div className="py-10 text-center"><div className="h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : combinedOut.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No outstanding data.</p>
          ) : (
            <DataTable rows={combinedOut} columns={["firm", "branch", "salesOutstanding", "purchaseOutstanding", "grandOutstanding"]} />
          )}
        </Panel>
      </div>
    </div>
  );
}
