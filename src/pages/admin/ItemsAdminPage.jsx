import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit2, RefreshCw, Search, Upload } from "lucide-react";
import { Panel, Input, Select } from "../../components/ui/index.jsx";
import { itemsApi, verticalsApi, firmsApi, subItemsApi } from "../../api/resources";
import { useApi, useMutation } from "../../api/hooks";
import { importsApi } from "../../api/resources";

const emptyForm = { name: "", unit: "PCS", rate: "", vertical_id: "", sub_item_id: "", firm_id: "" };

const getVerticalBadgeClass = (name) => {
  const map = {
    TYRE: "badge-brand",
    BATTERY: "badge-success",
    LUBES: "badge-warning",
    HAVELLS: "bg-violet-50 text-violet-700 border border-violet-100",
    SOLAR: "bg-orange-50 text-orange-700 border border-orange-100",
    GOV: "bg-cyan-50 text-cyan-700 border border-cyan-100",
  };
  return map[name] || "badge-slate";
};

export default function ItemsAdminPage() {
  const [search, setSearch] = useState("");
  const { data, loading, refetch } = useApi(() => itemsApi.list({ limit: 100, search }), [search]);
  const { data: vertsData } = useApi(() => verticalsApi.list(), []);
  const { data: firmsData } = useApi(() => firmsApi.list({ limit: 100 }), []);
  const { data: subItemsData } = useApi(() => subItemsApi.list({ limit: 100 }), []);
  const items = Array.isArray(data) ? data : data?.rows || [];
  const verticals = Array.isArray(vertsData) ? vertsData : vertsData?.rows || [];
  const firms = Array.isArray(firmsData) ? firmsData : firmsData?.rows || [];
  const subItems = Array.isArray(subItemsData) ? subItemsData : subItemsData?.rows || [];

  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const filteredSubItems = subItems.filter(si => !form.vertical_id || String(si.vertical_id) === String(form.vertical_id));
  const [feedback, setFeedback] = useState({ type: "", msg: "" });
  const [importing, setImporting] = useState(false);

  const { mutate: create, loading: creating } = useMutation((d) => itemsApi.create(d));
  const { mutate: update, loading: updating } = useMutation((id, d) => itemsApi.update(id, d));
  const { mutate: remove } = useMutation((id) => itemsApi.delete(id));

  const notify = (type, msg) => { setFeedback({ type, msg }); setTimeout(() => setFeedback({ type: "", msg: "" }), 3000); };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const res = await create({ 
      ...form, 
      vertical_id: Number(form.vertical_id) || undefined, 
      sub_item_id: Number(form.sub_item_id) || undefined, 
      firm_id: Number(form.firm_id) || undefined, 
      rate: Number(form.rate) || 0 
    });
    if (res.success) { notify("success", "Item created"); refetch(); setForm(emptyForm); }
    else notify("error", res.error);
  };

  const handleUpdate = async (id) => {
    const res = await update(id, { ...editForm, rate: Number(editForm.rate) || 0 });
    if (res.success) { notify("success", "Item updated"); refetch(); setEditId(null); }
    else notify("error", res.error);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this item?")) return;
    const res = await remove(id);
    if (res.success) { notify("success", "Item deleted"); refetch(); }
    else notify("error", res.error);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      await importsApi.items(fd);
      notify("success", "Items imported successfully");
      refetch();
    } catch (err) {
      notify("error", err?.response?.data?.message || "Import failed");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const unitOptions = ["PCS", "KG", "LTR", "BOX", "SET", "MTR"].map((u) => ({ label: u, value: u }));
  const verticalOptions = [{ label: "All Verticals", value: "" }, ...verticals.map((v) => ({ label: v.name, value: String(v.id) }))];
  const firmOptions = [{ label: "All Firms", value: "" }, ...firms.map((f) => ({ label: f.name, value: String(f.id) }))];

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Admin</p>
          <h1 className="font-display font-bold text-2xl text-slate-900">Items / Products</h1>
          <p className="text-sm text-slate-500 mt-0.5">{items.length} items loaded</p>
        </div>
        <label className="btn-secondary h-9 px-4 text-xs flex items-center gap-2 cursor-pointer">
          {importing ? <span className="h-3 w-3 border border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Upload size={13} />}
          Import Excel
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} disabled={importing} />
        </label>
      </motion.div>

      {feedback.msg && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl px-4 py-3 text-sm font-medium ${feedback.type === "success" ? "bg-emerald-50 border border-emerald-100 text-emerald-700" : "bg-rose-50 border border-rose-100 text-rose-700"}`}>
          {feedback.msg}
        </motion.div>
      )}

      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <Panel title="Add Item">
          <form onSubmit={handleCreate} className="space-y-4">
            <Input label="Item Name *" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="e.g. CEAT Milaze 165/65 R14" />
            <Select label="Unit" value={form.unit} options={unitOptions} onChange={(v) => setForm((p) => ({ ...p, unit: v }))} />
            <Input label="Rate (₹)" type="number" value={form.rate} onChange={(v) => setForm((p) => ({ ...p, rate: v }))} placeholder="0.00" />
            <Select label="Vertical" value={form.vertical_id} options={verticalOptions} onChange={(v) => setForm((p) => ({ ...p, vertical_id: v, sub_item_id: "" }))} />
            <Select 
              label="Sub-Item" 
              value={form.sub_item_id} 
              options={[{ label: "Select Sub-Item", value: "" }, ...filteredSubItems.map(si => ({ label: si.name, value: String(si.id) }))]} 
              onChange={(v) => {
                const selectedSub = subItems.find(si => String(si.id) === String(v));
                setForm((p) => ({ 
                  ...p, 
                  sub_item_id: v,
                  vertical_id: selectedSub ? String(selectedSub.vertical_id) : p.vertical_id 
                }));
              }} 
            />
            <Select label="Firm" value={form.firm_id} options={firmOptions} onChange={(v) => setForm((p) => ({ ...p, firm_id: v }))} />
            <button type="submit" disabled={creating} className="btn-primary w-full justify-center h-11">
              {creating ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={18} />}
              Add Item
            </button>
          </form>
        </Panel>

        <Panel title="All Items" action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items…" className="input-field h-8 pl-8 pr-3 text-xs w-48" />
            </div>
            <button onClick={refetch} disabled={loading} className="btn-secondary h-8 px-3 flex items-center gap-1.5 text-xs">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        }>
          {loading ? (
            <div className="py-10 text-center"><div className="h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : items.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No items found.</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr><th>Name</th><th>Unit</th><th>Rate</th><th>Vertical</th><th>Sub-Item</th><th>Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="font-medium">
                        {editId === item.id ? (
                          <input value={editForm.name || ""} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} className="input-field h-7 text-xs w-40 px-2" />
                        ) : item.name}
                      </td>
                      <td>{item.unit}</td>
                      <td className="font-semibold">₹{item.rate || 0}</td>
                      <td>
                        {item.Vertical?.name ? (
                          <span className={`badge ${getVerticalBadgeClass(item.Vertical.name)}`}>
                            {item.Vertical.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">-</span>
                        )}
                      </td>
                      <td>
                        {item.SubItem?.name ? (
                          <span className="font-medium text-slate-700">{item.SubItem.name}</span>
                        ) : (
                          <span className="text-slate-400 font-medium">-</span>
                        )}
                      </td>
                      <td>
                        {editId === item.id ? (
                          <div className="flex gap-2">
                            <input value={editForm.rate || ""} onChange={(e) => setEditForm((p) => ({ ...p, rate: e.target.value }))} placeholder="Rate" className="input-field h-7 text-xs w-20 px-2" />
                            <button onClick={() => handleUpdate(item.id)} disabled={updating} className="text-xs font-semibold text-emerald-600">Save</button>
                            <button onClick={() => setEditId(null)} className="text-xs text-slate-400">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex gap-1.5">
                            <button onClick={() => { setEditId(item.id); setEditForm({ name: item.name, rate: item.rate, unit: item.unit }); }} className="text-slate-400 hover:text-brand-600"><Edit2 size={14} /></button>
                            <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-rose-500"><Trash2 size={14} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
