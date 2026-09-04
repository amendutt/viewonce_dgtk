import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit2, Building2, RefreshCw } from "lucide-react";
import { Panel, Input } from "../../components/ui/index.jsx";
import { firmsApi } from "../../api/resources";
import { useApi, useMutation } from "../../api/hooks";

export default function FirmsAdminPage() {
  const { data, loading, refetch } = useApi(() => firmsApi.list({ limit: 100 }), []);
  const firms = Array.isArray(data) ? data : data?.rows || [];

  const [form, setForm] = useState({ name: "", address: "", gst: "", phone: "" });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [feedback, setFeedback] = useState({ type: "", msg: "" });

  const { mutate: create, loading: creating } = useMutation((d) => firmsApi.create(d));
  const { mutate: update, loading: updating } = useMutation((id, d) => firmsApi.update(id, d));
  const { mutate: remove } = useMutation((id) => firmsApi.delete(id));

  const notify = (type, msg) => { setFeedback({ type, msg }); setTimeout(() => setFeedback({ type: "", msg: "" }), 3000); };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const res = await create(form);
    if (res.success) { notify("success", "Firm created"); refetch(); setForm({ name: "", address: "", gst: "", phone: "" }); }
    else notify("error", res.error);
  };

  const handleUpdate = async (id) => {
    const res = await update(id, editForm);
    if (res.success) { notify("success", "Firm updated"); refetch(); setEditId(null); }
    else notify("error", res.error);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this firm?")) return;
    const res = await remove(id);
    if (res.success) { notify("success", "Firm deleted"); refetch(); }
    else notify("error", res.error);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Admin</p>
        <h1 className="font-display font-bold text-2xl text-slate-900">Firms Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">{firms.length} firms registered</p>
      </motion.div>

      {feedback.msg && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl px-4 py-3 text-sm font-medium ${feedback.type === "success" ? "bg-emerald-50 border border-emerald-100 text-emerald-700" : "bg-rose-50 border border-rose-100 text-rose-700"}`}>
          {feedback.msg}
        </motion.div>
      )}

      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <Panel title="Add Firm">
          <form onSubmit={handleCreate} className="space-y-4">
            <Input label="Firm Name *" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="e.g. Dharmeshwari Tyres" />
            <Input label="Address" value={form.address} onChange={(v) => setForm((p) => ({ ...p, address: v }))} placeholder="City, State" />
            <Input label="GSTIN" value={form.gst} onChange={(v) => setForm((p) => ({ ...p, gst: v }))} placeholder="09ABCDE1234F1Z5" />
            <Input label="Phone" value={form.phone} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} placeholder="+91 98765 43210" />
            <button type="submit" disabled={creating} className="btn-primary w-full justify-center h-11">
              {creating ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={18} />}
              Add Firm
            </button>
          </form>
        </Panel>

        <Panel title="All Firms" action={
          <button onClick={refetch} disabled={loading} className="btn-secondary h-8 px-3 flex items-center gap-1.5 text-xs">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        }>
          {loading ? (
            <div className="py-10 text-center"><div className="h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : firms.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No firms found.</p>
          ) : (
            <div className="space-y-3">
              {firms.map((firm, i) => (
                <motion.div key={firm.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 hover:bg-brand-50/50 transition-colors group">
                  <div className="h-10 w-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 font-bold text-sm">
                    {firm.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    {editId === firm.id ? (
                      <div className="space-y-2">
                        <input value={editForm.name || ""} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} className="input-field text-sm h-8 py-1 px-2 w-full" placeholder="Firm name" />
                        <input value={editForm.gst || ""} onChange={(e) => setEditForm((p) => ({ ...p, gst: e.target.value }))} className="input-field text-sm h-8 py-1 px-2 w-full" placeholder="GSTIN" />
                        <div className="flex gap-2 mt-1">
                          <button onClick={() => handleUpdate(firm.id)} disabled={updating} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">Save</button>
                          <button onClick={() => setEditId(null)} className="text-xs text-slate-400">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-slate-800">{firm.name}</p>
                        {firm.gst && <p className="text-xs text-slate-400 font-mono">{firm.gst}</p>}
                        {firm.address && <p className="text-xs text-slate-400">{firm.address}</p>}
                      </>
                    )}
                  </div>
                  {editId !== firm.id && (
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditId(firm.id); setEditForm({ name: firm.name, gst: firm.gst || "" }); }} className="text-slate-400 hover:text-brand-600 p-1"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(firm.id)} className="text-slate-400 hover:text-rose-500 p-1"><Trash2 size={14} /></button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
