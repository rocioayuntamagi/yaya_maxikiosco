
import mongoose from "mongoose";

// Medios de pago normalizados para reportes:
// debito, credito y mercadopago se unifican en "tarjeta".
const METHOD_MAP = {
  efectivo: "efectivo",
  debito: "tarjeta",
  credito: "tarjeta",
  mercadopago: "tarjeta",
  tarjeta: "tarjeta",
  transferencia: "transferencia",
  fiado: "fiado",
};

const breakdownSchema = new mongoose.Schema(
  {
    efectivo: { type: Number, default: 0 },
    tarjeta: { type: Number, default: 0 },
    transferencia: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

// Snapshot inmutable del reporte de cierre
const closingReportSchema = new mongoose.Schema(
  {
    sales: { type: breakdownSchema, default: () => ({}) },
    salesCount: { type: Number, default: 0 },

    creditGiven: { type: Number, default: 0 },      // fiado generado
    creditGivenCount: { type: Number, default: 0 },
    creditRecovered: { type: breakdownSchema, default: () => ({}) }, // fiado cobrado
    creditRecoveredCount: { type: Number, default: 0 },

    expenses: { type: breakdownSchema, default: () => ({}) },
    expensesCount: { type: Number, default: 0 },

    totalIncome: { type: Number, default: 0 },      // ventas contado + cobros
    expectedCash: { type: Number, default: 0 },     // efectivo teórico en cajón
    calculatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const cashRegisterSchema = new mongoose.Schema(
  {
    openingAmount: { type: Number, required: true, min: 0 },
    closingAmount: { type: Number, default: null },
    difference: { type: Number, default: null },

    totals: {
      efectivo: { type: Number, default: 0 },
      tarjeta: { type: Number, default: 0 },
      transferencia: { type: Number, default: 0 },
      fiado: { type: Number, default: 0 },
    },

    // Módulo de cierre de caja
    closedAt: { type: Date, default: null },
    totalsAtClose: {
      efectivo: { type: Number, default: 0 },
      tarjeta: { type: Number, default: 0 },
      transferencia: { type: Number, default: 0 },
      fiado: { type: Number, default: 0 },
      fiadoGenerado: { type: Number, default: 0 },
      fiadoRecuperado: { type: Number, default: 0 },
      gastos: { type: Number, default: 0 },
      balanceFinal: { type: Number, default: null },
    },
    finalBalance: { type: Number, default: null },
    closingReport: { type: closingReportSchema, default: null },
    closingNotes: { type: String, trim: true, maxlength: 500 },

    openedAt: { type: Date, default: Date.now },
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
    isOpen: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Regla: una sola caja abierta a la vez, garantizado en base
cashRegisterSchema.index(
  { isOpen: 1 },
  { unique: true, partialFilterExpression: { isOpen: true } }
);
cashRegisterSchema.index({ openedAt: -1 });

// Regla: el cierre es inmutable
cashRegisterSchema.post("init", function () {
  this.$locals.wasClosed = this.isOpen === false;
});

cashRegisterSchema.pre("save", function () {
  if (!this.isNew && this.$locals.wasClosed) {
    throw new Error("La caja ya está cerrada y no puede modificarse");
  }
});

// Cualquier update directo queda condicionado a que la caja esté abierta
["findOneAndUpdate", "updateOne", "updateMany"].forEach((op) => {
  cashRegisterSchema.pre(op, function () {
    const filter = this.getFilter();
    if (filter.isOpen !== true) this.setQuery({ ...filter, isOpen: true });
  });
});

cashRegisterSchema.statics.METHOD_MAP = METHOD_MAP;

cashRegisterSchema.statics.findOpen = function () {
  return this.findOne({ isOpen: true });
};

export const CashRegister = mongoose.model("CashRegister", cashRegisterSchema);
export { METHOD_MAP };