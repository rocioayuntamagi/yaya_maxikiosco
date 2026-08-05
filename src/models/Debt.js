import mongoose from "mongoose";

const debtSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",  
    required: true,
  },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: Number,
      price: Number,
    },
  ],
  total: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  paid: { type: Boolean, default: false },
});

export default mongoose.model("Debt", debtSchema);

