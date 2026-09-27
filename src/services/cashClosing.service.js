// services/cashClosing.service.js
import { CashRegister, METHOD_MAP } from "../models/CashRegister.js";
import { Sale } from "../models/Sale.js";
import { Payment } from "../models/Payment.js";
import { Expense } from "../models/Expense.js";

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const emptyBreakdown = () => ({
  efectivo: 0,
  tarjeta: 0,
  transferencia: 0,
  total: 0,
});

/**
 * Expresión de agregación que normaliza el medio de pago:
 * debito | credito | mercadopago -> tarjeta
 */
const normalizedMethod = {
  $switch: {
    branches: [
      {
        case: {
          $in: [
            "$paymentMethod",
            ["debito", "credito", "mercadopago", "tarjeta"],
          ],
        },
        then: "tarjeta",
      },
      { case: { $eq: ["$paymentMethod", "transferencia"] }, then: "transferencia" },
      { case: { $eq: ["$paymentMethod", "fiado"] }, then: "fiado" },
    ],
    default: "efectivo",
  },
};

/**
 * Filtro del turno. Prioriza el ref cashRegister; opcionalmente incluye
 * movimientos sin vincular (datos previos a la migración) por ventana temporal.
 */
function scopeFilter(cash, { includeUnlinked = true, cutoff } = {}) {
  const linked = { cashRegister: cash._id };
  if (!includeUnlinked) return linked;

  const window = { $gte: cash.openedAt, $lte: cash.closedAt || cutoff || new Date() };
  return {
    $or: [linked, { cashRegister: null, createdAt: window }],
  };
}

/** Convierte el resultado de un $group por método en un desglose plano. */
function toBreakdown(rows) {
  const breakdown = emptyBreakdown();
  let count = 0;

  for (const row of rows) {
    const key = METHOD_MAP[row._id] || "efectivo";
    if (key === "fiado") continue; // el fiado no entra en desgloses de cobro
    breakdown[key] = round2(breakdown[key] + row.total);
    count += row.count;
  }

  breakdown.total = round2(
    breakdown.efectivo + breakdown.tarjeta + breakdown.transferencia
  );

  return { breakdown, count };
}

const groupByMethod = (amountField) => [
  {
    $group: {
      _id: normalizedMethod,
      total: { $sum: `$${amountField}` },
      count: { $sum: 1 },
    },
  },
];

/**
 * Calcula el reporte del turno. No persiste nada: se usa tanto para la
 * previsualización como para el cierre definitivo.
 */
export async function buildClosingReport(cash, options = {}) {
  const cutoff = options.cutoff || new Date();
  const scope = scopeFilter(cash, { ...options, cutoff });
  const notCancelled = { cancelled: { $ne: true } };

  const [salesRows, creditRows, paymentRows, expenseRows] = await Promise.all([
    // Ventas cobradas en el momento (excluye fiado)
    Sale.aggregate([
      { $match: { ...scope, ...notCancelled, paymentMethod: { $ne: "fiado" } } },
      ...groupByMethod("total"),
    ]),

    // Fiado generado: se factura pero no ingresa plata hoy
    Sale.aggregate([
      { $match: { ...scope, ...notCancelled, paymentMethod: "fiado" } },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]),

    // Fiado recuperado: cobros de deuda por medio de pago real
    Payment.aggregate([
      { $match: { ...scope, ...notCancelled } },
      ...groupByMethod("amount"),
    ]),

    // Gastos del turno (Expense, no Purchase)
    Expense.aggregate([
      { $match: { ...scope, ...notCancelled } },
      ...groupByMethod("amount"),
    ]),
  ]);

  const sales = toBreakdown(salesRows);
  const recovered = toBreakdown(paymentRows);
  const expenses = toBreakdown(expenseRows);

  const creditGiven = round2(creditRows[0]?.total || 0);
  const creditGivenCount = creditRows[0]?.count || 0;

  const totalIncome = round2(sales.breakdown.total + recovered.breakdown.total);

  // Solo los movimientos en efectivo afectan el cajón
  const expectedCash = round2(
    cash.openingAmount +
      sales.breakdown.efectivo +
      recovered.breakdown.efectivo -
      expenses.breakdown.efectivo
  );

  const finalBalance = round2(totalIncome - expenses.breakdown.total);

  return {
    sales: sales.breakdown,
    salesCount: sales.count,
    creditGiven,
    creditGivenCount,
    creditRecovered: recovered.breakdown,
    creditRecoveredCount: recovered.count,
    expenses: expenses.breakdown,
    expensesCount: expenses.count,
    totalIncome,
    expectedCash,
    finalBalance,
    calculatedAt: new Date(),
  };
}

/**
 * Aplana el reporte para el frontend: todo redondeado y sin cálculos pendientes.
 */
export function formatClosingResponse(cash, report, { closed }) {
  const declared = closed ? cash.closingAmount : null;

  return {
    cashRegister: {
      id: cash._id,
      isOpen: !closed,
      openingAmount: round2(cash.openingAmount),
      openedAt: cash.openedAt,
      openedBy: cash.openedBy,
      closedAt: closed ? cash.closedAt : null,
      closedBy: closed ? cash.closedBy : null,
      notes: cash.closingNotes || null,
    },
    sales: {
      count: report.salesCount,
      byMethod: report.sales,
    },
    credit: {
      given: report.creditGiven,
      givenCount: report.creditGivenCount,
      recovered: report.creditRecovered,
      recoveredCount: report.creditRecoveredCount,
      // Cuánto creció o bajó la deuda total de clientes en el turno
      debtVariation: round2(report.creditGiven - report.creditRecovered.total),
    },
    expenses: {
      total: report.expenses.total,
      byMethod: report.expenses,
      count: report.expensesCount,
    },
    totals: {
      totalIncome: report.totalIncome,
      expenses: report.expenses.total,
      finalBalance: report.finalBalance,
      expectedCash: report.expectedCash,
      declaredCash: declared,
      difference: closed ? round2(cash.difference) : null,
      // Facturación total, incluyendo lo que se fue a fiado
      totalBilled: round2(report.sales.total + report.creditGiven),
    },
    calculatedAt: report.calculatedAt,
  };
}

/**
 * Previsualización del cierre: no modifica nada.
 */
export async function previewClosing() {
  const cash = await CashRegister.findOpen();
  if (!cash) {
    const err = new Error("No hay caja abierta");
    err.status = 409;
    err.code = "CASH_REGISTER_NOT_OPEN";
    throw err;
  }

  const report = await buildClosingReport(cash);
  return formatClosingResponse(cash, report, { closed: false });
}

/**
 * Cierre definitivo. El filtro { isOpen: true } lo hace idempotente
 * frente a doble click o requests concurrentes.
 */
export async function closeCurrentCashRegister({
  closingAmount,
  userId,
  notes,
} = {}) {
  const amount = Number(closingAmount);
  if (!Number.isFinite(amount) || amount < 0) {
    const err = new Error("closingAmount es requerido y debe ser un número >= 0");
    err.status = 400;
    err.code = "INVALID_CLOSING_AMOUNT";
    throw err;
  }

  const cash = await CashRegister.findOpen();
  if (!cash) {
    const err = new Error("No hay caja abierta para cerrar");
    err.status = 409;
    err.code = "CASH_REGISTER_NOT_OPEN";
    throw err;
  }

  const closedAt = new Date();
  const report = await buildClosingReport(cash, { cutoff: closedAt });
  const difference = round2(amount - report.expectedCash);

  const closed = await CashRegister.findOneAndUpdate(
    { _id: cash._id, isOpen: true },
    {
      $set: {
        isOpen: false,
        closedAt,
        closedBy: userId || null,
        closingAmount: round2(amount),
        difference,
        closingNotes: notes || undefined,
        totals: {
          efectivo: report.sales.efectivo,
          tarjeta: report.sales.tarjeta,
          transferencia: report.sales.transferencia,
          fiado: report.creditGiven,
        },
        totalsAtClose: {
          efectivo: round2(report.sales.efectivo + report.creditRecovered.efectivo),
          tarjeta: round2(report.sales.tarjeta + report.creditRecovered.tarjeta),
          transferencia: round2(
            report.sales.transferencia + report.creditRecovered.transferencia
          ),
          fiado: report.creditGiven,
          gastos: report.expenses.total,
        },
        finalBalance: report.finalBalance,
        closingReport: {
          sales: report.sales,
          salesCount: report.salesCount,
          creditGiven: report.creditGiven,
          creditGivenCount: report.creditGivenCount,
          creditRecovered: report.creditRecovered,
          creditRecoveredCount: report.creditRecoveredCount,
          expenses: report.expenses,
          expensesCount: report.expensesCount,
          totalIncome: report.totalIncome,
          expectedCash: report.expectedCash,
          calculatedAt: report.calculatedAt,
        },
      },
    },
    { new: true, runValidators: true }
  );

  if (!closed) {
    const err = new Error("La caja ya fue cerrada por otra operación");
    err.status = 409;
    err.code = "CASH_REGISTER_ALREADY_CLOSED";
    throw err;
  }

  return formatClosingResponse(closed, report, { closed: true });
}