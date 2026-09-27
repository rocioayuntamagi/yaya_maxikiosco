import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, "El monto debe ser mayor a cero"],
    },
    paymentMethod: {
      type: String,
      enum: ["efectivo", "debito", "credito", "transferencia", "mercadopago"],
      default: "efectivo",
    },
    // Venta fiada que este pago cancela (null si es pago parcial a cuenta)
    sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sale",
      default: null,
    },
    // Turno en el que se cobró
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
    cancelled: { type: Boolean, default: false },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

paymentSchema.index({ cashRegister: 1, cancelled: 1 });

export const Payment = mongoose.model("Payment", paymentSchema);