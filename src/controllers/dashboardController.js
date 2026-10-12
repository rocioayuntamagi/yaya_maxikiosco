import { Sale } from "../models/Sale.js";
import { Payment } from "../models/Payment.js";
import { Expense } from "../models/Expense.js";
import { METHOD_MAP } from "../models/CashRegister.js";

const round2 = (amount) => Math.round(amount * 100) / 100;

export const getDailySummary = async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const notCancelled = { cancelled: { $ne: true } };
    const [sales, payments, expenses] = await Promise.all([
      Sale.aggregate([
        { $match: { createdAt: { $gte: start, $lt: end }, ...notCancelled } },
        { $group: { _id: "$paymentMethod", total: { $sum: "$total" } } },
      ]),
      Payment.aggregate([
        { $match: { date: { $gte: start, $lt: end }, ...notCancelled } },
        { $group: { _id: "$paymentMethod", total: { $sum: "$amount" } } },
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: start, $lt: end }, ...notCancelled } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const totalesPorMetodo = { efectivo: 0, tarjeta: 0, transferencia: 0 };
    let totalVentas = 0;
    let fiadoGenerado = 0;
    let fiadoRecuperado = 0;

    for (const row of sales) {
      totalVentas = round2(totalVentas + row.total);
      const method = METHOD_MAP[row._id] || "efectivo";
      if (method === "fiado") fiadoGenerado = round2(fiadoGenerado + row.total);
      else totalesPorMetodo[method] = round2(totalesPorMetodo[method] + row.total);
    }

    for (const row of payments) {
      fiadoRecuperado = round2(fiadoRecuperado + row.total);
      const method = METHOD_MAP[row._id] || "efectivo";
      if (method !== "fiado") {
        totalesPorMetodo[method] = round2(totalesPorMetodo[method] + row.total);
      }
    }

    const gastos = round2(expenses[0]?.total || 0);
    const balanceDia = round2(
      totalesPorMetodo.efectivo + totalesPorMetodo.tarjeta + totalesPorMetodo.transferencia - gastos
    );
    return res.json({ totalVentas, totalesPorMetodo, fiadoGenerado, fiadoRecuperado, gastos, balanceDia });
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener resumen diario" });
  }
};
