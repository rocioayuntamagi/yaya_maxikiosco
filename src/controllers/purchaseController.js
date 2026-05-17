import { Purchase } from "../models/Purchase.js";
import { Product } from "../models/Product.js";

// Registrar compra
export const createPurchase = async (req, res) => {
  try {
    const { provider, product, quantity, costPrice, salePrice, billingType } = req.body;

    // Crear compra
    const purchase = await Purchase.create({
      provider,
      product,
      quantity,
      costPrice,
      salePrice,
      billingType
    });

    // Actualizar stock del producto
    const prod = await Product.findById(product);
    prod.stock += quantity;

    // Si viene precio de venta sugerido, lo actualizamos
    if (salePrice) {
      prod.price = salePrice;
    }

    await prod.save();

    res.status(201).json({
      message: "Compra registrada y stock actualizado",
      purchase
    });

  } catch (error) {
    res.status(500).json({ message: "Error al registrar compra", error });
  }
};

// Obtener todas las compras
export const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate("provider")
      .populate("product");

    res.json(purchases);

  } catch (error) {
    res.status(500).json({ message: "Error al obtener compras", error });
  }
};
