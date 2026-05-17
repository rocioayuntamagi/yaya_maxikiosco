import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    creditLimit: {
      type: Number,
      default: 0, // 0 = sin límite
    },
    balance: {
      type: Number,
      default: 0, // saldo actual del fiado
    }
  },
  {
    timestamps: true,
  }
);

export const Customer = mongoose.model("Customer", customerSchema);
