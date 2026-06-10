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

    // ⭐ Código de barras (nuevo)
    barcode: {
  type: String,
  unique: true,
  sparse: true,
  default: null,
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

    // ⭐ Campos opcionales
    brand: {
      type: String,
      default: "",
    },

    weight: {
      type: String, // "500g", "1kg", etc.
      default: "",
    },

    dimensions: {
      type: String, // "20x10x5 cm"
      default: "",
    },

    // ⭐ Para ordenar por productos más vendidos
    salesCount: {
      type: Number,
      default: 0,
    }
  },
  {
    timestamps: true,
  }
);

export const Product = mongoose.model("Product", productSchema);
