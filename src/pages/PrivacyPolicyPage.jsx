import { useState, useEffect } from "react";
import {
  Printer,
  ArrowLeft,
  Copy,
  Check,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function PrivacyPolicyPage({ onNavigate }) {
  const { user } = useAuth();
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    const originalTitle = document.title;
    document.title = "Privacy Policy — ViewOnce";
    return () => {
      document.title = originalTitle;
    };
  }, []);

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
      onNavigate(user ? "/" : "/login");
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-slate-300 antialiased selection:bg-blue-600 selection:text-white py-8 sm:py-14 px-4 sm:px-6 lg:px-8">
      {/* Top Floating Utility Bar (Hidden during print) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between gap-3 print:hidden">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-all shadow-sm"
        >
          <ArrowLeft size={14} />
          <span>{user ? "Back to Dashboard" : "Back to Login"}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyEmail}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-all shadow-sm"
            title="Copy Support Email"
          >
            {copiedEmail ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copiedEmail ? "Email Copied" : "Copy Email"}</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-all shadow-sm"
            title="Print or Save as PDF"
          >
            <Printer size={14} />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Header Container */}
      <header className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center px-3.5 py-1 rounded-full text-[11px] font-semibold tracking-wider text-sky-400 bg-sky-500/10 border border-sky-500/30 uppercase mb-3">
          VIEWONCE MOBILE APPLICATION
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2">
          Privacy Policy
        </h1>
        <p className="text-slate-400 text-sm sm:text-base font-medium">
          Real-Time Sales Agent Tracking &amp; Intelligence Platform
        </p>
        <p className="text-sky-400 text-xs sm:text-sm font-medium mt-2">
          Effective Date: September 4, 2025
        </p>
      </header>

      {/* Main Content Card */}
      <main className="max-w-4xl mx-auto rounded-2xl sm:rounded-3xl bg-[#0f172a]/95 border border-slate-800 shadow-2xl p-6 sm:p-10 md:p-12 space-y-8 text-sm sm:text-[15px] leading-relaxed">
        {/* 1. Introduction */}
        <section>
          <h2 className="text-base sm:text-lg font-bold text-white mb-3">
            1. Introduction
          </h2>
          <div className="space-y-3 text-slate-300">
            <p>
              Welcome to <strong className="text-white font-semibold">ViewOnce</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your privacy and ensuring transparency regarding how your data is collected, used, and safeguarded. This Privacy Policy governs your use of the ViewOnce mobile application (the &quot;App&quot;), designed to manage sales agent attendance, party visit logging, route tracking, and field intelligence.
            </p>
            <p>
              By downloading, accessing, or using ViewOnce, you agree to the collection and use of information in accordance with this Privacy Policy.
            </p>
          </div>
        </section>

        {/* 2. Information We Collect */}
        <section>
          <h2 className="text-base sm:text-lg font-bold text-white mb-3">
            2. Information We Collect
          </h2>
          <p className="text-slate-300 mb-3">
            To provide accurate sales agent tracking and visit management, ViewOnce collects the following types of information:
          </p>

          {/* Location Callout Box */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#0c1c38] border border-blue-500/40 text-slate-200 mb-4 leading-relaxed">
            <span className="text-sky-400 font-semibold">
              Location Information (Foreground &amp; Background):{" "}
            </span>
            <span>
              ViewOnce collects precise location data (GPS coordinates) to record field visits, log duty travel routes, and calculate distance covered. Location data is collected continuously in the background{" "}
              <span className="underline underline-offset-2 font-medium text-white">
                only when you are actively checked in / On-Duty, even when the App is closed or not in active use
              </span>.
            </span>
          </div>

          <ul className="space-y-2.5 text-slate-300">
            <li className="flex items-start gap-2.5">
              <span className="text-slate-500 mt-1.5">•</span>
              <span>
                <strong className="text-slate-100 font-semibold">Account &amp; Profile Information:</strong> User ID, full name, phone number, email address, role, and assigned sales region/party details.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-slate-500 mt-1.5">•</span>
              <span>
                <strong className="text-slate-100 font-semibold">Device Identification:</strong> Unique Device ID and operating system version for single-device session enforcement, account security, and anti-fraud monitoring.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-slate-500 mt-1.5">•</span>
              <span>
                <strong className="text-slate-100 font-semibold">Camera &amp; Media Files:</strong> Photos uploaded as proof during party visits, store check-ins, or expense receipts.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-slate-500 mt-1.5">•</span>
              <span>
                <strong className="text-slate-100 font-semibold">Operational Logs:</strong> Duty status changes (On-Duty / Off-Duty), visit timestamps, and app usage diagnostics.
              </span>
            </li>
          </ul>
        </section>

        {/* 3. How We Use Your Information */}
        <section>
          <h2 className="text-base sm:text-lg font-bold text-white mb-3">
            3. How We Use Your Information
          </h2>
          <p className="text-slate-300 mb-3">
            We use the collected data strictly for operational, security, and administrative purposes:
          </p>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-start gap-2.5">
              <span className="text-slate-500 mt-1.5">•</span>
              <span>To track sales agent field travel routes and generate accurate distance/travel reports during duty hours.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-slate-500 mt-1.5">•</span>
              <span>To verify party visit locations and store check-in authenticity.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-slate-500 mt-1.5">•</span>
              <span>To enforce single-device active session limits for enterprise account security.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-slate-500 mt-1.5">•</span>
              <span>To send essential real-time notifications regarding duty status updates and visit schedules.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-slate-500 mt-1.5">•</span>
              <span>To maintain system integrity, troubleshoot bugs, and enhance platform performance.</span>
            </li>
          </ul>
        </section>

        {/* 4. Prominent Disclosure: Background Location Usage */}
        <section>
          <h2 className="text-base sm:text-lg font-bold text-white mb-3">
            4. Prominent Disclosure: Background Location Usage
          </h2>
          <p className="text-slate-300 mb-3">
            ViewOnce requires continuous background location access to provide accurate sales route tracking and automated visit logging while field representatives perform duty tasks.
          </p>
          <ul className="space-y-2.5 text-slate-300">
            <li className="flex items-start gap-2.5">
              <span className="text-slate-500 mt-1.5">•</span>
              <span>
                <strong className="text-slate-100 font-semibold">When Location Tracking Starts:</strong> Tracking begins only when you explicitly tap &quot;Start Duty&quot; or check in for your work shift.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-slate-500 mt-1.5">•</span>
              <span>
                <strong className="text-slate-100 font-semibold">When Location Tracking Stops:</strong> Tracking stops immediately when you tap &quot;End Duty&quot;, sign out, or complete your shift.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-slate-500 mt-1.5">•</span>
              <span>
                <strong className="text-slate-100 font-semibold">No Hidden Tracking:</strong> We do not track your location during personal hours or when your duty status is set to Off-Duty.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-slate-500 mt-1.5">•</span>
              <span>
                <strong className="text-slate-100 font-semibold">Notification Indication:</strong> A persistent foreground notification is displayed on your device whenever background location tracking is active.
              </span>
            </li>
          </ul>
        </section>

        {/* 5. Data Sharing & Third-Party Services */}
        <section>
          <h2 className="text-base sm:text-lg font-bold text-white mb-3">
            5. Data Sharing &amp; Third-Party Services
          </h2>
          <p className="text-slate-300 mb-3">
            We do not sell, rent, or trade your personal or location data to third parties or advertisers. Data is shared only under the following strictly defined conditions:
          </p>
          <ul className="space-y-2.5 text-slate-300">
            <li className="flex items-start gap-2.5">
              <span className="text-slate-500 mt-1.5">•</span>
              <span>
                <strong className="text-slate-100 font-semibold">Enterprise Employers/Admins:</strong> Authorized supervisors and administrative personnel of your organization can view duty routes, visit logs, and performance dashboards.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-slate-500 mt-1.5">•</span>
              <span>
                <strong className="text-slate-100 font-semibold">Mapping &amp; Reverse Geocoding Services:</strong> We use OpenStreetMap / Nominatim services to convert GPS coordinates into human-readable street addresses.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-slate-500 mt-1.5">•</span>
              <span>
                <strong className="text-slate-100 font-semibold">Legal Requirements:</strong> If required by applicable law, court order, or governmental regulations.
              </span>
            </li>
          </ul>
        </section>

        {/* 6. Data Security & Retention */}
        <section>
          <h2 className="text-base sm:text-lg font-bold text-white mb-3">
            6. Data Security &amp; Retention
          </h2>
          <div className="space-y-3 text-slate-300">
            <p>
              We employ industry-standard security measures, including HTTPS encryption in transit and token-based API authentication, to safeguard your personal information against unauthorized access, loss, or misuse.
            </p>
            <p>
              Location logs and visit data are retained for as long as your enterprise organization maintains an active subscription or as necessary to fulfill operational reporting requirements.
            </p>
          </div>
        </section>

        {/* 7. User Rights & Data Deletion */}
        <section>
          <h2 className="text-base sm:text-lg font-bold text-white mb-3">
            7. User Rights &amp; Data Deletion
          </h2>
          <div className="space-y-3 text-slate-300">
            <p>
              You have the right to access, update, or request the deletion of your account and personal data. If you wish to revoke location permissions, you can do so at any time via your device settings (though this may prevent certain core App features such as visit logging from functioning).
            </p>
            <p>
              To request account deletion or data removal, please contact your enterprise system administrator or send an email to{" "}
              <a
                href={`mailto:${supportEmail}`}
                className="text-sky-400 hover:text-sky-300 underline font-medium transition-colors"
              >
                {supportEmail}
              </a>{" "}
              with your registered account details.
            </p>
          </div>
        </section>

        {/* 8. Changes to This Privacy Policy */}
        <section>
          <h2 className="text-base sm:text-lg font-bold text-white mb-3">
            8. Changes to This Privacy Policy
          </h2>
          <p className="text-slate-300">
            We may update this Privacy Policy periodically to reflect changes in legal requirements or App functionality. Any updates will be posted on this page with an updated &quot;Effective Date&quot;.
          </p>
        </section>

        {/* 9. Contact Us */}
        <section>
          <h2 className="text-base sm:text-lg font-bold text-white mb-3">
            9. Contact Us
          </h2>
          <p className="text-slate-300 mb-3">
            If you have any questions or concerns regarding this Privacy Policy or data privacy practices, please contact us:
          </p>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-start gap-2.5">
              <span className="text-slate-500 mt-1.5">•</span>
              <span>
                <strong className="text-slate-100 font-semibold">App Name:</strong> ViewOnce
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-slate-500 mt-1.5">•</span>
              <span>
                <strong className="text-slate-100 font-semibold">Support Email:</strong>{" "}
                <a
                  href={`mailto:${supportEmail}`}
                  className="text-sky-400 hover:text-sky-300 underline font-medium transition-colors"
                >
                  {supportEmail}
                </a>
              </span>
            </li>
          </ul>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-slate-500 font-medium">
        <p>© 2026 ViewOnce Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
