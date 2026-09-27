// models/Expense.js
import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: [0.01, "El monto debe ser mayor a cero"],
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    paymentMethod: {
      type: String,
      enum: ["efectivo", "debito", "credito", "transferencia", "mercadopago"],
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    // Turno al que pertenece el gasto
    cashRegister: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CashRegister",
      default: null,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Borrado lógico: nunca borrar físico para no romper cierres históricos
    cancelled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

expenseSchema.index({ cashRegister: 1, cancelled: 1 });

export const Expense = mongoose.model("Expense", expenseSchema);