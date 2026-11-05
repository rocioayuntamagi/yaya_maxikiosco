import { Sale } from "../models/Sale.js";
import { Payment } from "../models/Payment.js";
import { Expense } from "../models/Expense.js";
import { METHOD_MAP } from "../models/CashRegister.js";

const round2 = (amount) => Math.round(amount * 100) / 100;
const dayKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

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

export const getWeeklySummary = async (req, res) => {
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const days = Array.from({ length: 7 }, (_, index) =>
      dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - index))
    );
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const dayOf = (field) => ({
      $dateToString: { format: "%Y-%m-%d", date: `$${field}`, timezone },
    });
    const notCancelled = { cancelled: { $ne: true } };
    const [sales, payments, expenses] = await Promise.all([
      Sale.aggregate([
        { $match: { createdAt: { $gte: firstDay, $lt: end }, ...notCancelled } },
        { $group: { _id: { day: dayOf("createdAt"), method: "$paymentMethod" }, total: { $sum: "$total" } } },
      ]),
      Payment.aggregate([
        { $match: { date: { $gte: firstDay, $lt: end }, ...notCancelled } },
        { $group: { _id: { day: dayOf("date"), method: "$paymentMethod" }, total: { $sum: "$amount" } } },
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: firstDay, $lt: end }, ...notCancelled } },
        { $group: { _id: { day: dayOf("date") }, total: { $sum: "$amount" } } },
      ]),
    ]);

    const perDay = new Map(days.map((fecha) => [fecha, {
      fecha, totalVentas: 0, fiadoGenerado: 0, fiadoRecuperado: 0, gastos: 0, ingresos: 0,
    }]));

    for (const row of sales) {
      const day = perDay.get(row._id.day);
      if (!day) continue;
      day.totalVentas = round2(day.totalVentas + row.total);
      if (METHOD_MAP[row._id.method] === "fiado") day.fiadoGenerado = round2(day.fiadoGenerado + row.total);
      else day.ingresos = round2(day.ingresos + row.total);
    }

    for (const row of payments) {
      const day = perDay.get(row._id.day);
      if (!day) continue;
      day.fiadoRecuperado = round2(day.fiadoRecuperado + row.total);
      if (METHOD_MAP[row._id.method] !== "fiado") day.ingresos = round2(day.ingresos + row.total);
    }

    for (const row of expenses) {
      const day = perDay.get(row._id.day);
      if (day) day.gastos = round2(day.gastos + row.total);
    }

    return res.json(days.map((fecha) => {
      const { ingresos, ...day } = perDay.get(fecha);
      return { ...day, balanceDia: round2(ingresos - day.gastos) };
    }));
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener resumen semanal" });
  }
};
