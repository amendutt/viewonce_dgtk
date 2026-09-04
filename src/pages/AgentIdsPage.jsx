import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, RefreshCw, Trash2, Users, Eye, EyeOff } from "lucide-react";
import { Panel, Input, Select, MultiSelect } from "../components/ui/index.jsx";
import { agentsApi, branchesApi, verticalsApi, firmsApi } from "../api/resources";
import { authApi } from "../api/auth";
import { useApi, useMutation } from "../api/hooks";
import { verticalColors } from "../data/constants";

export default function AgentIdsPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    vertical: "",
    firm_id: "",
    branch_ids: [],
    vertical_ids: [],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", msg: "" });
  const [registering, setRegistering] = useState(false);

  const { data: agentsData, loading, refetch } = useApi(() => agentsApi.list({ limit: 100 }), []);
  const { data: branchesData } = useApi(() => branchesApi.list(), []);
  const { data: verticalsData } = useApi(() => verticalsApi.list(), []);
  const { data: firmsData } = useApi(() => firmsApi.list({ limit: 100 }), []);

  const branches = Array.isArray(branchesData) ? branchesData : branchesData?.rows || [];
  const verticals = Array.isArray(verticalsData) ? verticalsData : verticalsData?.rows || [];
  const firms = Array.isArray(firmsData) ? firmsData : firmsData?.rows || [];
  const rawAgents = Array.isArray(agentsData) ? agentsData : agentsData?.rows || [];

  const agents = rawAgents.map((agent) => {
    const resolvedVerticals = Array.isArray(agent.Verticals) && agent.Verticals.length > 0
      ? agent.Verticals.map(v => v.name).join(", ")
      : (verticals.find(v => Number(v.id) === Number(agent.vertical_id))?.name || agent.vertical_name || agent.vertical || "—");

    const branchNames = Array.isArray(agent.Branches) && agent.Branches.length > 0
      ? agent.Branches.map((b) => b.name).join(", ")
      : agent.Branch?.name || agent.branch_name || agent.branch || "—";

    return {
      ...agent,
      name: agent.User?.name || agent.name || "Agent " + agent.id,
      mobile: agent.User?.mobile || agent.mobile || "—",
      vertical: resolvedVerticals,
      branch: branchNames,
    };
  });

  const { mutate: updateAgent, loading: updating } = useMutation((id, data) => agentsApi.update(id, data));
  const { mutate: deleteAgent, loading: deleting } = useMutation((id) => agentsApi.delete(id));

  const notify = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: "", msg: "" }), 3000);
  };

  const handleSelect = (agent) => {
    const selectedBranchIds = Array.isArray(agent.Branches)
      ? agent.Branches.map((b) => String(b.id))
      : (agent.branch_id ? [String(agent.branch_id)] : []);

    const selectedVerticalIds = Array.isArray(agent.Verticals)
      ? agent.Verticals.map((v) => String(v.id))
      : (agent.vertical_id ? [String(agent.vertical_id)] : []);

    setSelectedAgentId(agent.id);
    setForm({
      name: agent.name || "",
      email: agent.User?.email || "",
      mobile: agent.mobile || "",
      password: "",
      vertical: agent.vertical || "",
      firm_id: String(agent.firm_id || ""),
      branch_ids: selectedBranchIds,
      vertical_ids: selectedVerticalIds,
    });
  };

  const handleClear = () => {
    setSelectedAgentId(null);
    setForm({
      name: "",
      email: "",
      mobile: "",
      password: "",
      vertical: "",
      firm_id: "",
      branch_ids: [],
      vertical_ids: [],
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedAgentId) return;

    if (form.password && form.password.trim() !== "") {
      if (form.password.trim().length < 6) {
        notify("error", "Password must be at least 6 characters long");
        return;
      }
    }

    const payload = {
      branch_ids: form.branch_ids.map(Number),
      vertical_ids: form.vertical_ids.map(Number),
    };

    if (form.password && form.password.trim() !== "") {
      payload.password = form.password.trim();
    }

    const result = await updateAgent(selectedAgentId, payload);
    if (result.success) {
      notify("success", "Agent updated successfully");
      refetch();
      handleClear();
    } else {
      notify("error", result.error || "Update failed");
    }
  };

  const handleDelete = async () => {
    if (!selectedAgentId) return;
    if (!confirm("Are you sure you want to delete this agent? This action cannot be undone.")) return;
    const result = await deleteAgent(selectedAgentId);
    if (result.success) {
      notify("success", "Agent deleted successfully");
      refetch();
      handleClear();
    } else {
      notify("error", result.error || "Deletion failed");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.mobile.trim() || !form.firm_id) {
      notify("error", "Name, Email, Mobile, and Firm are required");
      return;
    }
    if (form.branch_ids.length === 0) {
      notify("error", "Please select at least one branch");
      return;
    }
    setRegistering(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        password: form.password.trim() || "Agent@123",
        role: "sales_agent",
        firm_id: Number(form.firm_id),
        branch_ids: form.branch_ids.map(Number),
        vertical_ids: form.vertical_ids.map(Number),
      };
      const result = await authApi.register(payload);
      const res = result.data;
      if (res.success) {
        notify("success", "Agent registered successfully");
        refetch();
        handleClear();
      } else {
        notify("error", res.message || res.error || "Registration failed");
      }
    } catch (err) {
      const apiMsg = err.response?.data?.message;
      notify("error", apiMsg || err.message || "An error occurred");
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Team</p>
        <h1 className="font-display font-bold text-2xl text-slate-900">Sales Agent IDs</h1>
        <p className="text-sm text-slate-500 mt-0.5 font-medium">
          {agents.length} agents registered
        </p>
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

      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        {/* Form Panel */}
        <Panel
          title={selectedAgentId ? "Edit Agent" : "Register New Agent"}
          subtitle={selectedAgentId ? "Update branch / vertical assignment" : "Create a new sales agent account"}
        >
          {selectedAgentId ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <Input
                label="Agent Full Name"
                value={form.name}
                onChange={() => {}}
                placeholder="Read-only"
                disabled
              />
              <Input
                label="Email Address"
                value={form.email}
                onChange={() => {}}
                placeholder="Read-only"
                disabled
              />
              <Input
                label="Mobile Number"
                value={form.mobile}
                onChange={() => {}}
                placeholder="Read-only"
                disabled
              />
              <Input
                label="New Password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(val) => setForm((f) => ({ ...f, password: val }))}
                placeholder="Leave blank to keep unchanged"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6366f1",
                  fontSize: "13px",
                  fontWeight: 500,
                  padding: "4px 0 0",
                  marginTop: "-4px",
                }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                {showPassword ? "Hide Password" : "Show Password"}
              </button>

              <MultiSelect
                label="Branches *"
                selectedValues={form.branch_ids}
                options={branches.map((b) => ({ label: b.name, value: String(b.id) }))}
                onChange={(vals) => setForm((f) => ({ ...f, branch_ids: vals }))}
              />

              <MultiSelect
                label="Verticals"
                selectedValues={form.vertical_ids}
                options={verticals.map((v) => ({ label: v.name, value: String(v.id) }))}
                onChange={(vals) => setForm((f) => ({ ...f, vertical_ids: vals }))}
              />

              <div className="flex gap-2">
                <motion.button
                  type="submit"
                  disabled={updating}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary flex-1 justify-center h-11"
                >
                  {updating ? (
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus size={18} />
                  )}
                  Update Agent
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  whileTap={{ scale: 0.97 }}
                  className="btn-secondary !bg-rose-50 !text-rose-600 !border-rose-200 px-4 flex items-center justify-center h-11"
                  title="Deactivate Agent"
                >
                  <Trash2 size={16} />
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleClear}
                  whileTap={{ scale: 0.97 }}
                  className="btn-secondary px-4 flex justify-center h-11"
                >
                  Cancel
                </motion.button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <Input
                label="Agent Full Name *"
                value={form.name}
                onChange={(val) => setForm((f) => ({ ...f, name: val }))}
                placeholder="e.g. John Doe"
                required
              />
              <Input
                label="Email Address *"
                type="email"
                value={form.email}
                onChange={(val) => setForm((f) => ({ ...f, email: val }))}
                placeholder="e.g. john@example.com"
                required
              />
              <Input
                label="Mobile Number *"
                value={form.mobile}
                onChange={(val) => setForm((f) => ({ ...f, mobile: val }))}
                placeholder="e.g. 9888888888"
                required
              />
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(val) => setForm((f) => ({ ...f, password: val }))}
                placeholder="Default: Agent@123"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6366f1",
                  fontSize: "13px",
                  fontWeight: 500,
                  padding: "4px 0 0",
                  marginTop: "-4px",
                }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                {showPassword ? "Hide Password" : "Show Password"}
              </button>

              <Select
                label="Firm *"
                value={form.firm_id}
                options={[{ label: "Select Firm", value: "" }, ...firms.map((f) => ({ label: f.name, value: String(f.id) }))]}
                onChange={(val) => setForm((f) => ({ ...f, firm_id: val }))}
              />

              <MultiSelect
                label="Branches *"
                selectedValues={form.branch_ids}
                options={branches.map((b) => ({ label: b.name, value: String(b.id) }))}
                onChange={(vals) => setForm((f) => ({ ...f, branch_ids: vals }))}
              />

              <MultiSelect
                label="Verticals (optional)"
                selectedValues={form.vertical_ids}
                options={verticals.map((v) => ({ label: v.name, value: String(v.id) }))}
                onChange={(vals) => setForm((f) => ({ ...f, vertical_ids: vals }))}
              />

              <motion.button
                type="submit"
                disabled={registering}
                whileTap={{ scale: 0.97 }}
                className="btn-primary w-full justify-center h-11"
              >
                {registering ? (
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Plus size={18} />
                )}
                Register Agent
              </motion.button>
            </form>
          )}
        </Panel>

        {/* Agents list */}
        <Panel
          title="All Agents"
          subtitle="Click an agent to manage"
          action={
            <div className="flex items-center gap-2">
              <span className="badge badge-brand"><Users size={11} /> {agents.length} total</span>
              <button onClick={refetch} disabled={loading} className="btn-secondary h-8 px-2">
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          }
        >
          {loading ? (
            <div className="py-10 text-center">
              <div className="h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-400 mt-2">Loading agents…</p>
            </div>
          ) : agents.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No agents found.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <AnimatePresence>
                {agents.map((agent, i) => {
                  const isOnDuty = agent.is_on_duty || agent.status === "On Duty" || agent.status === "Live" || agent.status === "live";
                  const agentVerts = Array.isArray(agent.Verticals) && agent.Verticals.length > 0
                    ? agent.Verticals
                    : (agent.vertical && agent.vertical !== "—" ? agent.vertical.split(", ").map(vName => ({ name: vName })) : []);

                  return (
                    <motion.div
                      key={agent.id}
                      onClick={() => handleSelect(agent)}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group ${
                        selectedAgentId === agent.id
                          ? "bg-brand-50 border-brand-200"
                          : "border-slate-100 bg-slate-50 hover:bg-brand-50/50 hover:border-brand-100"
                      }`}
                    >
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:border-brand-200 transition-colors">
                        <span className="text-sm font-bold text-slate-700">
                          {(agent.name || "?").charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{agent.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] font-mono text-slate-400">{agent.mobile}</span>
                          {agentVerts.map((v, idx) => {
                            const vName = v.name || v.vertical || "—";
                            const vc = verticalColors[vName.toUpperCase()] || verticalColors[vName] || { bg: "bg-slate-100", text: "text-slate-600" };
                            return (
                              <span key={idx} className={`badge text-[10px] ${vc.bg} ${vc.text}`}>
                                {vName}
                              </span>
                            );
                          })}
                          {agentVerts.length === 0 && (
                            <span className="badge text-[10px] bg-slate-100 text-slate-400">—</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {/* <span className={`badge text-[10px] ${isOnDuty ? "badge-success" : "badge-slate"}`}>
                          {isOnDuty ? "● On Duty" : "○ Offline"}
                        </span> */}
                        <p className="text-[10px] text-slate-400 mt-1 max-w-[120px] truncate" title={agent.branch}>
                          {agent.branch}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
