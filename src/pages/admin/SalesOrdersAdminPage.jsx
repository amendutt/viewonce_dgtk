import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, RefreshCw, Filter, Check, X, AlertCircle, ShoppingBag } from "lucide-react";
import { Panel, Input, Select } from "../../components/ui/index.jsx";
import { salesOrdersApi } from "../../api/resources";
import { useApi, useMutation } from "../../api/hooks";
import { useApp } from "../../context/AppContext";
import { currency } from "../../utils/helpers";

const getFirmColor = (firm) => {
  if (firm?.color_code) return firm.color_code;
  const colors = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899"];
  const idNum = Number(firm?.id || 0);
  return colors[idNum % colors.length];
};

export default function SalesOrdersAdminPage() {
  const { firms } = useApp();
  const [status, setStatus] = useState("pending");
  const [firmId, setFirmId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", msg: "" });

  // Modal states for Item-Level approval
  const [approvingOrder, setApprovingOrder] = useState(null);
  const [editedItems, setEditedItems] = useState([]);

  const buildParams = () => {
    const p = { status, page: 1, limit: 50 };
    if (firmId) p.firm_id = firmId;
    if (fromDate) p.from_date = fromDate;
    if (toDate) p.to_date = toDate;
    return p;
  };

  const { data, loading, refetch } = useApi(() => salesOrdersApi.list(buildParams()), [status, firmId, fromDate, toDate]);
  const rows = Array.isArray(data) ? data : data?.rows || data?.orders || [];

  const { mutate: approve, loading: approving } = useMutation((id, payload) => salesOrdersApi.approve(id, payload));
  const { mutate: reject } = useMutation((id, reason) => salesOrdersApi.reject(id, reason));

  const notify = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: "", msg: "" }), 4000);
  };

  const openApprovalModal = (order) => {
    setApprovingOrder(order);
    setEditedItems(
      (order.orderItems || []).map((item) => ({
        id: item.id,
        item_name: item.item_name || item.name,
        quantity: Number(item.quantity || 0),
        rate: Number(item.rate || 0),
        approved: true,
      }))
    );
  };

  const handleItemToggle = (index) => {
    setEditedItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, approved: !item.approved } : item))
    );
  };

  const handleQtyChange = (index, val) => {
    const qty = Math.max(0, parseFloat(val) || 0);
    setEditedItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, quantity: qty } : item)));
  };

  const submitItemApproval = async () => {
    if (!approvingOrder) return;
    const itemsPayload = editedItems.map((item) => {
      if (!item.approved) {
        return { id: item.id, approved: false };
      }
      return { id: item.id, quantity: item.quantity, approved: true };
    });

    const res = await approve(approvingOrder.id, { items: itemsPayload });
    if (res.success) {
      notify("success", `Order #${approvingOrder.id} approved successfully with items list`);
      setApprovingOrder(null);
      refetch();
    } else {
      notify("error", res.error || "Approval failed");
    }
  };

  const handleReject = async (id) => {
    const res = await reject(id, rejectReason || "Rejected by admin");
    if (res.success) {
      notify("success", `Order #${id} rejected`);
      refetch();
      setRejectingId(null);
      setRejectReason("");
    } else {
      notify("error", res.error);
    }
  };

  const firmOptions = [{ label: "All Firms", value: "" }, ...firms.map((f) => ({ label: f.name, value: String(f.id) }))];
  const statusOptions = [{ label: "Pending", value: "pending" }, { label: "Approved", value: "approved" }, { label: "Rejected", value: "rejected" }];
  const pendingCount = rows.filter((r) => (r.status || r.order_status) === "pending").length;

  // Calculate dynamic totals for the modal
  const modalSubtotal = editedItems.reduce((sum, item) => sum + (item.approved ? item.quantity * item.rate : 0), 0);
  const modalAdvance = approvingOrder ? Number(approvingOrder.advance_amount || 0) : 0;
  const modalBalance = Math.max(0, modalSubtotal - modalAdvance);

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">Admin</p>
        <h1 className="font-display font-bold text-2xl text-slate-900">Sales Order Approval</h1>
        <p className="text-sm text-slate-500 mt-0.5">Approve or reject agent orders · {pendingCount} pending</p>
      </motion.div>

      {feedback.msg && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl px-4 py-3 text-sm font-medium ${feedback.type === "success" ? "bg-emerald-50 border border-emerald-100 text-emerald-700" : "bg-rose-50 border border-rose-100 text-rose-700"}`}>
          {feedback.msg}
        </motion.div>
      )}

      <div className="card-lg">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><Filter size={12} /> Filters</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5 items-end">
          <Select label="Status" value={status} options={statusOptions} onChange={setStatus} />
          <Select label="Firm" value={firmId} options={firmOptions} onChange={setFirmId} />
          <Input label="From Date" type="date" value={fromDate} onChange={setFromDate} />
          <Input label="To Date" type="date" value={toDate} onChange={setToDate} />
          <button onClick={refetch} disabled={loading} className="btn-secondary h-11 justify-center">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <Panel title="Sales Orders" subtitle={`Showing ${rows.length} orders`}>
        {loading ? (
          <div className="py-10 text-center"><div className="h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No {status} orders found.</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Agent</th>
                  <th>Party</th>
                  <th>Firm</th>
                  <th>Branch</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Advance</th>
                  <th>Mode</th>
                  <th>Status</th>
                  {status === "rejected" && <th>Rejection Reason</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {rows.map((order) => {
                  const orderStatus = order.status || order.order_status;
                  const agentName = order.SalesAgent?.User?.name || order.agent_name || order.salesman || "—";
                  const partyName = order.Party?.name || order.party_name || order.party || "—";
                  const firmName = order.Firm?.name || order.firm_name || order.firm || "—";
                  const branchName = order.Branch?.name || "—";
                  const orderDate = order.order_date || order.date || order.createdAt?.slice(0, 10) || order.created_at?.slice(0, 10) || "—";
                  const items = order.orderItems || [];

                  // Get color-coded firm info
                  const orderFirm = firms.find((f) => f.name === firmName || Number(f.id) === Number(order.firm_id));
                  const firmColor = orderFirm ? getFirmColor(orderFirm) : "#6366f1";

                  return (
                    <tr key={order.id}>
                      <td className="font-mono text-xs text-slate-600">#{order.id}</td>
                      <td className="text-xs whitespace-nowrap">{orderDate}</td>
                      <td>
                        <div className="text-sm font-medium text-slate-800">{agentName}</div>
                        {order.SalesAgent?.User?.mobile && (
                          <div className="text-[11px] text-slate-400">{order.SalesAgent.User.mobile}</div>
                        )}
                      </td>
                      <td>
                        <div className="text-sm font-medium text-slate-800">{partyName}</div>
                        {order.Party?.mobile && (
                          <div className="text-[11px] text-slate-400">{order.Party.mobile}</div>
                        )}
                      </td>
                      <td className="text-xs">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] transition-all"
                          style={{ backgroundColor: `${firmColor}12`, color: firmColor }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: firmColor }} />
                          {firmName}
                        </span>
                      </td>
                      <td className="text-xs">{branchName}</td>
                      <td className="text-xs">
                        {items.length > 0 ? (
                          <div className="space-y-0.5">
                            {items.map((item) => (
                              <div key={item.id} className="text-[11px] leading-tight">
                                <span className="text-slate-700">{item.item_name}</span>
                                <span className="text-slate-400 ml-1">×{parseFloat(item.quantity)}</span>
                                <span className="text-slate-500 ml-1">@ {currency(item.rate)}</span>
                              </div>
                            ))}
                          </div>
                        ) : "—"}
                      </td>
                      <td className="font-semibold whitespace-nowrap">{currency(order.total_amount || order.amount || 0)}</td>
                      <td className="text-xs whitespace-nowrap">
                        {parseFloat(order.advance_amount) > 0 ? (
                          <span className="text-emerald-600 font-medium">{currency(order.advance_amount)}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="capitalize text-xs">{order.payment_mode}</td>
                      <td>
                        <span className={`badge ${orderStatus === "approved" ? "badge-success" : orderStatus === "rejected" ? "bg-rose-50 text-rose-700" : "badge-warning"}`}>
                          {orderStatus}
                        </span>
                      </td>
                      {status === "rejected" && (
                        <td className="text-xs text-rose-600 font-medium max-w-[180px] truncate" title={order.rejection_reason}>
                          {order.rejection_reason || "—"}
                        </td>
                      )}
                      <td>
                        {orderStatus === "pending" ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => openApprovalModal(order)}
                              className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-250 transition-all hover:scale-105 active:scale-95">
                              <CheckCircle size={13} /> Approve / Edit
                            </button>
                            {rejectingId === order.id ? (
                              <div className="flex items-center gap-1.5">
                                <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                                  placeholder="Reason" className="input-field h-7 text-xs w-28 px-2" />
                                <button onClick={() => handleReject(order.id)} className="text-xs font-semibold text-rose-600">Confirm</button>
                                <button onClick={() => setRejectingId(null)} className="text-xs text-slate-400">Cancel</button>
                              </div>
                            ) : (
                              <button onClick={() => setRejectingId(order.id)}
                                className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-2 py-1.5 rounded-lg border border-rose-100 transition-all hover:scale-105 active:scale-95">
                                <XCircle size={13} /> Reject
                              </button>
                            )}
                          </div>
                        ) : <span className="text-slate-400 text-xs">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Item-Level Editing & Approval Modal */}
      <AnimatePresence>
        {approvingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setApprovingOrder(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-card-lg border border-slate-100 overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ShoppingBag size={18} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-900">Approve Sales Order</h3>
                    <p className="text-xs text-slate-500 font-medium">Order ID: #{approvingOrder.id} · Adjust items before final approval</p>
                  </div>
                </div>
                <button
                  onClick={() => setApprovingOrder(null)}
                  className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Items List */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Order Items Checklist</p>
                <div className="space-y-3">
                  {editedItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border transition-all ${
                        item.approved
                          ? "bg-emerald-50/25 border-emerald-100 hover:border-emerald-200"
                          : "bg-slate-50/60 border-slate-100 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleItemToggle(idx)}
                            className={`h-5 w-5 rounded flex items-center justify-center transition-all mt-0.5 shrink-0 ${
                              item.approved
                                ? "bg-emerald-500 text-white shadow-sm"
                                : "border-2 border-slate-300 text-transparent"
                            }`}
                          >
                            <Check size={14} strokeWidth={3} />
                          </button>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{item.item_name}</p>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">Rate: {currency(item.rate)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-slate-700">
                            {item.approved ? currency(item.quantity * item.rate) : "Excluded"}
                          </span>
                        </div>
                      </div>

                      {item.approved && (
                        <div className="mt-3 flex items-center justify-between border-t border-emerald-100/50 pt-2.5">
                          <span className="text-xs font-medium text-slate-500">Stock Quantity</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0.5"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => handleQtyChange(idx, e.target.value)}
                              className="input-field h-8 w-20 px-2 text-center text-xs font-bold bg-white"
                            />
                            <span className="text-xs text-slate-400">units</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-2.5">
                <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>Subtotal Amount</span>
                  <span>{currency(modalSubtotal)}</span>
                </div>
                {modalAdvance > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 font-medium">
                    <span>Advance Payment</span>
                    <span>- {currency(modalAdvance)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-100 pt-2">
                  <span>Approved Total Amount</span>
                  <span className="text-emerald-600">{currency(modalSubtotal)}</span>
                </div>
                {modalAdvance > 0 && (
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Remaining Balance Due</span>
                    <span>{currency(modalBalance)}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setApprovingOrder(null)}
                    className="btn-secondary flex-1 justify-center h-10"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submitItemApproval}
                    disabled={approving}
                    className="btn-primary flex-1 justify-center h-10 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                  >
                    {approving ? (
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    Confirm & Approve
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
