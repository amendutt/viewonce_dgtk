import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, CheckCircle, AlertCircle, FileSpreadsheet } from "lucide-react";
import { importsApi, exportsApi } from "../../api/resources";
import { downloadBlob } from "../../api/hooks";

const importTypes = [
  {
    id: "salesOrders",
    label: "Sales Orders",
    description: "Import bulk sales orders from Excel/CSV. Required columns: party, item, qty, unit, rate, payment_mode, agent_name, firm, branch.",
    color: "brand",
    apiFn: (fd) => importsApi.salesOrders(fd),
    templateFn: (p) => exportsApi.dailySales(p),
    templateFile: "sales-orders-template.xlsx",
  },
  {
    id: "purchases",
    label: "Purchase Orders",
    description: "Import purchase invoices. Required columns: vendor, invoice_no, firm, branch, item, qty, unit, rate, total_amount.",
    color: "violet",
    apiFn: (fd) => importsApi.purchases(fd),
    templateFn: (p) => exportsApi.purchaseOutstanding(p),
    templateFile: "purchase-template.xlsx",
  },
  {
    id: "items",
    label: "Item Master",
    description: "Bulk import product/item master. Required columns: Item, Total Qty, Unit, Vertical, Sub-Item, Rate, Firm, Branch.",
    color: "emerald",
    apiFn: (fd) => importsApi.items(fd),
    templateFn: (p) => exportsApi.bulkItems(p),
    templateFile: "items-template.xlsx",
  },
];

const toneClasses = {
  brand: { bg: "bg-brand-50", text: "text-brand-700", border: "border-brand-200", btn: "btn-primary" },
  violet: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", btn: "bg-violet-600 text-white hover:bg-violet-700 btn-primary" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", btn: "bg-emerald-600 text-white hover:bg-emerald-700 btn-primary" },
};

export default function ImportsAdminPage() {
  const [statuses, setStatuses] = useState({});
  const [loadingId, setLoadingId] = useState(null);

  const setStatus = (id, type, msg) => setStatuses((p) => ({ ...p, [id]: { type, msg } }));

  const handleImport = async (importType, e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setLoadingId(importType.id);
    setStatus(importType.id, "loading", "Importing…");
    const fd = new FormData(); fd.append("file", file);
    try {
      const res = await importType.apiFn(fd);
      const data = res?.data;
      const count = data?.inserted || data?.count || data?.data?.length || "";
      setStatus(importType.id, "success", `Import successful${count ? ` — ${count} records processed` : ""}`);
    } catch (err) {
      setStatus(importType.id, "error", err?.response?.data?.message || "Import failed. Check file format.");
    } finally {
      setLoadingId(null);
      e.target.value = "";
    }
  };

  const handleDownloadTemplate = async (importType) => {
    try {
      const res = await importType.templateFn({});
      downloadBlob(res, importType.templateFile);
    } catch (e) {
      console.error("Template download failed", e);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Admin</p>
        <h1 className="font-display font-bold text-2xl text-slate-900">Excel Imports</h1>
        <p className="text-sm text-slate-500 mt-0.5">Upload .xlsx, .xls, or .csv files to bulk-import data</p>
      </motion.div>

      {/* Info Banner */}
      <div className="card-lg bg-amber-50 border border-amber-100">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Before importing</p>
            <p className="text-xs text-amber-700 mt-0.5">Download the template first to see required column names. Ensure your file has a header row. Maximum 5000 rows per import.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-1 xl:grid-cols-3">
        {importTypes.map((importType, i) => {
          const tone = toneClasses[importType.color];
          const st = statuses[importType.id];
          const isLoading = loadingId === importType.id;

          return (
            <motion.div key={importType.id} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}
              className={`card-lg border ${tone.border}`}>
              <div className={`h-12 w-12 rounded-2xl ${tone.bg} flex items-center justify-center mb-4`}>
                <FileSpreadsheet size={24} className={tone.text} />
              </div>
              <h3 className="font-display font-bold text-lg text-slate-900">{importType.label}</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{importType.description}</p>

              {st && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className={`mt-4 flex items-start gap-2 rounded-xl p-3 text-xs font-medium ${st.type === "success" ? "bg-emerald-50 text-emerald-700" : st.type === "error" ? "bg-rose-50 text-rose-700" : "bg-slate-50 text-slate-600"}`}>
                  {st.type === "success" && <CheckCircle size={14} className="shrink-0 mt-0.5" />}
                  {st.type === "error" && <AlertCircle size={14} className="shrink-0 mt-0.5" />}
                  {st.msg}
                </motion.div>
              )}

              <div className="mt-5 space-y-3">
                <label className={`w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold cursor-pointer transition-all ${tone.btn} ${isLoading ? "opacity-70 cursor-wait" : ""}`}>
                  {isLoading ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={15} />}
                  {isLoading ? "Uploading…" : `Upload ${importType.label}`}
                  <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => handleImport(importType, e)} disabled={isLoading} />
                </label>
                <button onClick={() => handleDownloadTemplate(importType)}
                  className="w-full btn-secondary h-9 text-xs flex items-center justify-center gap-2">
                  Download Template
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
