import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
      }
    ],

    total: { type: Number, required: true },

    paymentMethod: {
      type: String,
      enum: ["efectivo", "debito", "credito", "transferencia", "mercadopago", "fiado"],
      required: true
    },

    // EFECTIVO
    receivedAmount: { type: Number },
    change: { type: Number },

    // TARJETAS
    cardBrand: { type: String },
    cardLast4: { type: String },
    authCode: { type: String },
    operationNumber: { type: String },
    installments: { type: Number },
    interest: { type: Number },

    // TRANSFERENCIA
    transferOperationId: { type: String },

    // MERCADO PAGO
    mpPaymentId: { type: String },
    mpStatus: { type: String },

    // FIADO
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },

    // AUDITORÍA
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  },
  { timestamps: true }
);

export const Sale = mongoose.model("Sale", saleSchema);
