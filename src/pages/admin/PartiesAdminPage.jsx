import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, RefreshCw, Search, Check, X, ShieldAlert, Eye, MapPin } from "lucide-react";
import { Panel, Input, Select } from "../../components/ui/index.jsx";
import { partiesApi, firmsApi, agentsApi } from "../../api/resources";
import { useApi, useMutation } from "../../api/hooks";
import { useEffect, useRef } from "react";
import L from "leaflet";

const emptyForm = {
  name: "",
  address: "",
  mobile: "",
  gstin: "",
  aadhaar: "",
  firm_id: "",
  agent_id: "",
  route: "",
  latitude: "26.8468",
  longitude: "80.9462",
};

// ─── Map Pin Location Picker Component ──────────────────────────────────────
function MapPicker({ lat, lng, onChange }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLat = Number(lat) || 26.8468;
    const initialLng = Number(lng) || 80.9462;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);

    mapRef.current = map;
    markerRef.current = marker;

    marker.on("dragend", (e) => {
      const position = e.target.getLatLng();
      onChange(position.lat, position.lng);
    });

    map.on("click", (e) => {
      marker.setLatLng(e.latlng);
      onChange(e.latlng.lat, e.latlng.lng);
    });

    // Invalidate size to load tiles correctly
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fly/center when props change externally (like edit mode)
  useEffect(() => {
    if (mapRef.current && markerRef.current && lat && lng) {
      const numLat = Number(lat);
      const numLng = Number(lng);
      const currentLatLng = markerRef.current.getLatLng();

      if (Math.abs(currentLatLng.lat - numLat) > 0.0001 || Math.abs(currentLatLng.lng - numLng) > 0.0001) {
        markerRef.current.setLatLng([numLat, numLng]);
        mapRef.current.setView([numLat, numLng], mapRef.current.getZoom());
      }
    }
  }, [lat, lng]);

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
        <span className="flex items-center gap-1"><MapPin size={12} className="text-brand-600" /> Map Location Selector</span>
        <span className="text-[10px] text-brand-600 bg-brand-50 px-2 py-0.5 rounded font-mono">
          {lat ? `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}` : "Click map to set location"}
        </span>
      </div>
      <div ref={mapContainerRef} className="h-44 w-full rounded-xl border border-slate-200 overflow-hidden relative z-0" />
      <p className="text-[10px] text-slate-400 font-medium">
        📍 Drag the blue marker or click on the map to set the shop location coordinates.
      </p>
    </div>
  );
}

export default function PartiesAdminPage() {
  const [activeTab, setActiveTab] = useState("all"); // 'all' or 'pending'
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page] = useState(1);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Active parties
  const { data, loading, refetch } = useApi(() => partiesApi.list({ page, limit: 100, search: debouncedSearch }), [debouncedSearch, activeTab]);
  // Pending parties
  const { data: pendingData, loading: pendingLoading, refetch: refetchPending } = useApi(
    () => partiesApi.getPending({ page: 1, limit: 100 }),
    [activeTab]
  );

  const { data: firmData } = useApi(() => firmsApi.list({ limit: 100 }), []);
  const { data: agentsData } = useApi(() => agentsApi.list({ limit: 100 }), []);

  const parties = Array.isArray(data) ? data : data?.rows || [];
  const pendingParties = Array.isArray(pendingData) ? pendingData : pendingData?.rows || pendingData?.data || [];
  const firms = Array.isArray(firmData) ? firmData : firmData?.rows || [];
  const agents = Array.isArray(agentsData) ? agentsData : agentsData?.rows || [];

  const filterParty = (party, term) => {
    if (!term.trim()) return true;
    const q = term.toLowerCase().trim();
    const name = (party.name || "").toLowerCase();
    const mobile = (party.mobile || "").toLowerCase();
    const gstin = (party.gstin || "").toLowerCase();
    const aadhaar = (party.aadhaar || "").toLowerCase();
    const route = (party.route || "").toLowerCase();
    const firmName = (party.firm_name || party.firm?.name || "").toLowerCase();
    const salesmanName = (party.salesman_name || party.salesman?.name || party.SalesAgent?.User?.name || party.SalesAgent?.name || "").toLowerCase();
    const address = (party.address || "").toLowerCase();
    return (
      name.includes(q) ||
      mobile.includes(q) ||
      gstin.includes(q) ||
      aadhaar.includes(q) ||
      route.includes(q) ||
      firmName.includes(q) ||
      salesmanName.includes(q) ||
      address.includes(q)
    );
  };

  const filteredParties = parties.filter((p) => filterParty(p, search));
  const filteredPendingParties = pendingParties.filter((p) => filterParty(p, search));

  const [form, setForm] = useState(emptyForm);
  const [inputMode, setInputMode] = useState("gstin");
  const [editId, setEditId] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", msg: "" });

  // Approval rejection states
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // Lightbox state for photo preview
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const { mutate: create, loading: creating } = useMutation((d) => partiesApi.create(d));
  const { mutate: update, loading: updating } = useMutation((id, d) => partiesApi.update(id, d));
  const { mutate: remove } = useMutation((id) => partiesApi.delete(id));
  const { mutate: approve, loading: approving } = useMutation((id) => partiesApi.approve(id));
  const { mutate: reject, loading: rejecting } = useMutation((id, d) => partiesApi.reject(id, d));

  const notify = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: "", msg: "" }), 3000);
  };

  const handleEditClick = (party) => {
    setEditId(party.id);
    const hasGstin = party.gstin && party.gstin.trim() !== "";
    const hasAadhaar = party.aadhaar && party.aadhaar.trim() !== "";
    const selectedMode = hasAadhaar && !hasGstin ? "aadhaar" : "gstin";
    setInputMode(selectedMode);

    setForm({
      name: party.name || "",
      address: party.address || "",
      mobile: party.mobile || "",
      gstin: party.gstin || "",
      aadhaar: party.aadhaar || "",
      firm_id: party.firm_id ? String(party.firm_id) : "",
      agent_id: party.agent_id ? String(party.agent_id) : "",
      route: party.route || "",
      latitude: party.latitude !== null && party.latitude !== undefined ? String(party.latitude) : "26.8468",
      longitude: party.longitude !== null && party.longitude !== undefined ? String(party.longitude) : "80.9462",
    });
  };

  const handleClear = () => {
    setEditId(null);
    setForm(emptyForm);
    setInputMode("gstin");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (inputMode === "gstin") {
      if (!form.gstin.trim()) {
        notify("error", "GSTIN is required");
        return;
      }
    } else {
      if (!form.aadhaar.trim()) {
        notify("error", "Aadhaar is required");
        return;
      }
    }

    const payload = {
      name: form.name.trim(),
      mobile: form.mobile.trim(),
      address: form.address.trim(),
      firm_id: form.firm_id ? Number(form.firm_id) : null,
      agent_id: form.agent_id ? Number(form.agent_id) : null,
      route: form.route.trim(),
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      gstin: inputMode === "gstin" ? form.gstin.trim() : "",
      aadhaar: inputMode === "aadhaar" ? form.aadhaar.trim() : "",
    };

    if (editId) {
      const res = await update(editId, payload);
      if (res.success) {
        notify("success", "Party updated successfully");
        refetch();
        handleClear();
      } else {
        notify("error", res.error || "Update failed");
      }
    } else {
      const res = await create(payload);
      if (res.success) {
        notify("success", "Party created successfully");
        refetch();
        handleClear();
      } else {
        notify("error", res.error || "Creation failed");
      }
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this party/customer?")) return;
    const res = await remove(id);
    if (res.success) {
      notify("success", "Party deleted");
      refetch();
      if (editId === id) handleClear();
    } else {
      notify("error", res.error || "Delete failed");
    }
  };

  const handleApprove = async (id) => {
    const res = await approve(id);
    if (res.success) {
      notify("success", "Party approved successfully");
      refetchPending();
      refetch();
    } else {
      notify("error", res.error || "Approval failed");
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) {
      notify("error", "Please provide a rejection reason");
      return;
    }
    const res = await reject(id, { reason: rejectReason.trim() });
    if (res.success) {
      notify("success", "Party registration rejected");
      setRejectingId(null);
      setRejectReason("");
      refetchPending();
    } else {
      notify("error", res.error || "Rejection failed");
    }
  };

  const firmOptions = [{ label: "All Firms", value: "" }, ...firms.map((f) => ({ label: f.name, value: String(f.id) }))];
  const agentOptions = [{ label: "Select Assigned Salesman", value: "" }, ...agents.map((a) => ({ label: a.User?.name || a.name || `Salesman ${a.id}`, value: String(a.id) }))];

  return (
    <div className="space-y-6">
      {/* Header & Tab Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Admin</p>
          <h1 className="font-display font-bold text-2xl text-slate-900">Parties / Customers</h1>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">Manage and approve retail party registrations</p>
        </motion.div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "all" ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            All Active ({parties.length})
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "pending" ? "bg-white text-amber-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Pending Approvals
            {pendingParties.length > 0 && (
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            )}
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">
              {pendingParties.length}
            </span>
          </button>
        </div>
      </div>

      {feedback.msg && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl px-4 py-3 text-sm font-medium ${feedback.type === "success" ? "bg-emerald-50 border border-emerald-100 text-emerald-700" : "bg-rose-50 border border-rose-100 text-rose-700"}`}>
          {feedback.msg}
        </motion.div>
      )}

      {activeTab === "all" ? (
        <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
          {/* Form Panel (Left) */}
          <Panel title={editId ? "Edit Party" : "Add Party"} subtitle={editId ? "Update existing shop details" : "Register a new shop customer"}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Party Name *" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="Customer / Shop name" required />
              <Input label="Mobile" value={form.mobile} onChange={(v) => setForm((p) => ({ ...p, mobile: v }))} placeholder="+91 98765 43210" />
              
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Verification ID Type *
                </span>
                <div className="grid grid-cols-2 p-1 bg-slate-100/80 border border-slate-200/55 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setInputMode("gstin")}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      inputMode === "gstin"
                        ? "bg-white text-brand-600 shadow-sm font-bold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    GSTIN
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode("aadhaar")}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      inputMode === "aadhaar"
                        ? "bg-white text-brand-600 shadow-sm font-bold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Aadhaar
                  </button>
                </div>
              </div>

              {inputMode === "gstin" ? (
                <Input
                  label="GSTIN *"
                  value={form.gstin}
                  onChange={(v) => setForm((p) => ({ ...p, gstin: v }))}
                  placeholder="09ABCDE1234F1Z5"
                />
              ) : (
                <Input
                  label="Aadhaar Number *"
                  value={form.aadhaar}
                  onChange={(v) => setForm((p) => ({ ...p, aadhaar: v }))}
                  placeholder="1234 5678 9012"
                />
              )}
              <Input label="Address" value={form.address} onChange={(v) => setForm((p) => ({ ...p, address: v }))} placeholder="City, State" />
              <Select label="Firm" value={form.firm_id} options={firmOptions} onChange={(v) => setForm((p) => ({ ...p, firm_id: v }))} />
              <Select label="Assigned Salesman" value={form.agent_id} options={agentOptions} onChange={(v) => setForm((p) => ({ ...p, agent_id: v }))} />
              <Input label="Route Plan Area" value={form.route} onChange={(v) => setForm((p) => ({ ...p, route: v }))} placeholder="e.g. Karol Bagh" />
              
              {/* Replace Lat/Lng numbers with Map Selection */}
              <MapPicker
                lat={form.latitude}
                lng={form.longitude}
                onChange={(lat, lng) => setForm((p) => ({ ...p, latitude: String(lat), longitude: String(lng) }))}
              />

              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={creating || updating} className="btn-primary flex-1 justify-center h-11">
                  {(creating || updating) ? (
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : editId ? (
                    <Check size={18} />
                  ) : (
                    <Plus size={18} />
                  )}
                  {editId ? "Update Party" : "Add Party"}
                </button>
                {editId && (
                  <button type="button" onClick={handleClear} className="btn-secondary px-4 flex justify-center h-11">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </Panel>

          {/* Parties Table Panel (Right) */}
          <Panel
            title="All Parties"
            subtitle={`${parties.length} total registered parties`}
            action={
              <div className="flex items-center gap-2">
                <button onClick={refetch} disabled={loading} className="btn-secondary h-8 px-3 flex items-center gap-1.5 text-xs">
                  <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
              </div>
            }
          >
            {/* Search Field & Stats Bar */}
            <div className="mb-4 flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by party name, mobile, GSTIN, Aadhaar, route, salesman, firm..."
                  className="input-field h-9 pl-9 pr-8 text-xs w-full bg-slate-50/70 focus:bg-white border-slate-200 shadow-sm"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                    title="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              {search && (
                <div className="text-xs text-slate-500 font-medium px-1 flex items-center gap-1">
                  <span>Showing <strong className="text-brand-600">{filteredParties.length}</strong> of {parties.length}</span>
                </div>
              )}
            </div>

            {loading ? (
              <div className="py-10 text-center"><div className="h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : filteredParties.length === 0 ? (
              <div className="py-10 text-center">
                {search ? (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500">No parties found matching &ldquo;<span className="font-semibold text-slate-700">{search}</span>&rdquo;</p>
                    <button onClick={() => setSearch("")} className="text-xs text-brand-600 hover:underline font-semibold">Clear search filter</button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No active parties found.</p>
                )}
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Mobile</th>
                      <th>Tax / Verification ID</th>
                      <th>Route</th>
                      <th>Firm</th>
                      <th>Salesman</th>
                      <th>Coordinates</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 bg-white">
                    {filteredParties.map((party) => (
                      <tr key={party.id} className={editId === party.id ? "bg-brand-50/40" : ""}>
                        <td className="font-semibold text-slate-800">{party.name}</td>
                        <td>{party.mobile || "—"}</td>
                        <td className="font-mono text-xs">
                          {party.gstin ? (
                            <div className="flex flex-col">
                              <span className="text-[9px] font-sans font-bold text-brand-600 bg-brand-50 px-1 py-0.5 rounded w-max mb-0.5 uppercase tracking-wider">GSTIN</span>
                              <span className="text-slate-700 font-medium">{party.gstin}</span>
                            </div>
                          ) : party.aadhaar ? (
                            <div className="flex flex-col">
                              <span className="text-[9px] font-sans font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded w-max mb-0.5 uppercase tracking-wider">Aadhaar</span>
                              <span className="text-slate-700 font-medium">{party.aadhaar}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td>
                          {party.route ? (
                            <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-lg">
                              {party.route}
                            </span>
                          ) : "—"}
                        </td>
                        <td>{party.firm_name || "—"}</td>
                        <td>
                          <span className="font-semibold text-slate-700">
                            {party.salesman_name || party.salesman?.name || party.SalesAgent?.User?.name || "—"}
                          </span>
                        </td>
                        <td className="text-xs text-slate-400 font-medium font-mono">
                          {party.latitude && party.longitude ? `${Number(party.latitude).toFixed(4)}, ${Number(party.longitude).toFixed(4)}` : "—"}
                        </td>
                        <td>
                          <div className="flex gap-1.5">
                            <button onClick={() => handleEditClick(party)} className="text-slate-400 hover:text-brand-600" title="Edit Party"><Edit2 size={14} /></button>
                            <button onClick={() => handleDelete(party.id)} className="text-slate-400 hover:text-rose-500" title="Delete Party"><Trash2 size={14} /></button>
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
      ) : (
        /* Pending Approvals View */
        <Panel
          title="Pending Parties Approval"
          subtitle="Review shops registered by salesman before they become active"
          action={
            <div className="flex items-center gap-2">
              <button onClick={refetchPending} disabled={pendingLoading} className="btn-secondary h-8 px-3 flex items-center gap-1.5 text-xs">
                <RefreshCw size={13} className={pendingLoading ? "animate-spin" : ""} /> Refresh
              </button>
            </div>
          }
        >
          {pendingParties.length > 0 && (
            <div className="mb-4 flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search pending parties by name, mobile, route, salesman..."
                  className="input-field h-9 pl-9 pr-8 text-xs w-full bg-slate-50/70 focus:bg-white border-slate-200 shadow-sm"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                    title="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              {search && (
                <div className="text-xs text-slate-500 font-medium px-1 flex items-center gap-1">
                  <span>Showing <strong className="text-brand-600">{filteredPendingParties.length}</strong> of {pendingParties.length}</span>
                </div>
              )}
            </div>
          )}

          {pendingLoading ? (
            <div className="py-12 text-center"><div className="h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : filteredPendingParties.length === 0 ? (
            <div className="py-12 text-center max-w-sm mx-auto">
              {search ? (
                <div className="space-y-2">
                  <p className="text-sm text-slate-500">No pending parties matching &ldquo;<span className="font-semibold text-slate-700">{search}</span>&rdquo;</p>
                  <button onClick={() => setSearch("")} className="text-xs text-brand-600 hover:underline font-semibold">Clear search filter</button>
                </div>
              ) : (
                <>
                  <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <Check size={24} />
                  </div>
                  <h3 className="font-display font-bold text-slate-800 text-base">All Caught Up!</h3>
                  <p className="text-xs text-slate-500 mt-1">There are no pending party registrations waiting for admin approval.</p>
                </>
              )}
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Shop Image</th>
                    <th>Shop / Party Name</th>
                    <th>Mobile</th>
                    <th>Address</th>
                    <th>Route Area</th>
                    <th>Salesman</th>
                    <th>Firm Name</th>
                    <th>Approval Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {filteredPendingParties.map((party) => (
                    <tr key={party.id}>
                      <td>
                        {party.shop_photo_url ? (
                          <div className="relative group cursor-zoom-in" onClick={() => setLightboxUrl(party.shop_photo_url)}>
                            <img
                              src={party.shop_photo_url}
                              alt="Shop Front"
                              className="h-10 w-16 object-cover rounded-lg border border-slate-100 shadow-sm transition-all group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-slate-900/10 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye size={12} className="text-white" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">No Photo</span>
                        )}
                      </td>
                      <td className="font-semibold text-slate-800">{party.name}</td>
                      <td>{party.mobile || "—"}</td>
                      <td className="max-w-[200px] truncate" title={party.address}>{party.address || "—"}</td>
                      <td>
                        {party.route ? (
                          <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-lg">
                            {party.route}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="font-semibold text-slate-700">{party.salesman_name || "—"}</td>
                      <td>
                        <span className="badge badge-brand text-[10px]">{party.firm_name || "—"}</span>
                      </td>
                      <td>
                        <span className="badge badge-warning text-[10px] uppercase font-bold">
                          Pending
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleApprove(party.id)}
                            disabled={approving}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all font-semibold text-xs"
                          >
                            <Check size={13} /> Approve
                          </button>
                          
                          {rejectingId === party.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Rejection reason..."
                                className="input-field h-8 text-xs py-1 px-2 w-32 bg-white"
                              />
                              <button
                                onClick={() => handleReject(party.id)}
                                className="px-2.5 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold"
                              >
                                Go
                              </button>
                              <button
                                onClick={() => { setRejectingId(null); setRejectReason(""); }}
                                className="text-xs text-slate-400 p-1"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setRejectingId(party.id)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all font-semibold text-xs"
                            >
                              <X size={13} /> Reject
                            </button>
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
      )}

      {/* Lightbox / Photo verification viewer */}
      <AnimatePresence>
        {lightboxUrl && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxUrl(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-white p-2 shadow-2xl z-10"
            >
              <img src={lightboxUrl} alt="Verification Full Preview" className="max-w-full max-h-[75vh] object-contain rounded-xl" />
              <div className="flex justify-between items-center p-3">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <ShieldAlert size={12} className="text-amber-500" /> Verify shop storefront and signage matches registered details
                </span>
                <button
                  onClick={() => setLightboxUrl(null)}
                  className="btn-secondary py-1 px-3 text-xs flex items-center gap-1"
                >
                  <X size={12} /> Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
