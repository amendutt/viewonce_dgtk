import { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Restore session on mount
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { setInitializing(false); return; }
    authApi.me()
      .then((res) => {
        const u = res.data?.data || res.data;
        setUser({
          name: u.name,
          role: u.role,
          email: u.email,
          mobile: u.mobile,
          avatar: (u.name || "AU").slice(0, 2).toUpperCase(),
          id: u.id,
        });
      })
      .catch(() => {
        localStorage.clear();
      })
      .finally(() => setInitializing(false));
  }, []);

  const login = async (mobile, password) => {
    setIsLoading(true);
    setLoginError("");
    try {
      const res = await authApi.login(mobile, password);
      const payload = res.data?.data || res.data;
      const { accessToken, refreshToken, user: u } = payload;
      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      setUser({
        name: u.name,
        role: u.role,
        email: u.email,
        mobile: u.mobile,
        avatar: (u.name || "AU").slice(0, 2).toUpperCase(),
        id: u.id,
      });
      setIsLoading(false);
      return true;
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Invalid credentials. Please try again.";
      setLoginError(msg);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try { await authApi.logout(); } catch (_) {}
    localStorage.clear();
    setUser(null);
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-slate-950 p-2 shadow-sm border border-slate-800 flex items-center justify-center">
            <img src="/viewonce-icon.png" alt="ViewOnce" className="h-full w-full object-contain" />
          </div>
          <div className="h-5 w-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-semibold tracking-wide">Loading ViewOnce…</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loginError, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
