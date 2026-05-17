import { CashRegister } from "../models/CashRegister.js";
import { Sale } from "../models/Sale.js";

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

    // Calcular totales por medio de pago
    const totals = {
      efectivo: 0,
      debito: 0,
      credito: 0,
      transferencia: 0,
      fiado: 0
    };

    let expectedTotal = 0;

    for (const sale of sales) {
      totals[sale.paymentMethod] += sale.total;
      expectedTotal += sale.total;
    }

    const { closingAmount } = req.body;

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
