import { useState } from "react";
import {
  ShieldCheck,
  MapPin,
  User,
  Smartphone,
  Camera,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Share2,
  Lock,
  Trash2,
  RefreshCw,
  Mail,
  Printer,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function PrivacyPolicyPage({ onNavigate }) {
  const { user } = useAuth();
  const [copiedEmail, setCopiedEmail] = useState(false);

  const supportEmail = "dharmeshwarigroupofbusiness@gmail.com";

  const handleCopyEmail = () => {
    navigator.clipboard?.writeText(supportEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    if (onNavigate) {
      onNavigate("/");
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-brand-500 selection:text-white">
      {/* Top sticky header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-950 flex items-center justify-center p-1.5 shadow-sm border border-slate-800">
              <img
                src="/viewonce-icon.png"
                alt="ViewOnce"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex items-center gap-2">
              <img
                src="/viewonce-logo-dark.png"
                alt="ViewOnce"
                className="h-6 w-auto object-contain"
              />
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                Privacy Policy
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
              title="Print or Save as PDF"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            <button
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <ArrowLeft size={14} />
              <span>{user ? "Back to Dashboard" : "Back to Login"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Document Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-card mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
                <ShieldCheck size={26} />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600">
                  Legal & Compliance Documentation
                </span>
                <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">
                  Privacy Policy for ViewOnce
                </h1>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active & Effective
              </span>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Effective Date: September 2026
              </p>
            </div>
          </div>

          <p className="mt-6 text-sm sm:text-base text-slate-600 leading-relaxed">
            This Privacy Policy governs the collection, use, and protection of information
            collected through the <strong className="text-slate-900">ViewOnce</strong> mobile
            application (the &quot;App&quot;). ViewOnce is designed to empower enterprises with
            accurate sales agent attendance, party visit logging, route tracking, and field intelligence.
          </p>

          {/* Quick Table of Contents Pills */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Quick Navigation
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { id: "section-1", title: "1. Introduction" },
                { id: "section-2", title: "2. Information We Collect" },
                { id: "section-3", title: "3. How We Use Information" },
                { id: "section-4", title: "4. Prominent Location Disclosure", highlight: true },
                { id: "section-5", title: "5. Data Sharing" },
                { id: "section-6", title: "6. Security & Retention" },
                { id: "section-7", title: "7. User Rights & Deletion" },
                { id: "section-8", title: "8. Policy Changes" },
                { id: "section-9", title: "9. Contact Us" },
              ].map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                    item.highlight
                      ? "bg-amber-100 text-amber-900 hover:bg-amber-200 font-semibold border border-amber-300"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {item.title}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="space-y-8">
          {/* Section 1: Introduction */}
          <section
            id="section-1"
            className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-card scroll-mt-24"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm">
                1
              </span>
              <h2 className="text-xl font-bold text-slate-900">Introduction</h2>
            </div>
            <div className="space-y-3 text-slate-600 leading-relaxed text-sm sm:text-base">
              <p>
                Welcome to <strong>ViewOnce</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;).
                We are committed to protecting your privacy and ensuring transparency regarding how your
                data is collected, used, and safeguarded. This Privacy Policy governs your use of the{" "}
                <strong>ViewOnce</strong> mobile application (the &quot;App&quot;), designed to manage
                sales agent attendance, party visit logging, route tracking, and field intelligence.
              </p>
              <p>
                By downloading, accessing, or using ViewOnce, you agree to the collection and use of
                information in accordance with this Privacy Policy.
              </p>
            </div>
          </section>

          {/* Section 2: Information We Collect */}
          <section
            id="section-2"
            className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-card scroll-mt-24"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm">
                2
              </span>
              <h2 className="text-xl font-bold text-slate-900">Information We Collect</h2>
            </div>
            <p className="text-slate-600 mb-6 text-sm sm:text-base leading-relaxed">
              To provide accurate sales agent tracking and visit management, ViewOnce collects the following types of information:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Location Card */}
              <div className="md:col-span-2 p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-blue-950 mb-1">
                      Location Information (Foreground & Background)
                    </h3>
                    <p className="text-sm text-blue-900 leading-relaxed">
                      ViewOnce collects precise location data (GPS coordinates) to record field visits,
                      log duty travel routes, and calculate distance covered. Location data is collected
                      continuously in the background <strong>only when you are actively checked in / On-Duty</strong>,
                      even when the App is closed or not in active use.
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">
                      Account & Profile Information
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      User ID, full name, phone number, email address, role, and assigned sales region/party details.
                    </p>
                  </div>
                </div>
              </div>

              {/* Device Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">
                      Device Identification
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Unique Device ID and operating system version for single-device session enforcement, account security, and anti-fraud monitoring.
                    </p>
                  </div>
                </div>
              </div>

              {/* Camera Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Camera size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">
                      Camera & Media Files
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Photos uploaded as proof during party visits, store check-ins, or expense receipts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Logs Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Activity size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">
                      Operational Logs
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Duty status changes (On-Duty / Off-Duty), visit timestamps, and app usage diagnostics.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: How We Use Your Information */}
          <section
            id="section-3"
            className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-card scroll-mt-24"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm">
                3
              </span>
              <h2 className="text-xl font-bold text-slate-900">How We Use Your Information</h2>
            </div>
            <p className="text-slate-600 mb-4 text-sm sm:text-base leading-relaxed">
              We use the collected data strictly for operational, security, and administrative purposes:
            </p>
            <ul className="space-y-3">
              {[
                "To track sales agent field travel routes and generate accurate distance/travel reports during duty hours.",
                "To verify party visit locations and store check-in authenticity.",
                "To enforce single-device active session limits for enterprise account security.",
                "To send essential real-time notifications regarding duty status updates and visit schedules.",
                "To maintain system integrity, troubleshoot bugs, and enhance platform performance.",
              ].map((point, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-slate-700 leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 4: Prominent Disclosure: Background Location Usage (Google Play Compliance Highlight Box) */}
          <section
            id="section-4"
            className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-amber-50 via-white to-amber-50/40 border-2 border-amber-300 shadow-card-md scroll-mt-24 relative overflow-hidden"
          >
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-amber-200/30 blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Radio size={22} className="animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  Google Play & App Store Compliance
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-amber-950">
                  4. Prominent Disclosure: Background Location Usage
                </h2>
              </div>
            </div>

            <p className="text-sm sm:text-base text-amber-950 font-medium leading-relaxed mb-6">
              ViewOnce requires continuous background location access to provide accurate sales route tracking
              and automated visit logging while field representatives perform duty tasks.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* When Starts */}
              <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-amber-200 shadow-sm">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-1.5">
                  <CheckCircle2 size={16} />
                  <span>When Location Tracking Starts</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Tracking begins <strong>only when you explicitly tap &quot;Start Duty&quot;</strong> or check in for your work shift.
                </p>
              </div>

              {/* When Stops */}
              <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-amber-200 shadow-sm">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-sm mb-1.5">
                  <AlertTriangle size={16} />
                  <span>When Location Tracking Stops</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Tracking stops <strong>immediately when you tap &quot;End Duty&quot;</strong>, sign out, or complete your shift.
                </p>
              </div>

              {/* No Hidden Tracking */}
              <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-amber-200 shadow-sm">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-1.5">
                  <ShieldCheck size={16} />
                  <span>No Hidden Tracking</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  We <strong>do not track</strong> your location during personal hours or when your duty status is set to Off-Duty.
                </p>
              </div>

              {/* Notification Indicator */}
              <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-amber-200 shadow-sm">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm mb-1.5">
                  <Radio size={16} />
                  <span>Notification Indicator</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  A persistent foreground notification is displayed on your device whenever background location tracking is active.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Data Sharing & Third-Party Services */}
          <section
            id="section-5"
            className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-card scroll-mt-24"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm">
                5
              </span>
              <h2 className="text-xl font-bold text-slate-900">Data Sharing & Third-Party Services</h2>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 mb-6">
              <p className="text-sm font-semibold text-emerald-900">
                We do not sell, rent, or trade your personal or location data to third parties or advertisers.
              </p>
            </div>
            <p className="text-slate-600 mb-4 text-sm sm:text-base leading-relaxed">
              Data is shared only under the following strictly defined conditions:
            </p>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Enterprise Employers / Admins
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Authorized supervisors and administrative personnel of your organization can view duty routes, visit logs, and performance dashboards.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Mapping & Reverse Geocoding Services
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  We use OpenStreetMap / Nominatim services to convert GPS coordinates into human-readable street addresses.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Legal Requirements
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  If required by applicable law, court order, or governmental regulations.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Data Security & Retention */}
          <section
            id="section-6"
            className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-card scroll-mt-24"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm">
                6
              </span>
              <h2 className="text-xl font-bold text-slate-900">Data Security & Retention</h2>
            </div>
            <div className="space-y-4 text-slate-600 text-sm sm:text-base leading-relaxed">
              <div className="flex items-start gap-3">
                <Lock size={20} className="text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Industry-Standard Encryption</h3>
                  <p>
                    We employ industry-standard security measures, including HTTPS encryption in transit
                    and token-based API authentication, to safeguard your personal information against
                    unauthorized access, loss, or misuse.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Activity size={20} className="text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Retention Period</h3>
                  <p>
                    Location logs and visit data are retained for as long as your enterprise organization
                    maintains an active subscription or as necessary to fulfill operational reporting requirements.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7: User Rights & Data Deletion */}
          <section
            id="section-7"
            className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-card scroll-mt-24"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm">
                7
              </span>
              <h2 className="text-xl font-bold text-slate-900">User Rights & Data Deletion</h2>
            </div>
            <div className="space-y-4 text-slate-600 text-sm sm:text-base leading-relaxed">
              <p>
                You have the right to access, update, or request the deletion of your account and personal data.
                If you wish to revoke location permissions, you can do so at any time via your device settings
                (though this may prevent certain core App features such as visit logging from functioning).
              </p>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Trash2 size={18} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-900 mb-1">
                      Account Deletion & Data Removal Request
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
                      To request account deletion or data removal, please contact your enterprise system administrator
                      or send an email with your registered account details to:
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`mailto:${supportEmail}?subject=Account%20Deletion%20Request%20-%20ViewOnce`}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-colors"
                      >
                        <Mail size={14} />
                        <span>{supportEmail}</span>
                      </a>
                      <button
                        onClick={handleCopyEmail}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        {copiedEmail ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        <span>{copiedEmail ? "Copied" : "Copy Email"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 8: Changes to This Privacy Policy */}
          <section
            id="section-8"
            className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-card scroll-mt-24"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm">
                8
              </span>
              <h2 className="text-xl font-bold text-slate-900">Changes to This Privacy Policy</h2>
            </div>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              We may update this Privacy Policy periodically to reflect changes in legal requirements
              or App functionality. Any updates will be posted on this page with an updated &quot;Effective Date&quot;.
            </p>
          </section>

          {/* Section 9: Contact Us */}
          <section
            id="section-9"
            className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-card-lg scroll-mt-24 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Mail size={20} className="text-brand-300" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">9. Contact Us</h2>
            </div>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
              If you have any questions or concerns regarding this Privacy Policy or data privacy practices, please contact us:
            </p>

            <div className="space-y-3 bg-white/5 border border-white/10 p-5 rounded-2xl max-w-md">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">App Name</span>
                <span className="text-sm font-semibold text-white">ViewOnce</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Support Email</span>
                <a
                  href={`mailto:${supportEmail}`}
                  className="text-sm font-semibold text-accent-300 hover:text-accent-200 underline transition-colors break-all"
                >
                  {supportEmail}
                </a>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
              <p>© 2026 ViewOnce Platform. All rights reserved.</p>
              <button
                onClick={handleBack}
                className="hover:text-white transition-colors underline font-medium"
              >
                Return to ViewOnce
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="mt-12 py-8 bg-white border-t border-slate-200 text-center print:hidden">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/viewonce-logo-dark.png" alt="ViewOnce" className="h-5 w-auto object-contain" />
            <span className="text-xs text-slate-400 font-medium">· Enterprise Field Intelligence</span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            © 2026 ViewOnce Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
