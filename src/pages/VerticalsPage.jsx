import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, RefreshCw, Trash2, Edit2 } from "lucide-react";
import { Panel, DataTable, Input, Select } from "../components/ui/index.jsx";
import { verticalsApi, firmsApi } from "../api/resources";
import { useApi, useMutation } from "../api/hooks";
import { verticalColors } from "../data/constants";
import { currency } from "../utils/helpers";
import { useApp } from "../context/AppContext";

export default function VerticalsPage() {
  const { verticalRows } = useApp();

  const { data: verticalsData, loading, refetch } = useApi(() => verticalsApi.list(), []);
  const { data: firmsData } = useApi(() => firmsApi.list({ limit: 100 }), []);

  const verticals = Array.isArray(verticalsData) ? verticalsData : verticalsData?.rows || [];
  const firms = Array.isArray(firmsData) ? firmsData : firmsData?.rows || [];

  const [form, setForm] = useState({ name: "", firm_id: "" });
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [feedback, setFeedback] = useState({ type: "", msg: "" });

  const { mutate: createVertical, loading: creating } = useMutation((d) => verticalsApi.create(d));
  const { mutate: updateVertical, loading: updating } = useMutation((id, d) => verticalsApi.update(id, d));
  const { mutate: deleteVertical } = useMutation((id) => verticalsApi.delete(id));

  const notify = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: "", msg: "" }), 3000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const res = await createVertical({ name: form.name, firm_id: Number(form.firm_id) });
    if (res.success) { notify("success", "Vertical created"); refetch(); setForm({ name: "", firm_id: "" }); }
    else notify("error", res.error);
  };

  const handleUpdate = async (id) => {
    const res = await updateVertical(id, { name: editName });
    if (res.success) { notify("success", "Updated"); refetch(); setEditId(null); setEditName(""); }
    else notify("error", res.error);
  };

  const handleDelete = async (id) => {
    const res = await deleteVertical(id);
    if (res.success) { notify("success", "Deleted"); refetch(); }
    else notify("error", res.error);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Analytics</p>
        <h1 className="font-display font-bold text-2xl text-slate-900">All Verticals Report</h1>
        <p className="text-sm text-slate-500 mt-0.5 font-medium">Product category performance breakdown</p>
      </motion.div>

      {feedback.msg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
              : "bg-rose-50 border border-rose-100 text-rose-700"
          }`}
        >
          {feedback.msg}
        </motion.div>
      )}

      {/* Visual performance cards (from report data) */}
      {verticalRows.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {verticalRows.map((row, i) => {
            const vc = verticalColors[row.vertical] || verticalColors.TYRE;
            const total = Number(row.cash || 0) + Number(row.wallet || 0) + Number(row.credit || 0);
            return (
              <motion.div
                key={row.vertical + i}
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.08 }}
                className="card hover:-translate-y-0.5 transition-transform duration-200"
              >
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold mb-4 ${vc.bg} ${vc.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${vc.dot}`} />
                  {row.vertical}
                </div>
                <p className="text-2xl font-display font-bold text-slate-900">{currency(total)}</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Total Revenue</p>
                <div className="mt-4 space-y-1.5">
                  {[
                    { label: "Cash",        value: row.cash,        color: "text-emerald-600" },
                    { label: "Online",      value: row.wallet,      color: "text-blue-600"    },
                    { label: "Credit",      value: row.credit,      color: "text-amber-600"   },
                    { label: "Outstanding", value: row.outstanding, color: "text-rose-600"    },
                  ].map(({ label, value, color }) =>
                    Number(value) > 0 ? (
                      <div key={label} className="flex justify-between text-xs">
                        <span className="text-slate-500 font-medium">{label}</span>
                        <span className={`font-bold ${color}`}>{currency(value)}</span>
                      </div>
                    ) : null
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">{row.totalQty} units</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
        {/* Create form */}
        <Panel title="Add Vertical" subtitle="Create a new product vertical">
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Vertical Name"
              value={form.name}
              onChange={(v) => setForm((p) => ({ ...p, name: v }))}
              placeholder="e.g. TYRE, BATTERY"
            />
            <Select
              label="Firm"
              value={form.firm_id}
              options={firms.map((f) => ({ label: f.name, value: String(f.id) }))}
              onChange={(v) => setForm((p) => ({ ...p, firm_id: v }))}
            />
            <motion.button
              type="submit"
              disabled={creating}
              whileTap={{ scale: 0.97 }}
              className="btn-primary w-full justify-center h-11"
            >
              {creating ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={18} />}
              Add Vertical
            </motion.button>
          </form>
        </Panel>

        {/* Verticals list */}
        <Panel
          title="All Verticals"
          action={
            <button onClick={refetch} disabled={loading} className="btn-secondary h-8 px-3 flex items-center gap-1.5 text-xs">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          }
        >
          {loading ? (
            <div className="py-10 text-center">
              <div className="h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : verticals.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No verticals found.</p>
          ) : (
            <div className="space-y-2">
              {verticals.map((v, i) => {
                const vc = verticalColors[v.name] || verticalColors.TYRE;
                return (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-brand-50/50 transition-colors group"
                  >
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold ${vc.bg} ${vc.text}`}>
                      {v.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      {editId === v.id ? (
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="input-field text-sm h-8 py-1 px-2"
                          onKeyDown={(e) => e.key === "Enter" && handleUpdate(v.id)}
                        />
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-slate-800">{v.name}</p>
                          {v.firm_name && <p className="text-xs text-slate-400">{v.firm_name}</p>}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editId === v.id ? (
                        <>
                          <button onClick={() => handleUpdate(v.id)} disabled={updating} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">Save</button>
                          <button onClick={() => { setEditId(null); setEditName(""); }} className="text-xs font-semibold text-slate-400">Cancel</button>
                        </>
                      ) : (
                        <button onClick={() => { setEditId(v.id); setEditName(v.name); }} className="text-slate-400 hover:text-brand-600">
                          <Edit2 size={14} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(v.id)} className="text-slate-400 hover:text-rose-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
