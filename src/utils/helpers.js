import * as XLSX from "xlsx";
import { numberFields, initialSalesRows, initialPurchaseRows } from "../data/constants";

export const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export const downloadExcel = (fileName, rows) => {
  const worksheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{}]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  XLSX.writeFile(workbook, fileName);
};

export const downloadTemplate = (type) => {
  const rows = type === "purchase" ? [initialPurchaseRows[0]] : [initialSalesRows[0]];
  downloadExcel(`${type}-import-template.xlsx`, rows);
};

export const normalizeRows = (rows, type) => {
  const template =
    type === "purchase" ? initialPurchaseRows[0] : initialSalesRows[0];
  return rows.map((row, index) => {
    const normalized = { ...template, ...row };
    Object.keys(normalized).forEach((key) => {
      if (numberFields.has(key)) normalized[key] = Number(normalized[key] || 0);
    });
    normalized.id = `${type}-${Date.now()}-${index}`;
    return normalized;
  });
};

export const collectionRows = (rows) =>
  rows.map((row) => ({
    date: row.date,
    salesman: row.salesman,
    cash: row.cash,
    wallet: row.wallet,
    upi: row.upi,
    bankDeposit: row.bankDeposit,
    cheque: Number(row.cheque ?? row.wallet ?? 0),
    accountTransfer: Number(row.accountTransfer ?? 0),
    chequeOnline:
      Number(row.cheque ?? 0) + Number(row.accountTransfer ?? row.wallet ?? 0) + Number(row.upi ?? 0) + Number(row.bankDeposit ?? 0),
    credit: row.credit,
    advance: row.advance,
    grandTotal:
      Number(row.cash || 0) + Number(row.wallet || 0) + Number(row.advance || 0) + Number(row.upi || 0) + Number(row.bankDeposit || 0),
  }));

export const formatPercent = (value, total) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

export const parseReportDate = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const [day, month, year] = String(value).split("-").map(Number);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
};

export const salesValue = (row) =>
  Number(row.cash || 0) +
  Number(row.wallet || 0) +
  Number(row.upi || 0) +
  Number(row.bankDeposit || 0) +
  Number(row.credit || 0) +
  Number(row.advance || 0);

export const recoveryValue = (row) =>
  Number(row.recoveryCash ?? row.cash ?? 0) +
  Number(row.recoveryCheque ?? row.cheque ?? 0) +
  Number(row.recoveryAccountTransfer ?? row.accountTransfer ?? 0) +
  Number(row.recoveryUpi ?? row.upi ?? 0) +
  Number(row.recoveryBankDeposit ?? row.bankDeposit ?? 0);

const monthLabel = (date) =>
  date.toLocaleString("en-IN", { month: "short", year: "numeric" });

const monthKey = (date) => `${date.getFullYear()}-${date.getMonth()}`;

const blankBucket = () => ({
  salesTotal: 0,
  recoveryCash: 0,
  recoveryCheque: 0,
  recoveryAccountTransfer: 0,
  recoveryUpi: 0,
  recoveryBankDeposit: 0,
  recoveryTotal: 0,
});

const addRowToBucket = (bucket, row) => {
  bucket.salesTotal += salesValue(row);
  bucket.recoveryCash += Number(row.recoveryCash ?? row.cash ?? 0);
  bucket.recoveryCheque += Number(row.recoveryCheque ?? row.cheque ?? 0);
  bucket.recoveryAccountTransfer += Number(
    row.recoveryAccountTransfer ?? row.accountTransfer ?? 0
  );
  bucket.recoveryUpi += Number(row.recoveryUpi ?? row.upi ?? 0);
  bucket.recoveryBankDeposit += Number(row.recoveryBankDeposit ?? row.bankDeposit ?? 0);
  bucket.recoveryTotal =
    bucket.recoveryCash + bucket.recoveryCheque + bucket.recoveryAccountTransfer + bucket.recoveryUpi + bucket.recoveryBankDeposit;
};

export const fortnightComparisonRows = (rows) => {
  const datedRows = rows
    .map((row) => ({ ...row, parsedDate: parseReportDate(row.date) }))
    .filter((row) => row.parsedDate);

  const latestDate = datedRows.reduce(
    (latest, row) => (row.parsedDate > latest ? row.parsedDate : latest),
    datedRows[0]?.parsedDate || new Date()
  );
  const currentMonth = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
  const lastMonth = new Date(latestDate.getFullYear(), latestDate.getMonth() - 1, 1);

  return [
    { label: "Days 1-15", start: 1, end: 15 },
    { label: "Days 16-End", start: 16, end: 31 },
  ].map((period) => {
    const current = blankBucket();
    const previous = blankBucket();

    datedRows.forEach((row) => {
      const day = row.parsedDate.getDate();
      if (day < period.start || day > period.end) return;

      const key = monthKey(row.parsedDate);
      if (key === monthKey(currentMonth)) addRowToBucket(current, row);
      if (key === monthKey(lastMonth)) addRowToBucket(previous, row);
    });

    return {
      period: period.label,
      currentLabel: monthLabel(currentMonth),
      lastLabel: monthLabel(lastMonth),
      currentMonth: current.salesTotal,
      lastMonth: previous.salesTotal,
      change: current.salesTotal - previous.salesTotal,
      changePercent: `${formatPercent(
        current.salesTotal - previous.salesTotal,
        previous.salesTotal
      )}%`,
      currentRecoveryTotal: current.recoveryTotal,
      lastRecoveryTotal: previous.recoveryTotal,
      currentCashRecovery: current.recoveryCash,
      lastCashRecovery: previous.recoveryCash,
      currentChequeRecovery: current.recoveryCheque,
      lastChequeRecovery: previous.recoveryCheque,
      currentTransferRecovery: current.recoveryAccountTransfer,
      lastTransferRecovery: previous.recoveryAccountTransfer,
      currentUpiRecovery: current.recoveryUpi,
      lastUpiRecovery: previous.recoveryUpi,
      currentBankDepositRecovery: current.recoveryBankDeposit,
      lastBankDepositRecovery: previous.recoveryBankDeposit,
    };
  });
};
