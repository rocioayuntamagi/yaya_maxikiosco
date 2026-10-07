import mongoose from "mongoose";
import { Expense } from "../models/Expense.js";
import { CashRegister } from "../models/CashRegister.js";
import { requireOpenCashRegister, getUserId } from "../utils/cashRegisterContext.js";

const handleError = (res, error) => {
  const status = error.status || (error.name === "ValidationError" || error.name === "CastError" ? 400 : 500);
  return res.status(status).json({ message: status === 500 ? "Error al procesar gasto" : error.message });
};

export const createExpense = async (req, res) => {
  try {
    const cash = await requireOpenCashRegister();
    if (req.body.cashRegister != null && String(req.body.cashRegister) !== String(cash._id)) {
      return res.status(400).json({ message: "El gasto debe pertenecer a la caja abierta" });
    }

    const { amount, category, paymentMethod, date, description } = req.body;
    const expense = await Expense.create({
      amount,
      category,
      paymentMethod,
      date,
      description,
      cashRegister: cash._id,
      user: getUserId(req),
    });
    return res.status(201).json(expense);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ cancelled: { $ne: true } }).sort({ date: -1 });
    return res.json(expenses);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getExpensesByCashRegister = async (req, res) => {
  try {
    const { cashRegisterId } = req.params;
    if (!mongoose.isValidObjectId(cashRegisterId)) {
      return res.status(400).json({ message: "ID de caja inválido" });
    }
    const expenses = await Expense.find({ cashRegister: cashRegisterId, cancelled: { $ne: true } }).sort({ date: -1 });
    return res.json(expenses);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateExpense = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "ID de gasto inválido" });
    }
    const expense = await Expense.findOne({ _id: req.params.id, cancelled: { $ne: true } });
    if (!expense) return res.status(404).json({ message: "Gasto no encontrado" });

    const cash = await CashRegister.findOne({ _id: expense.cashRegister, isOpen: true });
    if (!cash) return res.status(409).json({ message: "No se puede modificar un gasto de una caja cerrada" });
    if (req.body.cashRegister != null && String(req.body.cashRegister) !== String(expense.cashRegister)) {
      return res.status(400).json({ message: "No se puede cambiar la caja de un gasto" });
    }

    for (const field of ["amount", "category", "paymentMethod", "date", "description"]) {
      if (Object.hasOwn(req.body, field)) expense[field] = req.body[field];
    }
    await expense.save();
    return res.json(expense);
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteExpense = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "ID de gasto inválido" });
    }
    const expense = await Expense.findOne({ _id: req.params.id, cancelled: { $ne: true } });
    if (!expense) return res.status(404).json({ message: "Gasto no encontrado" });

    const cash = await CashRegister.findOne({ _id: expense.cashRegister, isOpen: true });
    if (!cash) return res.status(409).json({ message: "No se puede eliminar un gasto de una caja cerrada" });

    expense.cancelled = true;
    await expense.save();
    return res.json({ message: "Gasto eliminado" });
  } catch (error) {
    return handleError(res, error);
  }
};
