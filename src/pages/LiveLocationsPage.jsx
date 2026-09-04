import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Battery, MapPin, Navigation, Phone, RefreshCw,
  Signal, Clock, Calendar, Filter, Map, Globe,
} from "lucide-react";
import L from "leaflet";
import { verticalColors } from "../data/constants";
import { locationApi, agentsApi, verticalsApi } from "../api/resources";
import { useApi } from "../api/hooks";
import { useApp } from "../context/AppContext";

// ─── Leaflet default-icon fix for Vite ────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Custom div icon ──────────────────────────────────────────────────────────
function makeIcon(name, isOnDuty, isSelected) {
  const bg     = isSelected ? "#2563eb" : isOnDuty ? "#10b981" : "#94a3b8";
  const border = isSelected ? "#1d4ed8" : isOnDuty ? "#059669" : "#64748b";
  const label  = (name || "?").split(" ")[0];
  const pulse  = isOnDuty
    ? `<span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
        width:44px;height:44px;border-radius:50%;background:${bg};opacity:0.25;
        animation:lf-ping 1.5s ease-out infinite;pointer-events:none;"></span>`
    : "";
  return L.divIcon({
    className: "",
    iconAnchor:  [24, 52],
    popupAnchor: [0, -54],
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
        ${pulse}
        <div style="
          position:relative;z-index:1;
          background:${bg};color:#fff;
          padding:5px 13px;border-radius:10px;
          font-size:12px;font-weight:700;white-space:nowrap;
          border:2px solid ${border};
          box-shadow:0 4px 14px rgba(0,0,0,0.22);
          letter-spacing:0.02em;
        ">${label}</div>
        <div style="width:2px;height:9px;background:${bg};"></div>
        <div style="width:8px;height:8px;border-radius:50%;background:${bg};
          border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.2);"></div>
      </div>`,
    iconSize: [48, 52],
  });
}

// ─── Resolve vertical styles case-insensitively ──────────────────────────────
const getVerticalStyle = (name) => {
  if (!name) return { bg: "bg-slate-50", text: "text-slate-700", dot: "bg-slate-400" };
  const upper = name.toUpperCase();
  if (verticalColors[upper]) return verticalColors[upper];
  
  if (upper.includes("TIRE") || upper.includes("TYRE")) return verticalColors.TYRE;
  if (upper.includes("BATTERY") || upper.includes("BATTERIES")) return verticalColors.BATTERY;
  if (upper.includes("LUBE") || upper.includes("MOBIL") || upper.includes("OIL")) return verticalColors.LUBES;
  if (upper.includes("SOLAR")) return verticalColors.SOLAR;
  if (upper.includes("HAVELLS")) return verticalColors.HAVELLS;
  if (upper.includes("GOV")) return verticalColors.GOV;
  
  // Dynamic fallback based on name character hash
  const colors = [
    { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500" },
    { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
    { bg: "bg-cyan-50", text: "text-cyan-700", dot: "bg-cyan-500" },
    { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
    { bg: "bg-fuchsia-50", text: "text-fuchsia-700", dot: "bg-fuchsia-500" },
  ];
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

// ─── Popup HTML builder ───────────────────────────────────────────────────────
const fmtTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        day: "2-digit", month: "short",
        hour: "2-digit", minute: "2-digit",
        timeZone: "Asia/Kolkata",
      })
    : null;

function popupHtml(agent) {
  const isOnDuty  = agent.status === "Live";
  const badgeCls  = isOnDuty
    ? "background:#d1fae5;color:#065f46"
    : "background:#f1f5f9;color:#475569";
  const dutyTime  = fmtTime(agent.dutyStartedAt);
  const lastTime  = fmtTime(agent.loggedAt);
  const initial   = (agent.name || "?").charAt(0).toUpperCase();
  const avatarBg  = isOnDuty ? "#ecfdf5" : "#f1f5f9";
  const avatarClr = isOnDuty ? "#047857" : "#64748b";

  return `
    <div style="padding:14px 16px;width:240px;font-family:inherit;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:38px;height:38px;border-radius:10px;background:${avatarBg};
            color:${avatarClr};display:flex;align-items:center;justify-content:center;
            font-weight:800;font-size:16px;flex-shrink:0;">${initial}</div>
          <div>
            <div style="font-weight:700;font-size:13px;color:#0f172a;line-height:1.2;">${agent.name}</div>
            <div style="font-size:11px;color:#94a3b8;font-weight:500;margin-top:2px;">ID ${agent.id} · ${agent.vertical}</div>
          </div>
        </div>
        <span style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:20px;${badgeCls};flex-shrink:0;">${agent.status}</span>
      </div>

      ${agent.areaName ? `
        <div style="background:#fff1f2;color:#e11d48;border:1px solid #ffe4e6;border-radius:8px;padding:6px 10px;font-size:11px;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:4px;">
          <span>📍</span> Area: ${agent.areaName}
        </div>
      ` : ""}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#475569;font-weight:500;">
          <span style="color:#6366f1;">📱</span>${agent.mobile}
        </div>
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#475569;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          <span style="color:#6366f1;">🏢</span>${agent.branch}
        </div>
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:${agent.battery > 50 ? "#059669" : "#d97706"};font-weight:600;">
          <span>🔋</span>${agent.battery}%
        </div>
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#475569;font-weight:500;">
          <span style="color:#6366f1;">📍</span>${agent.lat.toFixed(5)}, ${agent.lng.toFixed(5)}
        </div>
        ${agent.location ? `
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#475569;font-weight:500;grid-column: span 2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          <span style="color:#6366f1;">🧭</span>${agent.location}
        </div>
        ` : ""}
      </div>

      ${dutyTime || lastTime ? `
        <div style="border-top:1px solid #f1f5f9;padding-top:10px;display:flex;flex-direction:column;gap:6px;">
          ${dutyTime ? `<div style="font-size:11px;color:#059669;font-weight:600;">⏱ Duty started: ${dutyTime}</div>` : ""}
          ${lastTime ? `<div style="font-size:11px;color:#94a3b8;font-weight:500;">🕒 Last updated: ${lastTime}</div>` : ""}
        </div>` : ""}
    </div>`;
}

// ─── Map component (raw Leaflet, no react-leaflet) ────────────────────────────
function AgentMap({ agents, selected, onSelect, mapType, setMapType }) {
  const mapRef      = useRef(null);
  const leafletRef  = useRef(null);
  const markersRef  = useRef({});
  const initialised = useRef(false);
  const tileLayerRef = useRef(null);

  // Init map once
  useEffect(() => {
    if (initialised.current || !mapRef.current) return;
    initialised.current = true;

    const center = (() => {
      const first = agents.find((a) => a.status === "Live") || agents[0];
      return first ? [first.lat, first.lng] : [26.846, 80.946];
    })();

    const map = L.map(mapRef.current, {
      center,
      zoom: 13,
      zoomControl: false,
    });

    const activeLayer = mapType === "satellite"
      ? L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          maxZoom: 19,
        })
      : L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
          maxZoom: 19,
        });

    activeLayer.addTo(map);
    tileLayerRef.current = activeLayer;

    L.control.zoom({ position: "bottomright" }).addTo(map);

    leafletRef.current = map;

    // Force correct size after mount
    setTimeout(() => map.invalidateSize(), 100);
    setTimeout(() => map.invalidateSize(), 500);

    return () => {
      map.remove();
      leafletRef.current  = null;
      markersRef.current  = {};
      initialised.current = false;
    };
  }, []); // eslint-disable-line

  // Handle map type changes
  useEffect(() => {
    const map = leafletRef.current;
    if (!map || !initialised.current) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const nextLayer = mapType === "satellite"
      ? L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          maxZoom: 19,
        })
      : L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
          maxZoom: 19,
        });

    nextLayer.addTo(map);
    tileLayerRef.current = nextLayer;
  }, [mapType]);

  // Sync markers whenever agents list changes
  useEffect(() => {
    const map = leafletRef.current;
    if (!map) return;

    // Remove stale markers
    Object.keys(markersRef.current).forEach((id) => {
      if (!agents.find((a) => String(a.id) === id)) {
        map.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    });

    // Add / update markers
    agents.forEach((agent) => {
      const isSelected = selected?.id === agent.id;
      const icon       = makeIcon(agent.name, agent.status === "Live", isSelected);
      const key        = String(agent.id);

      if (markersRef.current[key]) {
        markersRef.current[key].setIcon(icon);
        markersRef.current[key].setLatLng([agent.lat, agent.lng]);
        markersRef.current[key].setPopupContent(popupHtml(agent));
      } else {
        const m = L.marker([agent.lat, agent.lng], { icon })
          .bindPopup(popupHtml(agent), {
            className:   "agent-popup",
            maxWidth:    260,
            minWidth:    240,
            closeButton: false,
          })
          .on("click", () => onSelect(agent))
          .addTo(map);
        markersRef.current[key] = m;
      }
    });
  }, [agents, selected, onSelect]);

  // Fly to selected agent
  useEffect(() => {
    const map = leafletRef.current;
    if (!map || !selected) return;
    map.flyTo([selected.lat, selected.lng], 15, { duration: 0.8, easeLinearity: 0.5 });
    const m = markersRef.current[String(selected.id)];
    if (m) setTimeout(() => m.openPopup(), 900);
  }, [selected]);

  return (
    <div className="relative w-full h-full rounded-[inherit] overflow-hidden">
      <div ref={mapRef} style={{ height: "100%", width: "100%", borderRadius: "inherit" }} />
      
      {/* Floating Map Type Selector */}
      <div className="absolute top-4 right-4 z-[500] bg-white/95 backdrop-blur-sm rounded-xl p-1 shadow-card border border-slate-100 flex gap-1">
        <button
          type="button"
          onClick={() => setMapType("street")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            mapType === "street"
              ? "bg-brand-600 text-white shadow-brand"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Map size={13} />
          <span>Street</span>
        </button>
        <button
          type="button"
          onClick={() => setMapType("satellite")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            mapType === "satellite"
              ? "bg-brand-600 text-white shadow-brand"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Globe size={13} />
          <span>Satellite</span>
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LiveLocationsPage() {
  const { selectedFirmId } = useApp();
  const [mapType, setMapType] = useState("street");
  const { data: liveData,    loading: liveLoading,   refetch: refetchLive } = useApi(
    () => locationApi.live(selectedFirmId ? { firm_id: selectedFirmId } : {}),
    [selectedFirmId]
  );
  const { data: agentsData,  loading: agentsLoading }                       = useApi(() => agentsApi.list({ limit: 100 }), []);
  const { data: verticalsData }                                              = useApi(() => verticalsApi.list(), []);

  const [timeLeft, setTimeLeft] = useState(30);

  // Auto-refresh live locations every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          refetchLive();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [refetchLive]);

  const handleManualRefresh = () => {
    refetchLive();
    setTimeLeft(30);
  };

  const allAgents     = Array.isArray(agentsData)    ? agentsData    : agentsData?.rows    || [];
  const liveLocations = Array.isArray(liveData)      ? liveData      : liveData?.agents    || [];
  const verticals     = Array.isArray(verticalsData) ? verticalsData : verticalsData?.rows || [];

  const filteredFirmAgents = selectedFirmId
    ? allAgents.filter(a => String(a.firm_id) === String(selectedFirmId))
    : allAgents;

  const agents = filteredFirmAgents.map((agent) => {
    const live = liveLocations.find(
      (l) => String(l.agent_id) === String(agent.id) || String(l.id) === String(agent.id)
    );
    const resolvedVertical = verticals.find((v) => Number(v.id) === Number(agent.vertical_id))?.name;
    return {
      ...agent,
      name:          agent.User?.name    || agent.name  || live?.name || "Agent " + agent.id,
      status:        (live ? (live.is_live || live.status === "live") : (agent.duty_status === "on" || agent.is_on_duty)) ? "Live" : "Offline",
      lat:           Number(live?.latitude  || live?.lat  || agent.lat  || 26.856),
      lng:           Number(live?.longitude || live?.lng  || agent.lng  || 80.946),
      location:      live?.address || live?.location || agent.location || "Unknown",
      areaName:      live?.area_name || agent.area_name || "",
      battery:       Number(live?.battery || agent.battery || 0),
      mobile:        agent.User?.mobile || agent.mobile || live?.mobile || "—",
      vertical:      resolvedVertical  || agent.vertical_name || agent.vertical || "—",
      branch:        agent.Branch?.name || agent.branch_name  || agent.branch   || "—",
      loggedAt:      live?.logged_at  || agent.updatedAt || null,
      dutyStartedAt: agent.duty_started_at || live?.duty_started_at || null,
    };
  });

  const [selectedVertical, setSelectedVertical] = useState("All");

  // Derive unique verticals from backend & agents data to ensure complete filters list
  const uniqueVerticals = ["All"];
  verticals.forEach((v) => {
    if (v.name && !uniqueVerticals.includes(v.name)) {
      uniqueVerticals.push(v.name);
    }
  });
  agents.forEach((agent) => {
    if (
      agent.vertical &&
      agent.vertical !== "—" &&
      !uniqueVerticals.some((v) => v.toLowerCase() === agent.vertical.toLowerCase())
    ) {
      uniqueVerticals.push(agent.vertical);
    }
  });

  const filteredAgents = agents.filter((agent) => {
    if (selectedVertical === "All") return true;
    return agent.vertical?.toLowerCase() === selectedVertical.toLowerCase();
  });

  const [selected, setSelected] = useState(null);

  // Auto-deselect agent if they are filtered out of the current vertical selection
  useEffect(() => {
    if (selected && !filteredAgents.some((a) => a.id === selected.id)) {
      setSelected(null);
    }
  }, [selectedVertical, filteredAgents, selected]);

  const loading     = liveLoading || agentsLoading;
  const filteredOnDutyCount = filteredAgents.filter((a) => a.status === "Live").length;

  const handleSelect = (agent) =>
    setSelected((prev) => (prev?.id === agent.id ? null : agent));

  return (
    <div className="space-y-6">

      {/* Header */}
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Tracking</p>
        <h1 className="font-display font-bold text-2xl text-slate-900">Live Agent Locations</h1>
        <p className="text-sm text-slate-500 mt-0.5 font-medium">Real-time field activity across all branches</p>
      </motion.div>

      {/* Verticals Filter */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="card-lg py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Filter size={16} />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-slate-900">Filter by Vertical</h3>
            <p className="text-xs text-slate-400">Filter map and agents by category</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {uniqueVerticals.map((vert) => {
            const isSelected = selectedVertical === vert;
            const style = getVerticalStyle(vert === "All" ? "" : vert);
            const count = vert === "All"
              ? agents.length
              : agents.filter(a => a.vertical?.toLowerCase() === vert.toLowerCase()).length;
            
            return (
              <button
                key={vert}
                onClick={() => setSelectedVertical(vert)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  isSelected
                    ? "bg-brand-600 text-white shadow-brand scale-105"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 hover:border-slate-300"
                }`}
              >
                {vert !== "All" && (
                  <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : style.dot}`} />
                )}
                <span>{vert === "All" ? "All Verticals" : vert}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                  isSelected ? "bg-brand-700/50 text-white" : "bg-slate-200 text-slate-500"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Live",         value: filteredOnDutyCount,                color: "emerald" },
          { label: "Offline",      value: filteredAgents.length - filteredOnDutyCount, color: "slate"   },
          { label: "Total Agents", value: filteredAgents.length,              color: "brand"   },
        ].map(({ label, value, color }, i) => (
          <motion.div key={label} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.08 }} className="card text-center">
            <p className={`text-2xl font-display font-bold ${
              color === "emerald" ? "text-emerald-600" : color === "brand" ? "text-brand-600" : "text-slate-400"
            }`}>{value}</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Map Panel ──────────────────────────────────────────────────── */}
      <div className="card-lg">
        <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-display font-bold text-lg text-slate-900">Field Map</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Live agent positions · {mapType === "street" ? "OpenStreetMap" : "Esri Satellite"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 badge badge-success">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {filteredOnDutyCount} Live
            </span>
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className="btn-ghost h-8 text-xs gap-1.5 relative overflow-hidden group px-3 border border-slate-100 hover:border-slate-200"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
              <span>Refresh</span>
              <span className="text-[10px] text-slate-400 font-normal">({timeLeft}s)</span>
              {!loading && (
                <div
                  className="absolute bottom-0 left-0 h-[2px] bg-brand-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${(timeLeft / 30) * 100}%` }}
                />
              )}
            </button>
          </div>
        </div>

        {/* Map container — explicit height, rounded corners, no overflow-hidden */}
        <div className="relative rounded-xl border border-slate-200" style={{ height: 520 }}>
          {loading && filteredAgents.length === 0 && (
            <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white rounded-xl">
              <div className="flex flex-col items-center gap-3">
                <div className="h-9 w-9 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
                <p className="text-sm font-semibold text-slate-400">Loading agent locations…</p>
              </div>
            </div>
          )}

          <AgentMap
            agents={filteredAgents}
            selected={selected}
            onSelect={handleSelect}
            mapType={mapType}
            setMapType={setMapType}
          />

          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-[500] bg-white/95 backdrop-blur-sm rounded-xl
            px-3 py-2 shadow-card border border-slate-100 flex items-center gap-4 pointer-events-none">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Live
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" /> Offline
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> Selected
            </span>
          </div>
        </div>
      </div>

      {/* ── Agent Cards ─────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {filteredAgents.map((agent, i) => {
          const isOnDuty   = agent.status === "Live";
          const isSelected = selected?.id === agent.id;
          const vc = getVerticalStyle(agent.vertical);
          return (
            <motion.div
              key={agent.id}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => handleSelect(agent)}
              className={`card cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
                isSelected ? "ring-2 ring-brand-400 shadow-brand -translate-y-1" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${
                    isOnDuty ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}>
                    {(agent.name || "?").charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900">{agent.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">ID {agent.id} · {agent.mobile}</p>
                  </div>
                </div>
                <span className={`badge ${isOnDuty ? "badge-success" : "badge-slate"} shrink-0`}>{agent.status}</span>
              </div>

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className={`badge text-[10px] ${vc.bg} ${vc.text}`}>{agent.vertical}</span>
                <span className="text-xs text-slate-400">{agent.branch}</span>
              </div>

              {agent.areaName && (
                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50/60 px-2 py-0.5 rounded-lg border border-rose-100/50 w-max shrink-0">
                  <MapPin size={10} className="shrink-0 text-rose-500" />
                  <span className="truncate">Area: {agent.areaName}</span>
                </div>
              )}

              <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                <MapPin size={10} className="shrink-0 text-brand-400" />
                <span>{agent.lat.toFixed(5)}, {agent.lng.toFixed(5)}</span>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1 max-w-[65%] truncate">
                  <Navigation size={11} className="shrink-0" />
                  <span className="font-medium truncate">{agent.location}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Battery size={11} className={agent.battery > 50 ? "text-emerald-500" : "text-amber-500"} />
                  <span className="font-semibold">{agent.battery}%</span>
                </div>
              </div>

              <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${agent.battery}%` }}
                  transition={{ delay: i * 0.07 + 0.4, duration: 0.6 }}
                  className={`h-full rounded-full ${agent.battery > 50 ? "bg-emerald-400" : "bg-amber-400"}`}
                />
              </div>

              {(agent.loggedAt || agent.dutyStartedAt) && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-1 text-[10px] font-medium">
                  {agent.dutyStartedAt && (
                    <div className="flex items-center gap-1 text-emerald-600">
                      <Clock size={10} className="shrink-0" />
                      <span>Duty started: {fmtTime(agent.dutyStartedAt)}</span>
                    </div>
                  )}
                  {agent.loggedAt && (
                    <div className="flex items-center gap-1 text-slate-400">
                      <Calendar size={10} className="shrink-0" />
                      <span>Last updated: {fmtTime(agent.loggedAt)}</span>
                    </div>
                  )}
                </div>
              )}

              {isSelected && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="mt-2 text-[10px] font-bold text-brand-500 text-center tracking-wide">
                  ↑ Highlighted on map
                </motion.p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
