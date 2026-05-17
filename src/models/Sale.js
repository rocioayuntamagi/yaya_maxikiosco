import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        }
      }
    ],
    total: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["efectivo", "debito", "credito", "transferencia", "fiado"],
      default: "efectivo",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    customer: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Customer",
  default: null
},

  },
  {
    timestamps: true,
  }
);

export const Sale = mongoose.model("Sale", saleSchema);
