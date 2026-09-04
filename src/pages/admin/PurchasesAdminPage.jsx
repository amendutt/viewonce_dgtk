import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit2, RefreshCw, Filter, IndianRupee, Upload } from "lucide-react";
import { Panel, Input, Select } from "../../components/ui/index.jsx";
import { purchasesApi, firmsApi, branchesApi, itemsApi } from "../../api/resources";
import { useApi, useMutation } from "../../api/hooks";
import { currency } from "../../utils/helpers";
import { importsApi } from "../../api/resources";
import { downloadBlob } from "../../api/hooks";
import { exportsApi } from "../../api/resources";

const emptyForm = { vendor_name: "", invoice_no: "", firm_id: "", branch_id: "", items: [{ item_name: "", quantity: 1, unit: "PCS", rate: 0 }] };

export default function PurchasesAdminPage() {
  const [firmId, setFirmId] = useState("");
  const { data, loading, refetch } = useApi(() => purchasesApi.list({ limit: 50, ...(firmId ? { firm_id: firmId } : {}) }), [firmId]);
  const { data: firmsData } = useApi(() => firmsApi.list({ limit: 100 }), []);
  const { data: branchesData } = useApi(() => branchesApi.list({ limit: 100 }), []);
  const rawPurchases = Array.isArray(data) ? data : data?.rows || [];
  const purchases = rawPurchases.map((po) => {
    const fName = po.firm || po.firm_name || po.Firm?.name || (po.Branch?.name === "Group" ? "NEW DHARMESH WARI TYRE" : "");
    return {
      ...po,
      invoice_no: po.invoice_no || po.order_number || "-",
      firm: fName,
      firm_name: fName,
      outstanding: Number(po.outstanding_amount || po.outstanding || po.balance || 0),
    };
  });
  const firms = Array.isArray(firmsData) ? firmsData : firmsData?.rows || [];
  const branches = Array.isArray(branchesData) ? branchesData : branchesData?.rows || [];
  const { data: itemsData } = useApi(() => itemsApi.list({ limit: 1000 }), []);
  const existingItems = Array.isArray(itemsData) ? itemsData : itemsData?.rows || [];

  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [feedback, setFeedback] = useState({ type: "", msg: "" });
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { mutate: create, loading: creating } = useMutation((d) => purchasesApi.create(d));
  const { mutate: remove } = useMutation((id) => purchasesApi.delete(id));
  const { mutate: pay } = useMutation((id, amt) => purchasesApi.pay(id, amt));

  const notify = (type, msg) => { setFeedback({ type, msg }); setTimeout(() => setFeedback({ type: "", msg: "" }), 3000); };

  const handleCreate = async (e) => {
    e.preventDefault();
    const res = await create({
      vendor_name: form.vendor_name,
      invoice_no: form.invoice_no,
      firm_id: Number(form.firm_id),
      branch_id: Number(form.branch_id),
      items: form.items.map(({ item_name, quantity, unit, rate }) => ({ item_name, quantity: Number(quantity), unit, rate: Number(rate) })),
    });
    if (res.success) { notify("success", "Purchase order created"); refetch(); setForm(emptyForm); setShowForm(false); }
    else notify("error", res.error);
  };

  const handlePay = async (id) => {
    if (!payAmount) return;
    const res = await pay(id, Number(payAmount));
    if (res.success) { notify("success", "Payment recorded"); refetch(); setPayingId(null); setPayAmount(""); }
    else notify("error", res.error);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this purchase order?")) return;
    const res = await remove(id);
    if (res.success) { notify("success", "Deleted"); refetch(); }
    else notify("error", res.error);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImporting(true);
    const fd = new FormData(); fd.append("file", file);
    try { await importsApi.purchases(fd); notify("success", "Purchases imported"); refetch(); }
    catch (err) { notify("error", err?.response?.data?.message || "Import failed"); }
    finally { setImporting(false); e.target.value = ""; }
  };

  const handleExport = async () => {
    setExporting(true);
    try { const res = await exportsApi.purchaseOutstanding(firmId ? { firm_id: firmId } : {}); downloadBlob(res, "purchase-outstanding.xlsx"); }
    catch (e) { console.error(e); } finally { setExporting(false); }
  };

  const firmOptions = [{ label: "All Firms", value: "" }, ...firms.map((f) => ({ label: f.name, value: String(f.id) }))];
  const branchOptions = [{ label: "Select Branch", value: "" }, ...branches.map((b) => ({ label: b.name, value: String(b.id) }))];
  const totalOut = purchases.reduce((s, r) => s + Number(r.outstanding || r.balance || 0), 0);

  const updateItem = (index, field, value) => {
    setForm((p) => {
      const items = [...p.items];
      const updatedItem = { ...items[index], [field]: value };
      if (field === "item_name") {
        const found = existingItems.find((item) => item.name === value);
        if (found) {
          updatedItem.unit = found.unit || updatedItem.unit || "PCS";
          updatedItem.rate = found.rate || found.rate === 0 ? found.rate : updatedItem.rate;
        }
      }
      items[index] = updatedItem;
      return { ...p, items };
    });
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Admin</p>
          <h1 className="font-display font-bold text-2xl text-slate-900">Purchase Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">Vendor invoices and payment tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="btn-secondary h-9 px-3 text-xs flex items-center gap-2 cursor-pointer">
            {importing ? <span className="h-3 w-3 border border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Upload size={13} />}
            Import
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          <button onClick={handleExport} disabled={exporting} className="btn-secondary h-9 px-3 text-xs flex items-center gap-2">
            Export Outstanding
          </button>
          <button onClick={() => setShowForm((p) => !p)} className="btn-primary h-9 px-4 text-xs flex items-center gap-2">
            <Plus size={14} /> New Purchase
          </button>
        </div>
      </motion.div>

      {feedback.msg && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl px-4 py-3 text-sm font-medium ${feedback.type === "success" ? "bg-emerald-50 border border-emerald-100 text-emerald-700" : "bg-rose-50 border border-rose-100 text-rose-700"}`}>
          {feedback.msg}
        </motion.div>
      )}

      {/* Outstanding Banner */}
      {totalOut > 0 && (
        <div className="card-lg bg-gradient-to-r from-rose-500 to-rose-600 text-white">
          <p className="text-rose-100 text-xs font-bold uppercase tracking-wider">Total Purchase Outstanding</p>
          <p className="text-3xl font-display font-bold mt-1">{currency(totalOut)}</p>
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <Panel title="New Purchase Order">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Vendor Name *" value={form.vendor_name} onChange={(v) => setForm((p) => ({ ...p, vendor_name: v }))} placeholder="Supplier name" />
              <Input label="Invoice No" value={form.invoice_no} onChange={(v) => setForm((p) => ({ ...p, invoice_no: v }))} placeholder="INV-001" />
              <Select label="Firm *" value={form.firm_id} options={firmOptions} onChange={(v) => setForm((p) => ({ ...p, firm_id: v }))} />
              <Select label="Branch" value={form.branch_id} options={branchOptions} onChange={(v) => setForm((p) => ({ ...p, branch_id: v }))} />

            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Items</p>
              <div className="grid gap-2 sm:grid-cols-5 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <span className="col-span-2">Item Name</span>
                <span>Unit</span>
                <span>Quantity</span>
                <span>Rate</span>
              </div>
              {form.items.map((item, idx) => (
                <div key={idx} className="grid gap-2 sm:grid-cols-5 mb-2">
                  <input value={item.item_name} onChange={(e) => updateItem(idx, "item_name", e.target.value)} placeholder="Item name" list="existing-items-list" className="input-field h-8 text-xs px-2 col-span-2" />
                  <input value={item.unit || "PCS"} onChange={(e) => updateItem(idx, "unit", e.target.value)} placeholder="Unit" className="input-field h-8 text-xs px-2" />
                  <input type="number" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))} placeholder="Qty" className="input-field h-8 text-xs px-2" />
                  <input type="number" value={item.rate} onChange={(e) => updateItem(idx, "rate", Number(e.target.value))} placeholder="Rate" className="input-field h-8 text-xs px-2" />
                </div>
              ))}
              <button type="button" onClick={() => setForm((p) => ({ ...p, items: [...p.items, { item_name: "", quantity: 1, unit: "PCS", rate: 0 }] }))}
                className="text-xs text-brand-600 font-semibold hover:text-brand-700">+ Add Item</button>
            </div>
            <datalist id="existing-items-list">
              {existingItems.map((item) => (
                <option key={item.id} value={item.name} />
              ))}
            </datalist>
            <div className="flex gap-3">
              <button type="submit" disabled={creating} className="btn-primary h-10 px-6">
                {creating ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
                Create Purchase
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary h-10 px-6">Cancel</button>
            </div>
          </form>
        </Panel>
      )}

      {/* Filter */}
      <div className="card-lg">
        <div className="grid gap-4 sm:grid-cols-3 items-end">
          <Select label="Filter by Firm" value={firmId} options={firmOptions} onChange={setFirmId} />
          <button onClick={refetch} disabled={loading} className="btn-secondary h-11 justify-center">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <Panel title="Purchase Records" subtitle={`${purchases.length} records`}>
        {loading ? (
          <div className="py-10 text-center"><div className="h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : purchases.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No purchase records found.</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Vendor</th><th>Invoice</th><th>Items</th><th>Firm</th><th>Total</th><th>Paid</th><th>Outstanding</th><th>Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {purchases.map((po) => (
                  <tr key={po.id}>
                    <td className="font-mono text-xs">#{po.id}</td>
                    <td className="font-medium">{po.vendor || po.vendor_name}</td>
                    <td className="font-mono text-xs">{po.invoice_no}</td>
                    <td className="text-xs" title={po.orderItems?.map(i => `${i.item_name} (x${parseFloat(i.quantity)})`).join("\n")}>
                      <div className="font-semibold text-slate-800">
                        {po.orderItems?.length || 0} {po.orderItems?.length === 1 ? "item" : "items"}
                      </div>
                      {po.orderItems?.length > 0 && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                          {po.orderItems.map(i => i.item_name).join(", ")}
                        </div>
                      )}
                    </td>
                    <td>{po.firm_name || po.firm}</td>
                    <td className="font-semibold">{currency(po.total_amount || po.total || 0)}</td>
                    <td className="text-emerald-700 font-semibold">{currency(po.paid_amount || po.paid || 0)}</td>
                    <td className="text-rose-600 font-semibold">{currency(po.outstanding || po.balance || 0)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        {payingId === po.id ? (
                          <div className="flex items-center gap-1.5">
                            <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Amount" className="input-field h-7 text-xs w-24 px-2" />
                            <button onClick={() => handlePay(po.id)} className="text-xs font-semibold text-emerald-600">Pay</button>
                            <button onClick={() => setPayingId(null)} className="text-xs text-slate-400">Cancel</button>
                          </div>
                        ) : (
                          <>
                            <button onClick={() => setPayingId(po.id)} className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                              <IndianRupee size={12} /> Pay
                            </button>
                            <button onClick={() => handleDelete(po.id)} className="text-slate-400 hover:text-rose-500"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
