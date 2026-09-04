import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, ChevronLeft, ChevronRight, ChevronDown,
  LayoutDashboard, LogOut, MapPin, Package, ShieldCheck,
  ShoppingCart, Users, Wallet, FileText, Target, LineChart,
  ClipboardList, Building2, GitBranch, UserCheck, Route,
  Box, CreditCard, FileBarChart, Upload,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

//sidebar links
const mainNav = [
  { id: "dashboard",            label: "Dashboard",        icon: LayoutDashboard },
  { id: "live-locations",       label: "Live Locations",   icon: MapPin },
  { id: "sales-reports",        label: "Sales Reports",    icon: BarChart3 },
  { id: "collection",           label: "Old Recovery",       icon: Wallet },
  { id: "outstanding",          label: "Outstanding",      icon: FileText },
  { id: "analysis",             label: "Analysis",  icon: LineChart },
  // { id: "purchase-outstanding", label: "Purchase",         icon: ShoppingCart },
  { id: "agent-ids",            label: "Agent IDs",        icon: Users },
  { id: "verticals",            label: "Verticals",        icon: Package },
  { id: "targets",              label: "Targets",          icon: Target },
];

const adminNav = [
  { id: "admin-orders",    label: "Order Approval",   icon: ClipboardList },
  { id: "admin-firms",     label: "Firms",            icon: Building2 },
  { id: "admin-branches",  label: "Branches",         icon: GitBranch },
  { id: "admin-parties",   label: "Parties",          icon: UserCheck },
  { id: "admin-route-plans", label: "Route Plans",      icon: Route },
  { id: "admin-items",     label: "Items / Products", icon: Box },
  { id: "admin-sub-items", label: "Sub-Items",        icon: Package },
  { id: "admin-purchases", label: "Purchases",        icon: CreditCard },
  { id: "admin-eod",       label: "EOD Reports",      icon: FileBarChart },
  { id: "admin-payments",  label: "Payments",         icon: Wallet },
  { id: "admin-imports",   label: "Excel Imports",    icon: Upload },
  { id: "admin-salesman-activity", label: "Salesman Activity", icon: Users },
];

function NavItem({ item, isActive, collapsed, onClick }) {
  const Icon = item.icon;
  return (
    <motion.button
      onClick={() => onClick(item.id)}
      whileTap={{ scale: 0.97 }}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
        isActive ? "bg-brand-600 text-white shadow-brand" : "text-slate-500 hover:bg-brand-50 hover:text-brand-700"
      }`}
      title={collapsed ? item.label : ""}
    >
      <Icon size={18} className="shrink-0" />
      <AnimatePresence>
        {!collapsed && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap overflow-hidden text-left flex-1">
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {isActive && !collapsed && (
        <motion.div layoutId="activeIndicator" className="ml-auto h-1.5 w-1.5 rounded-full bg-white/70" />
      )}
    </motion.button>
  );
}

export default function Sidebar({ activeSection, onNavigate, className = "", isMobile = false }) {
  const [collapsed, setCollapsed] = useState(false);
  const [adminOpen, setAdminOpen] = useState(activeSection.startsWith("admin-"));
  const { user, logout } = useAuth();

  const isAdminActive = activeSection.startsWith("admin-");

  return (
    <motion.aside
      initial="expanded"
      animate={collapsed ? "collapsed" : "expanded"}
      variants={{ expanded: { width: isMobile ? "100%" : 260 }, collapsed: { width: isMobile ? "100%" : 76 } }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className={`relative flex flex-col shrink-0 bg-white border-r border-slate-100 shadow-card z-20 h-screen max-h-screen ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3.5 py-4 border-b border-slate-100 min-h-[72px] shrink-0">
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-slate-950 overflow-hidden shrink-0 shadow-sm border border-slate-800">
          <img src="/viewonce-icon.png" alt="ViewOnce" className="h-full w-full object-cover" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="overflow-hidden flex flex-col justify-center">
              <img src="/viewonce-logo-dark.png" alt="ViewOnce" className="h-6 w-auto max-w-[140px] object-contain" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Admin Panel</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toggle — sits outside overflow so it's never clipped */}
      {!isMobile && (
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute z-50 flex h-7 w-7 items-center justify-center rounded-full bg-white border-2 border-brand-200 shadow-lg text-brand-600 hover:bg-brand-50 hover:border-brand-400 hover:scale-110 transition-all duration-200"
          style={{ top: 62, right: -14 }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 min-h-0 px-3 py-4 overflow-y-auto overflow-x-hidden sidebar-scrollbar space-y-1">
        <AnimatePresence>
          {!collapsed && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Navigation
            </motion.p>
          )}
        </AnimatePresence>

        {mainNav.map((item) => (
          <NavItem key={item.id} item={item} isActive={activeSection === item.id} collapsed={collapsed} onClick={onNavigate} />
        ))}

        {/* Admin Section */}
        <div className="pt-2">
          {!collapsed && (
            <button onClick={() => setAdminOpen((o) => !o)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ${
                isAdminActive ? "text-amber-700 bg-amber-50" : "text-slate-400 hover:text-slate-600"
              }`}>
              <ShieldCheck size={14} className="shrink-0" />
              <span className="flex-1 text-left">Admin</span>
              <ChevronDown size={12} className={`transition-transform ${adminOpen ? "rotate-180" : ""}`} />
            </button>
          )}

          {collapsed && (
            <button onClick={() => { setCollapsed(false); setAdminOpen(true); }}
              className={`w-full flex items-center justify-center px-3 py-2.5 rounded-xl transition-colors ${
                isAdminActive ? "bg-amber-50 text-amber-700" : "text-slate-400 hover:bg-amber-50 hover:text-amber-700"
              }`} title="Admin">
              <ShieldCheck size={18} />
            </button>
          )}

          <AnimatePresence>
            {adminOpen && !collapsed && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden mt-1 space-y-1">
                {adminNav.map((item) => (
                  <NavItem key={item.id} item={item} isActive={activeSection === item.id} collapsed={collapsed} onClick={onNavigate} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {adminOpen && collapsed && (
            <div className="mt-1 space-y-1">
              {adminNav.map((item) => (
                <NavItem key={item.id} item={item} isActive={activeSection === item.id} collapsed={collapsed} onClick={onNavigate} />
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-slate-100 shrink-0 bg-white">
        <div className={`flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50 transition-colors ${collapsed ? "justify-center" : ""}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700 text-sm font-bold">
            {user?.avatar || "AU"}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.role}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!collapsed && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={logout} className="text-slate-400 hover:text-rose-500 transition-colors" title="Logout">
                <LogOut size={16} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
