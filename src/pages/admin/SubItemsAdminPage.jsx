import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import { Panel, Input, Select } from "../../components/ui/index.jsx";
import { subItemsApi, verticalsApi } from "../../api/resources";
import { useApi, useMutation } from "../../api/hooks";

export default function SubItemsAdminPage() {
  const { data, loading, refetch } = useApi(() => subItemsApi.list({ limit: 100 }), []);
  const { data: vertsData } = useApi(() => verticalsApi.list(), []);
  const subItems = Array.isArray(data) ? data : data?.rows || [];
  const verticals = Array.isArray(vertsData) ? vertsData : vertsData?.rows || [];

  const [form, setForm] = useState({ name: "", vertical_id: "" });
  const [feedback, setFeedback] = useState({ type: "", msg: "" });

  const { mutate: create, loading: creating } = useMutation((d) => subItemsApi.create(d));
  const { mutate: remove } = useMutation((id) => subItemsApi.delete(id));

  const notify = (type, msg) => { 
    setFeedback({ type, msg }); 
    setTimeout(() => setFeedback({ type: "", msg: "" }), 3000); 
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.vertical_id) return;
    const res = await create({ name: form.name, vertical_id: Number(form.vertical_id) });
    if (res.success) { 
      notify("success", "Sub-Item created successfully"); 
      refetch(); 
      setForm({ name: "", vertical_id: "" }); 
    } else {
      notify("error", res.error || "Failed to create Sub-Item");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this sub-item?")) return;
    const res = await remove(id);
    if (res.success) { 
      notify("success", "Sub-Item deleted"); 
      refetch(); 
    } else {
      notify("error", res.error || "Failed to delete");
    }
  };

  const verticalOptions = [{ label: "Select Vertical", value: "" }, ...verticals.map((v) => ({ label: v.name, value: String(v.id) }))];

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Admin</p>
          <h1 className="font-display font-bold text-2xl text-slate-900">Sub-Items / Categories</h1>
          <p className="text-sm text-slate-500 mt-0.5">{subItems.length} sub-items loaded</p>
        </div>
      </motion.div>

      {feedback.msg && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl px-4 py-3 text-sm font-medium ${feedback.type === "success" ? "bg-emerald-50 border border-emerald-100 text-emerald-700" : "bg-rose-50 border border-rose-100 text-rose-700"}`}>
          {feedback.msg}
        </motion.div>
      )}

      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <Panel title="Add Sub-Item">
          <form onSubmit={handleCreate} className="space-y-4">
            <Input label="Sub-Item Name *" value={form.name} onChange={(v) => setForm(p => ({ ...p, name: v }))} placeholder="e.g. IB BATTERY" />
            <Select label="Vertical" value={form.vertical_id} options={verticalOptions} onChange={(v) => setForm(p => ({ ...p, vertical_id: v }))} />
            <button type="submit" disabled={creating} className="btn-primary w-full justify-center h-11">
              {creating ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={18} />}
              Add Sub-Item
            </button>
          </form>
        </Panel>

        <Panel title="All Sub-Items" action={
          <button onClick={refetch} disabled={loading} className="btn-secondary h-8 px-3 flex items-center gap-1.5 text-xs">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        }>
          {loading ? (
            <div className="py-10 text-center"><div className="h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : subItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No sub-items found.</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr><th>Name</th><th>Vertical</th><th>Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {subItems.map((si) => (
                    <tr key={si.id}>
                      <td className="font-medium">{si.name}</td>
                      <td>
                        {si.Vertical?.name ? (
                          <span className="font-semibold text-slate-700">{si.Vertical.name}</span>
                        ) : (
                          <span className="text-slate-400 font-medium">-</span>
                        )}
                      </td>
                      <td>
                        <button onClick={() => handleDelete(si.id)} className="text-slate-400 hover:text-rose-500"><Trash2 size={14} /></button>
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
