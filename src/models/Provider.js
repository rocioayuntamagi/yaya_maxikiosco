import mongoose from "mongoose";

const providerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    cuit: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    category: {
      type: String, // bebidas, almacén, limpieza, etc.
      default: "",
    },
    billingType: {
      type: String,
      enum: ["blanco", "negro"],
      default: "negro",
    }
  },
  {
    timestamps: true,
  }
);

export const Provider = mongoose.model("Provider", providerSchema);
