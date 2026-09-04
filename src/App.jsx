import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import LoginPage from "./pages/LoginPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import DashboardPage from "./pages/DashboardPage";
import LiveLocationsPage from "./pages/LiveLocationsPage";
import SalesReportsPage from "./pages/SalesReportsPage";
import PurchasePage from "./pages/PurchasePage";
import AgentIdsPage from "./pages/AgentIdsPage";
import TargetsPage from "./pages/TargetsPage";
import VerticalsPage from "./pages/VerticalsPage";
import CollectionPage from "./pages/CollectionPage";
import OutstandingPage from "./pages/OutstandingPage";
import AnalysisPage from "./pages/AnalysisPage";
// Admin pages
import SalesOrdersAdminPage from "./pages/admin/SalesOrdersAdminPage";
import FirmsAdminPage from "./pages/admin/FirmsAdminPage";
import BranchesAdminPage from "./pages/admin/BranchesAdminPage";
import PartiesAdminPage from "./pages/admin/PartiesAdminPage";
import ItemsAdminPage from "./pages/admin/ItemsAdminPage";
import SubItemsAdminPage from "./pages/admin/SubItemsAdminPage";
import PurchasesAdminPage from "./pages/admin/PurchasesAdminPage";
import EodReportsAdminPage from "./pages/admin/EodReportsAdminPage";
import PaymentsAdminPage from "./pages/admin/PaymentsAdminPage";
import ImportsAdminPage from "./pages/admin/ImportsAdminPage";
import RoutePlansPage from "./pages/admin/RoutePlansPage";
import SalesmanActivityAdminPage from "./pages/admin/SalesmanActivityAdminPage";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";

const PAGES = {
  dashboard: DashboardPage,
  "live-locations": LiveLocationsPage,
  "sales-reports": SalesReportsPage,
  "purchase-outstanding": PurchasePage,
  "agent-ids": AgentIdsPage,
  targets: TargetsPage,
  verticals: VerticalsPage,
  collection: CollectionPage,
  outstanding: OutstandingPage,
  analysis: AnalysisPage,
  // Admin
  "admin-orders": SalesOrdersAdminPage,
  "admin-firms": FirmsAdminPage,
  "admin-branches": BranchesAdminPage,
  "admin-parties": PartiesAdminPage,
  "admin-items": ItemsAdminPage,
  "admin-sub-items": SubItemsAdminPage,
  "admin-purchases": PurchasesAdminPage,
  "admin-eod": EodReportsAdminPage,
  "admin-payments": PaymentsAdminPage,
  "admin-imports": ImportsAdminPage,
  "admin-route-plans": RoutePlansPage,
  "admin-salesman-activity": SalesmanActivityAdminPage,
};

function isPrivacyPath() {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, "");
  const hash = window.location.hash.toLowerCase().replace(/\/+$/, "");
  return path === "/privacy" || hash === "#/privacy" || hash === "#privacy";
}

function MainLayout() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPrivacy, setIsPrivacy] = useState(isPrivacyPath);

  useEffect(() => {
    const handleLocationChange = () => {
      setIsPrivacy(isPrivacyPath());
    };
    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("hashchange", handleLocationChange);
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("hashchange", handleLocationChange);
    };
  }, []);

  const navigateTo = (path) => {
    if (path === "/privacy") {
      window.history.pushState({}, "", "/privacy");
      setIsPrivacy(true);
    } else {
      window.history.pushState({}, "", "/");
      setIsPrivacy(false);
    }
  };

  // Public access: Anyone can access /privacy directly without logging in
  if (isPrivacy) {
    return <PrivacyPolicyPage onNavigate={navigateTo} />;
  }

  if (!user) return <LoginPage onNavigate={navigateTo} />;

  const PageComponent = PAGES[activeSection] || DashboardPage;

  return (
    <AppProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar
          activeSection={activeSection}
          onNavigate={(section) => { setActiveSection(section); setMobileMenuOpen(false); }}
          className="hidden lg:flex"
        />

        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden" />
              <motion.div initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
                transition={{ type: "spring", stiffness: 400, damping: 40 }}
                className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-card-lg z-40 lg:hidden h-full">
                <Sidebar
                  activeSection={activeSection}
                  isMobile={true}
                  className="h-full"
                  onNavigate={(section) => { setActiveSection(section); setMobileMenuOpen(false); }}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
          <Topbar onMenuClick={() => setMobileMenuOpen(true)} />
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
            <AnimatePresence mode="wait">
              <motion.div key={activeSection}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                <PageComponent />
              </motion.div>
            </AnimatePresence>
          </main>
          <footer className="px-6 py-4 border-t border-slate-100 text-center flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-slate-400 font-medium">ViewOnce Admin Panel · Lucknow, UP</p>
            <a
              href="/privacy"
              onClick={(e) => {
                e.preventDefault();
                navigateTo("/privacy");
              }}
              className="text-xs text-slate-400 hover:text-brand-600 font-medium hover:underline transition-colors"
            >
              Privacy Policy
            </a>
          </footer>
        </div>
      </div>
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
