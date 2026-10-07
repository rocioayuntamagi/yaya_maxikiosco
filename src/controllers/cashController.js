import mongoose from "mongoose";
import { CashRegister } from "../models/CashRegister.js";
import { Sale } from "../models/Sale.js";
import { Payment } from "../models/Payment.js";
import { Expense } from "../models/Expense.js";
import { buildClosingReport } from "../services/cashClosing.service.js";

// ⭐ Nuevo: consultar si hay una caja abierta (lo usa el popup de Caja.tsx)
export const getCashStatus = async (req, res) => {
  try {
    const cash = await CashRegister.findOne({ isOpen: true });
    res.json({ isOpen: !!cash, cash: cash || null });
  } catch (error) {
    res.status(500).json({ message: "Error al consultar estado de caja", error });
  }
};

export const openCashRegister = async (req, res) => {
  try {
    const { openingAmount } = req.body;

    // Verificar si ya hay una caja abierta
    const openCash = await CashRegister.findOne({ isOpen: true });
    if (openCash) {
      return res.status(400).json({ message: "Ya hay una caja abierta" });
    }

    const cash = await CashRegister.create({
      openingAmount,
      openedBy: req.user.id
    });

    res.status(201).json({
      message: "Caja abierta",
      cash
    });

  } catch (error) {
    res.status(500).json({ message: "Error al abrir caja", error });
  }
};

export const closeCashRegister = async (req, res) => {
  try {
    const cash = await CashRegister.findOne({ isOpen: true });

    if (!cash) {
      return res.status(400).json({ message: "No hay caja abierta" });
    }

    // Obtener ventas del día
    const sales = await Sale.find({
      date: { $gte: cash.openedAt }
    });

    // Calcular totales por medio de pago (solo lo que vino de ventas)
    const salesTotals = {
      efectivo: 0,
      debito: 0,
      credito: 0,
      transferencia: 0,
      fiado: 0
    };

    for (const sale of sales) {
      salesTotals[sale.paymentMethod] += sale.total;
    }

    const { closingAmount } = req.body;

    // ⭐ CORREGIDO: sumar a lo que ya había en cash.totals (pagos de deuda
    // registrados durante el turno vía markSaleAsPaid/partialPayment) en
    // vez de sobreescribirlo. Antes "cash.totals = totals" pisaba esos pagos.
    const totals = {
      efectivo: cash.totals.efectivo + salesTotals.efectivo,
      debito: cash.totals.debito + salesTotals.debito,
      credito: cash.totals.credito + salesTotals.credito,
      transferencia: cash.totals.transferencia + salesTotals.transferencia,
      fiado: cash.totals.fiado + salesTotals.fiado
    };

    const difference = closingAmount - (cash.openingAmount + totals.efectivo);

    cash.closingAmount = closingAmount;
    cash.difference = difference;
    cash.totals = totals;
    cash.closedAt = new Date();
    cash.closedBy = req.user.id;
    cash.isOpen = false;

    await cash.save();

    res.json({
      message: "Caja cerrada",
      cash
    });

  } catch (error) {
    res.status(500).json({ message: "Error al cerrar caja", error });
  }
};

export const previewCashRegister = async (req, res) => {
  try {
    const cash = await CashRegister.findOne({ isOpen: true });
    if (!cash) return res.status(409).json({ message: "No hay caja abierta" });

    const filter = { cashRegister: cash._id, cancelled: { $ne: true } };
    const [ventas, pagos, gastos, report] = await Promise.all([
      Sale.find(filter),
      Payment.find(filter),
      Expense.find(filter),
      buildClosingReport(cash, { includeUnlinked: false }),
    ]);
    const round2 = (amount) => Math.round(amount * 100) / 100;

    return res.json({
      cashRegisterId: cash._id,
      totals: {
        efectivo: round2(report.sales.efectivo + report.creditRecovered.efectivo),
        tarjeta: round2(report.sales.tarjeta + report.creditRecovered.tarjeta),
        transferencia: round2(report.sales.transferencia + report.creditRecovered.transferencia),
        fiadoGenerado: report.creditGiven,
        fiadoRecuperado: report.creditRecovered.total,
        gastos: report.expenses.total,
        balanceFinal: report.finalBalance,
      },
      ventas,
      pagos,
      gastos,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error al previsualizar cierre de caja" });
  }
};

export const closeCashRegisterWithTotals = async (req, res) => {
  try {
    const cash = await CashRegister.findOne({ isOpen: true });
    if (!cash) return res.status(409).json({ message: "No hay caja abierta" });

    const report = await buildClosingReport(cash, { includeUnlinked: false });
    const round2 = (amount) => Math.round(amount * 100) / 100;
    const totalsAtClose = {
      efectivo: round2(report.sales.efectivo + report.creditRecovered.efectivo),
      tarjeta: round2(report.sales.tarjeta + report.creditRecovered.tarjeta),
      transferencia: round2(report.sales.transferencia + report.creditRecovered.transferencia),
      fiadoGenerado: report.creditGiven,
      fiadoRecuperado: report.creditRecovered.total,
      gastos: report.expenses.total,
      balanceFinal: report.finalBalance,
    };
    const closedAt = new Date();
    const closed = await CashRegister.findOneAndUpdate(
      { _id: cash._id, isOpen: true },
      {
        $set: {
          isOpen: false,
          closedAt,
          closedBy: req.user.id,
          totalsAtClose: { ...totalsAtClose, fiado: report.creditGiven },
          finalBalance: report.finalBalance,
        },
      },
      { new: true, runValidators: true }
    );
    if (!closed) return res.status(409).json({ message: "La caja ya fue cerrada" });

    return res.json({
      message: "Caja cerrada correctamente",
      cashRegisterId: closed._id,
      totalsAtClose,
      closedAt: closed.closedAt,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error al cerrar caja" });
  }
};

export const getCashHistory = async (req, res) => {
  try {
    const history = await CashRegister.find({ isOpen: false })
      .select("_id openedAt closedAt totalsAtClose finalBalance")
      .sort({ closedAt: -1 });
    return res.json(history);
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener historial de cajas" });
  }
};

export const getCashHistoryById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "ID de caja inválido" });
    }
    const cash = await CashRegister.findOne({ _id: req.params.id, isOpen: false });
    if (!cash) return res.status(404).json({ message: "Cierre de caja no encontrado" });

    const filter = { cashRegister: cash._id, cancelled: { $ne: true } };
    const [ventas, pagos, gastos] = await Promise.all([
      Sale.find(filter),
      Payment.find(filter),
      Expense.find(filter),
    ]);
    return res.json({
      cashRegister: cash,
      ventas,
      pagos,
      gastos,
      totalsAtClose: cash.totalsAtClose,
      finalBalance: cash.finalBalance,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener detalle de caja" });
  }
};