import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    stock: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    images: {
      type: [String],
      default: [],
    },

    // 🔽 Campos opcionales
    brand: {
      type: String,
      default: "",
    },
    weight: {
      type: String, // lo dejamos string para permitir "500g", "1kg", etc.
      default: "",
    },
    dimensions: {
      type: String, // ej: "20x10x5 cm"
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const Product = mongoose.model("Product", productSchema);
