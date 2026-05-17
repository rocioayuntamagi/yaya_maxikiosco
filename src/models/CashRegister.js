import mongoose from "mongoose";

const cashRegisterSchema = new mongoose.Schema(
  {
    openingAmount: {
      type: Number,
      required: true,
    },
    closingAmount: {
      type: Number,
      default: null,
    },
    difference: {
      type: Number,
      default: null,
    },
    totals: {
      efectivo: { type: Number, default: 0 },
      debito: { type: Number, default: 0 },
      credito: { type: Number, default: 0 },
      transferencia: { type: Number, default: 0 },
      fiado: { type: Number, default: 0 }
    },
    openedAt: {
      type: Date,
      default: Date.now,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    openedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isOpen: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true,
  }
);

export const CashRegister = mongoose.model("CashRegister", cashRegisterSchema);
