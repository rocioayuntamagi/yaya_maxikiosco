import { Sale } from "../models/Sale.js";
import { Product } from "../models/Product.js";

// Registrar venta
export const createSale = async (req, res) => {
  try {
    const { products, paymentMethod } = req.body;

    let total = 0;

    // Descontar stock y calcular total
    for (const item of products) {
      const prod = await Product.findById(item.product);

      if (!prod) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }

      // Verificar stock
      if (prod.stock < item.quantity) {
        return res.status(400).json({
          message: `Stock insuficiente para ${prod.name}`
        });

        if (paymentMethod === "fiado") {
  const customer = await Customer.findById(req.body.customer);

  if (!customer) {
    return res.status(404).json({ message: "Cliente no encontrado" });
  }

  customer.balance += total;
  await customer.save();
}

      }

      // Descontar stock
      prod.stock -= item.quantity;
      await prod.save();

      // Calcular subtotal
      total += item.quantity * item.price;
    }

    // Crear venta
    const sale = await Sale.create({
      products,
      total,
      paymentMethod,
      customer: paymentMethod === "fiado" ? req.body.customer : null
    });

    res.status(201).json({
      message: "Venta registrada",
      sale
    });

  } catch (error) {
    res.status(500).json({ message: "Error al registrar venta", error });
  }
};

// Obtener todas las ventas
export const getSales = async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate("products.product");

    res.json(sales);

  } catch (error) {
    res.status(500).json({ message: "Error al obtener ventas", error });
  }
};

// Obtener ventas del día
export const getSalesToday = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const sales = await Sale.find({
      createdAt: { $gte: start, $lte: end }
    }).populate("products.product");

    res.json(sales);
  } catch (error) {
    console.error("Error al obtener ventas del día:", error);
    res.status(500).json({ message: "Error al obtener ventas del día" });
  }
};
