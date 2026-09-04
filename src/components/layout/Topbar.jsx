import { motion, AnimatePresence } from "framer-motion";
import { Bell, LogOut, Menu, Search, ShieldCheck, ChevronDown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { firms, selectedFirmId, setSelectedFirmId, query, setQuery, loading } = useApp();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-10 flex items-center gap-3 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 sm:px-6 py-3.5 shadow-card"
    >
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="lg:hidden flex items-center justify-center h-9 w-9 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Mobile logo */}
      <div className="flex lg:hidden items-center gap-2">
        <img src="/viewonce-logo-dark.png" alt="ViewOnce" className="h-6 w-auto object-contain" />
      </div>

      <div className="flex-1 flex items-center gap-3 lg:gap-4">
        {/* Search */}
        <div className="hidden sm:flex flex-1 max-w-xs items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-brand-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-100 transition-all">
          <Search size={15} className="text-slate-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none"
            placeholder="Search reports, agents..."
          />
        </div>

        {/* Firm filter — drives dashboard API re-fetch */}
        <div className="relative">
          <select
            value={selectedFirmId}
            onChange={(e) => setSelectedFirmId(e.target.value)}
            className="h-9 appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-8 text-sm font-semibold text-slate-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all cursor-pointer hover:border-brand-300 hover:bg-white"
          >
            <option value="">All Firms</option>
            {firms.map((f) => (
              <option key={f.id} value={String(f.id)}>
                {f.name}
              </option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />

          {/* Loading pulse when dashboard is re-fetching */}
          <AnimatePresence>
            {loading && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-brand-500 border-2 border-white animate-pulse"
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500" />
        </button>
        <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-slate-100">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 text-xs font-bold">
            {user?.avatar}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.name}</p>
            <p className="text-xs text-slate-400">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="text-slate-400 hover:text-rose-500 transition-colors ml-1"
            title="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </motion.header>
  );
}
