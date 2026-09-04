import { useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Eye,
  EyeOff,
  Lock,
  Phone,
  ShieldCheck,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const features = [
  { icon: TrendingUp, text: "Real-time sales analytics" },
  { icon: Activity, text: "Live agent tracking" },
  { icon: Zap, text: "Instant report exports" },
];

export default function LoginPage({ onNavigate }) {
  const { login, loginError, isLoading } = useAuth();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(mobile, password);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — branding panel */}
      <motion.div
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 px-12 py-14 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 h-72 w-72 rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-white/5 translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/3 right-0 h-48 w-48 rounded-full bg-accent-500/20 translate-x-1/2" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-slate-950/80 flex items-center justify-center backdrop-blur-sm border border-white/20 p-2 shadow-card">
              <img src="/viewonce-icon.png" alt="ViewOnce" className="h-full w-full object-contain" />
            </div>
            <div>
              <img src="/viewonce-logo.png" alt="ViewOnce" className="h-8 w-auto object-contain" />
              <p className="text-brand-200 text-xs font-semibold tracking-wider uppercase mt-0.5">Admin Panel v1.1</p>
            </div>
          </div>
        </div>

        <div className="relative space-y-6">
          <div>
            <h1 className="font-display font-bold text-4xl text-white leading-tight">
              Command your
              <br />
              <span className="text-accent-400">sales empire</span>
            </h1>
            <p className="mt-4 text-brand-200 text-base leading-relaxed font-medium">
              Unified dashboard for multi-branch operations, real-time agent
              tracking, and powerful sales intelligence.
            </p>
          </div>

          <div className="space-y-3">
            {features.map(({ icon: Icon, text }, i) => (
              <motion.div
                key={text}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Icon size={15} className="text-accent-400" />
                </div>
                <span className="text-sm text-brand-100 font-medium">{text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
            <div className="flex -space-x-2">
              {["AB", "SM", "AK"].map((init, i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-300 to-accent-400 flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-brand-800"
                >
                  {init}
                </div>
              ))}
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Agents on duty</p>
              <p className="text-brand-200 text-xs">Across all branches</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-300 font-semibold">Live</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6 py-12">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-slate-950 flex items-center justify-center p-1.5 shadow-md border border-slate-800">
              <img src="/viewonce-icon.png" alt="ViewOnce" className="h-full w-full object-contain" />
            </div>
            <div>
              <img src="/viewonce-logo-dark.png" alt="ViewOnce" className="h-6 w-auto object-contain" />
              <p className="text-slate-400 text-[10px] font-semibold tracking-wider uppercase mt-0.5">Admin Panel</p>
            </div>
          </div>

          <div>
            <h2 className="font-display font-bold text-3xl text-slate-900">
              Welcome back
            </h2>
            <p className="mt-2 text-slate-500 text-sm font-medium">
              Sign in with your admin mobile number
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Mobile */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Mobile Number
              </label>
              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700 font-medium"
              >
                {loginError}
              </motion.div>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold text-sm shadow-brand hover:shadow-brand-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="block h-5 w-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Signing in…
                </>
              ) : (
                "Sign in to Dashboard"
              )}
            </motion.button>
          </form>

          <div className="mt-8 text-center text-xs text-slate-400 font-medium space-y-1.5">
            <p>ViewOnce Admin Panel · Secure Login</p>
            <p>
              <a
                href="/privacy"
                onClick={(e) => {
                  if (onNavigate) {
                    e.preventDefault();
                    onNavigate("/privacy");
                  }
                }}
                className="text-brand-600 hover:text-brand-800 hover:underline transition-colors font-semibold"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
