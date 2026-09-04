import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, RefreshCw, Target, TrendingUp, Trash2, Edit2, X } from "lucide-react";
import { Panel, Input, Select, MultiSelect } from "../components/ui/index.jsx";
import { targetsApi, firmsApi, branchesApi, verticalsApi, agentsApi } from "../api/resources";
import { useApi, useMutation } from "../api/hooks";
import { currency, formatPercent } from "../utils/helpers";

const COLOR_CYCLE = [
  { bar: "bg-brand-600",   bg: "bg-brand-50",   text: "text-brand-700",   border: "border-brand-200"   },
  { bar: "bg-accent-500",  bg: "bg-accent-50",  text: "text-accent-600",  border: "border-orange-200"  },
  { bar: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  { bar: "bg-violet-500",  bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200"  },
];

export default function TargetsPage() {
  const { data: targetsData, loading, refetch } = useApi(() => targetsApi.list(), []);
  const { data: firmsData }     = useApi(() => firmsApi.list({ limit: 100 }), []);
  const { data: branchesData }  = useApi(() => branchesApi.list(), []);
  const { data: verticalsData } = useApi(() => verticalsApi.list(), []);
  const { data: agentsData }    = useApi(() => agentsApi.list({ limit: 100 }), []);

  const rawTargets = Array.isArray(targetsData)   ? targetsData   : targetsData?.rows   || [];
  const targets   = [...rawTargets].sort((a, b) => {
    const timeA = new Date(a.createdAt || a.created_at || a.period_start || 0).getTime();
    const timeB = new Date(b.createdAt || b.created_at || b.period_start || 0).getTime();
    return timeB - timeA;
  });
  const firms     = Array.isArray(firmsData)     ? firmsData     : firmsData?.rows     || [];
  const branches  = Array.isArray(branchesData)  ? branchesData  : branchesData?.rows  || [];
  const verticals = Array.isArray(verticalsData) ? verticalsData : verticalsData?.rows || [];
  const agents    = Array.isArray(agentsData)    ? agentsData    : agentsData?.rows    || [];

  const [form, setForm] = useState({
    firm_id: "",
    branch_id: "",
    vertical_id: "",
    vertical_ids: [],
    agent_id: "",
    period_start: "",
    period_end: "",
    target_amount: "",
  });
  const [feedback, setFeedback] = useState({ type: "", msg: "" });

  const [editingTarget, setEditingTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    firm_id: "",
    branch_id: "",
    vertical_id: "",
    vertical_ids: [],
    agent_id: "",
    period_start: "",
    period_end: "",
    target_amount: "",
    achieved_amount: "",
  });

  const { mutate: createTarget, loading: creating } = useMutation((d) => targetsApi.create(d));
  const { mutate: deleteTarget } = useMutation((id) => targetsApi.delete(id));
  const { mutate: updateTargetDetails, loading: updatingDetails } = useMutation((d) => targetsApi.update(d.id, d.data));
  const { mutate: updateTargetProgress, loading: updatingProgress } = useMutation((d) => targetsApi.updateAchieved(d.id, d.achieved_amount));

  const notify = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: "", msg: "" }), 3000);
  };

  const handleAgentChange = (agentIdVal) => {
    if (!agentIdVal) {
      setForm((p) => ({
        ...p,
        agent_id: "",
        firm_id: "",
        branch_id: "",
        vertical_id: "",
        vertical_ids: [],
      }));
      return;
    }

    const agent = agents.find((a) => String(a.id) === String(agentIdVal));
    if (!agent) return;

    // Resolve assigned branches
    const agentBranchIds = Array.isArray(agent.Branches)
      ? agent.Branches.map((b) => String(b.id))
      : (agent.branch_id ? [String(agent.branch_id)] : []);

    const agentVerticals = Array.isArray(agent.Verticals)
      ? agent.Verticals.map((v) => String(v.id))
      : (agent.vertical_id ? [String(agent.vertical_id)] : []);

    setForm((p) => ({
      ...p,
      agent_id: agentIdVal,
      firm_id: agent.firm_id ? String(agent.firm_id) : "",
      branch_id: agentBranchIds[0] || "",
      vertical_id: agent.vertical_id ? String(agent.vertical_id) : "",
      vertical_ids: agentVerticals,
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.agent_id || !form.branch_id || !form.target_amount) {
      notify("error", "Salesperson, Branch, and Target Amount are required");
      return;
    }

    const payloadBase = {
      firm_id: Number(form.firm_id),
      branch_id: Number(form.branch_id),
      agent_id: Number(form.agent_id),
      period_start: form.period_start || undefined,
      period_end: form.period_end || undefined,
      target_amount: Number(form.target_amount),
    };

    if (form.vertical_ids && form.vertical_ids.length > 1) {
      let successCount = 0;
      let lastError = "";
      for (const vid of form.vertical_ids) {
        const res = await createTarget({
          ...payloadBase,
          vertical_id: Number(vid),
        });
        if (res.success) {
          successCount++;
        } else {
          lastError = res.error || lastError;
        }
      }

      if (successCount > 0) {
        notify("success", `${successCount} target(s) created successfully`);
        refetch();
        setForm({
          firm_id: "",
          branch_id: "",
          vertical_id: "",
          vertical_ids: [],
          agent_id: "",
          period_start: "",
          period_end: "",
          target_amount: "",
        });
      } else {
        notify("error", lastError || "Failed to create targets");
      }
    } else {
      const res = await createTarget({
        ...payloadBase,
        vertical_id: form.vertical_id ? Number(form.vertical_id) : undefined,
      });
      if (res.success) {
        notify("success", "Target created");
        refetch();
        setForm({
          firm_id: "",
          branch_id: "",
          vertical_id: "",
          vertical_ids: [],
          agent_id: "",
          period_start: "",
          period_end: "",
          target_amount: "",
        });
      } else {
        notify("error", res.error);
      }
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this target?")) return;
    const res = await deleteTarget(id);
    if (res.success) { notify("success", "Target deleted"); refetch(); }
    else notify("error", res.error);
  };

  const handleStartEdit = (target) => {
    setEditingTarget(target);
    const agent = agents.find((a) => String(a.id) === String(target.agent_id));
    const agentVerticals = agent && Array.isArray(agent.Verticals)
      ? agent.Verticals.map((v) => String(v.id))
      : (target.vertical_id ? [String(target.vertical_id)] : []);

    setEditForm({
      firm_id: target.firm_id ? String(target.firm_id) : "",
      branch_id: target.branch_id ? String(target.branch_id) : "",
      vertical_id: target.vertical_id ? String(target.vertical_id) : "",
      vertical_ids: agentVerticals,
      agent_id: target.agent_id ? String(target.agent_id) : "",
      period_start: target.period_start || "",
      period_end: target.period_end || "",
      target_amount: String(target.target_amount || target.target || ""),
      achieved_amount: String(target.achieved_amount || target.achieved || "0"),
    });
  };

  const handleEditAgentChange = (agentIdVal) => {
    if (!agentIdVal) {
      setEditForm((p) => ({
        ...p,
        agent_id: "",
        firm_id: "",
        branch_id: "",
        vertical_id: "",
        vertical_ids: [],
      }));
      return;
    }

    const agent = agents.find((a) => String(a.id) === String(agentIdVal));
    if (!agent) return;

    const agentBranchIds = Array.isArray(agent.Branches)
      ? agent.Branches.map((b) => String(b.id))
      : (agent.branch_id ? [String(agent.branch_id)] : []);

    const agentVerticals = Array.isArray(agent.Verticals)
      ? agent.Verticals.map((v) => String(v.id))
      : (agent.vertical_id ? [String(agent.vertical_id)] : []);

    setEditForm((p) => ({
      ...p,
      agent_id: agentIdVal,
      firm_id: agent.firm_id ? String(agent.firm_id) : "",
      branch_id: agentBranchIds[0] || "",
      vertical_id: agent.vertical_id ? String(agent.vertical_id) : "",
      vertical_ids: agentVerticals,
    }));
  };

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    if (!editingTarget) return;
    const res = await updateTargetDetails({
      id: editingTarget.id,
      data: {
        firm_id: Number(editForm.firm_id),
        branch_id: Number(editForm.branch_id),
        vertical_id: editForm.vertical_id ? Number(editForm.vertical_id) : null,
        agent_id: Number(editForm.agent_id),
        period_start: editForm.period_start || undefined,
        period_end: editForm.period_end || undefined,
        target_amount: Number(editForm.target_amount),
      }
    });
    if (res.success) {
      notify("success", "Target settings updated");
      refetch();
      setEditingTarget(null);
    } else {
      notify("error", res.error || "Update failed");
    }
  };

  const handleUpdateProgress = async (e) => {
    e.preventDefault();
    if (!editingTarget) return;
    const res = await updateTargetProgress({
      id: editingTarget.id,
      achieved_amount: Number(editForm.achieved_amount)
    });
    if (res.success) {
      notify("success", "Target progress updated");
      refetch();
      setEditingTarget(null);
    } else {
      notify("error", res.error || "Progress update failed");
    }
  };

  // Compute branches available for editing agent
  const selectedEditAgent = agents.find((a) => String(a.id) === String(editForm.agent_id));
  const availableEditBranches = selectedEditAgent
    ? (Array.isArray(selectedEditAgent.Branches) && selectedEditAgent.Branches.length > 0
        ? selectedEditAgent.Branches
        : branches.filter((b) => String(b.id) === String(selectedEditAgent.branch_id)))
    : [];

  const editBranchOptions = [
    { label: "Select Branch", value: "" },
    ...availableEditBranches.map((b) => ({ label: b.name, value: String(b.id) })),
  ];

  // Compute branches available for selected agent
  const selectedAgent = agents.find((a) => String(a.id) === String(form.agent_id));
  const availableBranches = selectedAgent
    ? (Array.isArray(selectedAgent.Branches) && selectedAgent.Branches.length > 0
        ? selectedAgent.Branches
        : branches.filter((b) => String(b.id) === String(selectedAgent.branch_id)))
    : [];

  const branchOptions = [
    { label: "Select Branch", value: "" },
    ...availableBranches.map((b) => ({ label: b.name, value: String(b.id) })),
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Performance</p>
        <h1 className="font-display font-bold text-2xl text-slate-900">Branch Targets</h1>
        <p className="text-sm text-slate-500 mt-0.5 font-medium">Monthly turnover achievement tracking</p>
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

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        {/* Create form */}
        <Panel title="Set New Target" subtitle="Assign monthly target to a salesperson">
          <form onSubmit={handleCreate} className="space-y-4">
            <Select
              label="Salesperson *"
              value={form.agent_id}
              options={[{ label: "Select Salesperson", value: "" }, ...agents.map((a) => ({
                label: a.User?.name || a.name || `Agent ${a.id}`,
                value: String(a.id),
              }))]}
              onChange={handleAgentChange}
            />
            <Select
              label="Firm"
              value={form.firm_id}
              options={[{ label: "Select Firm", value: "" }, ...firms.map((f) => ({ label: f.name, value: String(f.id) }))]}
              onChange={() => {}}
              disabled
            />
            <Select
              label="Branch *"
              value={form.branch_id}
              options={branchOptions}
              onChange={(v) => setForm((p) => ({ ...p, branch_id: v }))}
              disabled={!form.agent_id}
            />
            {form.vertical_ids && form.vertical_ids.length > 1 ? (
              <MultiSelect
                label="Verticals"
                selectedValues={form.vertical_ids}
                options={verticals
                  .filter((v) => form.vertical_ids.includes(String(v.id)))
                  .map((v) => ({ label: v.name, value: String(v.id) }))}
                onChange={() => {}}
                disabled
              />
            ) : (
              <Select
                label="Vertical"
                value={form.vertical_id}
                options={[{ label: "All Verticals", value: "" }, ...verticals.map((v) => ({ label: v.name, value: String(v.id) }))]}
                onChange={() => {}}
                disabled
              />
            )}
            <div className="grid grid-cols-2 gap-3">
              <Input label="Period Start" type="date" value={form.period_start} onChange={(v) => setForm((p) => ({ ...p, period_start: v }))} />
              <Input label="Period End"   type="date" value={form.period_end}   onChange={(v) => setForm((p) => ({ ...p, period_end: v }))} />
            </div>
            <Input
              label="Target Amount (₹) *"
              type="number"
              value={form.target_amount}
              onChange={(v) => setForm((p) => ({ ...p, target_amount: v }))}
              placeholder="e.g. 500000"
              required
            />
            <motion.button
              type="submit"
              disabled={creating || !form.agent_id || !form.branch_id}
              whileTap={{ scale: 0.97 }}
              className="btn-primary w-full justify-center h-11"
            >
              {creating ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={18} />}
              Create Target
            </motion.button>
          </form>
        </Panel>

        {/* Targets list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">{targets.length} targets set</p>
            <button onClick={refetch} disabled={loading} className="btn-secondary h-8 px-3 flex items-center gap-1.5 text-xs">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <div className="h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : targets.length === 0 ? (
            <div className="card-lg text-center py-10 text-slate-400 text-sm">
              No targets set yet. Create one →
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {targets.map((target, i) => {
                const targetAmt   = Number(target.target_amount || target.target || 0);
                const achievedAmt = Number(target.achieved_amount || target.achieved || 0);
                const pct         = formatPercent(achievedAmt, targetAmt);
                const remaining   = Math.max(targetAmt - achievedAmt, 0);
                const colors      = COLOR_CYCLE[i % COLOR_CYCLE.length];
                const isAhead     = pct >= 70;

                // Resolve display names
                const salesmanName = target.SalesAgent?.User?.name || target.salesperson_name || "Salesperson";
                const firmName = target.Firm?.name || target.firm_name || "—";
                const branchName = target.Branch?.name || target.branch_name || target.branch || "—";
                const verticalName = target.Vertical?.name || target.vertical_name || "All Verticals";

                return (
                  <motion.div
                    key={target.id}
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.07 }}
                    className={`card-lg border ${colors.border} relative group`}
                  >
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-white/80 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-slate-100">
                      <button
                        onClick={() => handleStartEdit(target)}
                        className="text-slate-400 hover:text-brand-600 transition-colors p-1"
                        title="Edit Target Settings"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(target.id)}
                        className="text-rose-400 hover:text-rose-600 transition-colors p-1"
                        title="Delete Target"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="flex items-start justify-between">
                      <div>
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold mb-2 ${colors.bg} ${colors.text}`}>
                          <Target size={11} />
                          {salesmanName}
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">
                          {firmName} · {branchName}
                        </p>
                        <p className="text-3xl font-display font-bold text-slate-900 mt-2">{pct}%</p>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">Vertical: {verticalName}</p>
                      </div>
                      <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${colors.bg}`}>
                        <TrendingUp size={28} className={colors.text} />
                      </div>
                    </div>

                    <div className="mt-5 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(pct, 100)}%` }}
                        transition={{ delay: i * 0.1 + 0.4, duration: 0.9, ease: "easeOut" }}
                        className={`h-full rounded-full ${colors.bar}`}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                      {[
                        { label: "Target",    value: currency(targetAmt)   },
                        { label: "Achieved",  value: currency(achievedAmt) },
                        { label: "Remaining", value: currency(remaining)   },
                      ].map(({ label, value }) => (
                        <div key={label} className="p-2.5 rounded-xl bg-slate-50">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5 leading-tight">{value}</p>
                        </div>
                      ))}
                    </div>

                    {!isAhead && (
                      <div className="mt-3 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-700 font-semibold">
                        ⚡ Needs {currency(remaining)} more to hit target
                      </div>
                    )}
                    {target.period_start && (
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">
                        {target.period_start} → {target.period_end}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal Overlay */}
      {editingTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto space-y-6"
          >
            <button
              onClick={() => setEditingTarget(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">
                Modify Target Details
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Target ID: #{editingTarget.id} · Assigned to {editingTarget.SalesAgent?.User?.name || "Salesperson"}
              </p>
            </div>

            <div className="space-y-6 divide-y divide-slate-100">
              {/* Form 1: Target Settings */}
              <form onSubmit={handleUpdateDetails} className="space-y-4 pt-1">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-600">
                  Target Settings (PUT /api/targets/{editingTarget.id})
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Salesperson"
                    value={editForm.agent_id}
                    options={[{ label: "Select Salesperson", value: "" }, ...agents.map((a) => ({
                      label: a.User?.name || a.name || `Agent ${a.id}`,
                      value: String(a.id),
                    }))]}
                    onChange={handleEditAgentChange}
                  />
                  <Select
                    label="Branch"
                    value={editForm.branch_id}
                    options={editBranchOptions}
                    onChange={(v) => setEditForm((p) => ({ ...p, branch_id: v }))}
                    disabled={!editForm.agent_id}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Firm"
                    value={editForm.firm_id}
                    options={[{ label: "Select Firm", value: "" }, ...firms.map((f) => ({ label: f.name, value: String(f.id) }))]}
                    onChange={() => {}}
                    disabled
                  />
                  {editForm.vertical_ids && editForm.vertical_ids.length > 1 ? (
                    <MultiSelect
                      label="Verticals"
                      selectedValues={editForm.vertical_ids}
                      options={verticals
                        .filter((v) => editForm.vertical_ids.includes(String(v.id)))
                        .map((v) => ({ label: v.name, value: String(v.id) }))}
                      onChange={() => {}}
                      disabled
                    />
                  ) : (
                    <Select
                      label="Vertical"
                      value={editForm.vertical_id}
                      options={[{ label: "All Verticals", value: "" }, ...verticals.map((v) => ({ label: v.name, value: String(v.id) }))]}
                      onChange={() => {}}
                      disabled
                    />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Period Start" type="date" value={editForm.period_start} onChange={(v) => setEditForm((p) => ({ ...p, period_start: v }))} />
                  <Input label="Period End"   type="date" value={editForm.period_end}   onChange={(v) => setEditForm((p) => ({ ...p, period_end: v }))} />
                </div>
                <Input
                  label="Target Amount (₹)"
                  type="number"
                  value={editForm.target_amount}
                  onChange={(v) => setEditForm((p) => ({ ...p, target_amount: v }))}
                  required
                />
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingTarget(null)}
                    className="btn-secondary h-10 text-xs px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingDetails}
                    className="btn-primary h-10 text-xs px-5"
                  >
                    {updatingDetails ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </form>

              {/* Form 2: Achieved Progress */}
              <form onSubmit={handleUpdateProgress} className="space-y-4 pt-5">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-600">
                  Update Achieved Progress (PATCH /api/targets/{editingTarget.id}/achieved)
                </p>
                <Input
                  label="Achieved Amount (₹)"
                  type="number"
                  value={editForm.achieved_amount}
                  onChange={(v) => setEditForm((p) => ({ ...p, achieved_amount: v }))}
                  required
                />
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingTarget(null)}
                    className="btn-secondary h-10 text-xs px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingProgress}
                    className="btn-primary h-10 text-xs px-5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {updatingProgress ? "Updating..." : "Update Progress"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
