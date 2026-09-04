import { useRef } from "react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import { Download, Upload } from "lucide-react";
import { numberFields } from "../../data/constants";
import { currency, downloadExcel } from "../../utils/helpers";

export function MetricCard({ icon: Icon, label, value, tone, trend, index = 0 }) {
  const toneMap = {
    brand: {
      bg: "from-brand-600 to-brand-800",
      text: "text-white",
      card: "from-brand-600 to-brand-700",
      cardText: "text-white",
      shadow: "shadow-brand",
      sub: "text-brand-100",
    },
    emerald: {
      bg: "from-emerald-500 to-emerald-700",
      text: "text-white",
      card: "bg-white",
      cardText: "text-slate-800",
      shadow: "",
      sub: "text-emerald-600",
      iconBg: "bg-emerald-50 text-emerald-600",
    },
    amber: {
      bg: "from-amber-400 to-amber-600",
      text: "text-white",
      card: "bg-white",
      cardText: "text-slate-800",
      shadow: "",
      sub: "text-amber-600",
      iconBg: "bg-amber-50 text-amber-600",
    },
    cyan: {
      bg: "from-cyan-500 to-cyan-700",
      text: "text-white",
      card: "bg-white",
      cardText: "text-slate-800",
      shadow: "",
      sub: "text-cyan-600",
      iconBg: "bg-cyan-50 text-cyan-600",
    },
    rose: {
      bg: "from-rose-500 to-rose-700",
      text: "text-white",
      card: "bg-white",
      cardText: "text-slate-800",
      shadow: "",
      sub: "text-rose-600",
      iconBg: "bg-rose-50 text-rose-600",
    },
    violet: {
      bg: "from-violet-500 to-violet-700",
      text: "text-white",
      card: "bg-white",
      cardText: "text-slate-800",
      shadow: "",
      sub: "text-violet-600",
      iconBg: "bg-violet-50 text-violet-600",
    },
  };

  const t = toneMap[tone] || toneMap.brand;
  const isPrimary = tone === "brand";

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-2xl p-5 border border-slate-100 shadow-card ${
        isPrimary
          ? `bg-gradient-to-br ${t.card} text-white`
          : "bg-white"
      }`}
    >
      {isPrimary && (
        <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-white/10 -translate-y-6 translate-x-6" />
      )}
      <div
        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
          isPrimary ? "bg-white/20" : t.iconBg
        }`}
      >
        <Icon size={20} className={isPrimary ? "text-white" : ""} />
      </div>
      <p
        className={`mt-4 text-[11px] font-bold uppercase tracking-wider ${
          isPrimary ? "text-brand-100" : "text-slate-400"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-1 text-xl font-display font-bold tracking-tight ${
          isPrimary ? "text-white" : "text-slate-900"
        }`}
      >
        {value}
      </p>
      {trend && (
        <p
          className={`mt-1 text-xs font-semibold ${
            isPrimary ? "text-brand-100" : t.sub
          }`}
        >
          {trend}
        </p>
      )}
    </motion.div>
  );
}

export function Panel({ id, title, subtitle, action, children, className = "" }) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`card-lg ${className}`}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display font-bold text-lg text-slate-900">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex flex-wrap gap-2 sm:shrink-0">{action}</div>}
      </div>
      {children}
    </motion.section>
  );
}

export function DataTable({ rows, columns }) {
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => {
              let label = col;
              if (col === "outstanding") label = "Pending Balance";
              else if (col === "payment_mode" || col === "paymentMode") label = "Mode of Payment";
              else if (col === "remaining_balance" || col === "remainingBalance") label = "Remaining Balance";
              else if (col === "items_count" || col === "itemsCount") label = "Items";
              else label = col.replace(/_/g, " ").replace(/([A-Z])/g, " $1");
              return <th key={col}>{label}</th>;
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 bg-white">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-10 text-center text-slate-400 text-sm"
              >
                No records found
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={`${row.id || row.party || row.vendor || row.vertical || index}`}>
                {columns.map((col) => (
                  <td key={col}>
                    {numberFields.has(col) && col !== "qty" && col !== "totalQty"
                      ? currency(row[col])
                      : col === "vertical" || col === "status" || col === "order_status" || col === "agent_status" || col === "live_tracking_status"
                      ? <VerticalBadge value={row[col]} />
                      : row[col]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function VerticalBadge({ value }) {
  const colorMap = {
    TYRE: "badge-brand",
    BATTERY: "badge-success",
    LUBES: "badge-warning",
    HAVELLS: "bg-violet-50 text-violet-700",
    SOLAR: "bg-orange-50 text-orange-700",
    GOV: "bg-cyan-50 text-cyan-700",
    "On Duty": "badge-success",
    "on_duty": "badge-success",
    Live: "badge-success",
    live: "badge-success",
    Offline: "badge-slate",
    offline: "badge-slate",
    approved: "badge-success",
    Approved: "badge-success",
    pending: "badge-warning",
    Pending: "badge-warning",
    rejected: "bg-rose-50 text-rose-700",
    Rejected: "bg-rose-50 text-rose-700",
    active: "badge-success",
    Active: "badge-success",
    inactive: "badge-slate",
    Inactive: "badge-slate",
  };
  return (
    <span className={`badge ${colorMap[String(value)] || "badge-slate"}`}>{value}</span>
  );
}

export function ExportButton({ label, rows, fileName }) {
  return (
    <button
      onClick={() => downloadExcel(fileName, rows)}
      className="btn-secondary h-9 text-xs"
    >
      <Download size={14} />
      {label}
    </button>
  );
}

export function ImportButton({ label, onRows }) {
  const inputRef = useRef(null);
  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="btn-secondary h-9 text-xs"
      >
        <Upload size={14} />
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const data = await file.arrayBuffer();
          const wb = XLSX.read(data);
          const sheet = wb.Sheets[wb.SheetNames[0]];
          onRows(XLSX.utils.sheet_to_json(sheet, { defval: "" }));
          e.target.value = "";
        }}
      />
    </>
  );
}

export function Input({ label, value, onChange, placeholder, type = "text", disabled }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="input-field disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50"
      />
    </label>
  );
}

export function Select({ label, value, options = [], onChange, disabled }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="input-field cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {options.map((opt) => {
          // Support both plain strings and { label, value } objects
          if (typeof opt === "object" && opt !== null) {
            return (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            );
          }
          return <option key={opt} value={opt}>{opt}</option>;
        })}
      </select>
    </label>
  );
}

export function SectionHeading({ title, description }) {
  return (
    <div className="mb-5">
      <h2 className="font-display font-bold text-2xl text-slate-900">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      )}
    </div>
  );
}

export function MultiSelect({ label, selectedValues = [], options = [], onChange, disabled }) {
  const handleToggle = (val) => {
    if (disabled) return;
    const isSelected = selectedValues.includes(val);
    const newValues = isSelected
      ? selectedValues.filter((v) => v !== val)
      : [...selectedValues, val];
    onChange(newValues);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <div className="border border-slate-200 rounded-xl p-3 bg-white max-h-40 overflow-y-auto space-y-2">
        {options.length === 0 ? (
          <p className="text-xs text-slate-400">No options available</p>
        ) : (
          options.map((opt) => {
            const optLabel = typeof opt === "object" ? opt.label : opt;
            const optValue = typeof opt === "object" ? opt.value : opt;
            const isChecked = selectedValues.includes(optValue);
            return (
              <label key={optValue} className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700 hover:text-brand-700 transition-colors">
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={disabled}
                  onChange={() => handleToggle(optValue)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <span>{optLabel}</span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
