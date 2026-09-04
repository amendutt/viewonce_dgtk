import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit2, RefreshCw, Check, X } from "lucide-react";
import { Panel, Input, Select } from "../../components/ui/index.jsx";
import { branchesApi, firmsApi } from "../../api/resources";
import { useApi, useMutation } from "../../api/hooks";

export default function BranchesAdminPage() {
  const { data: branchData, loading, refetch } = useApi(() => branchesApi.list({ limit: 100 }), []);
  const { data: firmData } = useApi(() => firmsApi.list({ limit: 100 }), []);
  const branches = Array.isArray(branchData) ? branchData : branchData?.rows || [];
  const firms = Array.isArray(firmData) ? firmData : firmData?.rows || [];

  const [form, setForm] = useState({
    name: "",
    firm_id: "",
    address: "",
    phone: "",
    office_latitude: "",
    office_longitude: "",
  });
  const [editId, setEditId] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", msg: "" });

  const { mutate: create, loading: creating } = useMutation((d) => branchesApi.create(d));
  const { mutate: update, loading: updating } = useMutation((id, d) => branchesApi.update(id, d));
  const { mutate: remove } = useMutation((id) => branchesApi.delete(id));

  const notify = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: "", msg: "" }), 3000);
  };

  const handleEditClick = (branch) => {
    setEditId(branch.id);
    setForm({
      name: branch.name || "",
      firm_id: String(branch.firm_id || ""),
      address: branch.address || "",
      phone: branch.phone || "",
      office_latitude: branch.office_latitude !== null && branch.office_latitude !== undefined ? String(branch.office_latitude) : "",
      office_longitude: branch.office_longitude !== null && branch.office_longitude !== undefined ? String(branch.office_longitude) : "",
    });
  };

  const handleClear = () => {
    setEditId(null);
    setForm({
      name: "",
      firm_id: "",
      address: "",
      phone: "",
      office_latitude: "",
      office_longitude: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.firm_id) {
      notify("error", "Branch Name and Firm are required");
      return;
    }

    const payload = {
      name: form.name.trim(),
      firm_id: Number(form.firm_id),
      address: form.address.trim(),
      phone: form.phone.trim(),
      office_latitude: form.office_latitude ? Number(form.office_latitude) : null,
      office_longitude: form.office_longitude ? Number(form.office_longitude) : null,
    };

    if (editId) {
      const res = await update(editId, payload);
      if (res.success) {
        notify("success", "Branch updated successfully");
        refetch();
        handleClear();
      } else {
        notify("error", res.error || "Update failed");
      }
    } else {
      const res = await create(payload);
      if (res.success) {
        notify("success", "Branch created successfully");
        refetch();
        handleClear();
      } else {
        notify("error", res.error || "Creation failed");
      }
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this branch?")) return;
    const res = await remove(id);
    if (res.success) {
      notify("success", "Branch deleted");
      refetch();
      if (editId === id) handleClear();
    } else {
      notify("error", res.error || "Delete failed");
    }
  };

  const firmOptions = [{ label: "Select Firm", value: "" }, ...firms.map((f) => ({ label: f.name, value: String(f.id) }))];

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Admin</p>
        <h1 className="font-display font-bold text-2xl text-slate-900">Branches Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">{branches.length} branches registered</p>
      </motion.div>

      {feedback.msg && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl px-4 py-3 text-sm font-medium ${feedback.type === "success" ? "bg-emerald-50 border border-emerald-100 text-emerald-700" : "bg-rose-50 border border-rose-100 text-rose-700"}`}>
          {feedback.msg}
        </motion.div>
      )}

      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        {/* Form Panel (Left) */}
        <Panel title={editId ? "Edit Branch" : "Add Branch"} subtitle={editId ? "Update existing branch details" : "Register a new company branch"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Branch Name *" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="e.g. Lucknow Main" required />
            <Select label="Firm *" value={form.firm_id} options={firmOptions} onChange={(v) => setForm((p) => ({ ...p, firm_id: v }))} />
            <Input label="Address" value={form.address} onChange={(v) => setForm((p) => ({ ...p, address: v }))} placeholder="Branch address" />
            <Input label="Phone" value={form.phone} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} placeholder="+91 98765 43210" />
            
            <div className="grid grid-cols-2 gap-3">
              <Input label="Latitude" type="number" step="any" value={form.office_latitude} onChange={(v) => setForm((p) => ({ ...p, office_latitude: v }))} placeholder="e.g. 28.7041" />
              <Input label="Longitude" type="number" step="any" value={form.office_longitude} onChange={(v) => setForm((p) => ({ ...p, office_longitude: v }))} placeholder="e.g. 77.1025" />
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={creating || updating} className="btn-primary flex-1 justify-center h-11">
                {(creating || updating) ? (
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : editId ? (
                  <Check size={18} />
                ) : (
                  <Plus size={18} />
                )}
                {editId ? "Update Branch" : "Add Branch"}
              </button>
              {editId && (
                <button type="button" onClick={handleClear} className="btn-secondary px-4 flex justify-center h-11">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </Panel>

        {/* Branches List Panel (Right) */}
        <Panel title="All Branches" action={
          <button onClick={refetch} disabled={loading} className="btn-secondary h-8 px-3 flex items-center gap-1.5 text-xs">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        }>
          {loading ? (
            <div className="py-10 text-center"><div className="h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : branches.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No branches found.</p>
          ) : (
            <div className="space-y-2">
              {branches.map((branch, i) => (
                <motion.div key={branch.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${
                    editId === branch.id
                      ? "bg-brand-50 border-brand-200"
                      : "bg-slate-50 border-slate-100 hover:bg-brand-50/50 hover:border-brand-100"
                  } group`}>
                  <div className="h-9 w-9 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 font-bold text-sm">
                    {branch.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{branch.name}</p>
                    <p className="text-xs text-slate-400">
                      {branch.firm_name || `Firm ID: ${branch.firm_id}`}
                      {branch.office_latitude && ` · Lat: ${branch.office_latitude}, Lng: ${branch.office_longitude}`}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditClick(branch)} className="text-slate-400 hover:text-brand-600 p-1 bg-white border border-slate-200 rounded-lg shadow-sm" title="Edit Branch"><Edit2 size={13} /></button>
                    <button onClick={() => handleDelete(branch.id)} className="text-slate-400 hover:text-rose-500 p-1 bg-white border border-slate-200 rounded-lg shadow-sm" title="Delete Branch"><Trash2 size={13} /></button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
