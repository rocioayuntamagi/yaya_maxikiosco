import { Sale } from "../models/Sale.js";
import { Customer } from "../models/Customer.js";
import { CashRegister } from "../models/CashRegister.js";

// ⭐ Obtener todas las ventas fiadas de un cliente
export const getDebtByCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const sales = await Sale.find({
      customer: id,
      paymentMethod: "fiado"
    }).populate("products.product");

    const items = sales.map((s) => ({
      saleId: s._id,
      date: s.createdAt,
      products: s.products.map((p) => ({
        name: p.product.name,
        quantity: p.quantity,
        price: p.price,
        subtotal: p.price * p.quantity
      })),
      total: s.total
    }));

    const total = items.reduce((acc, i) => acc + i.total, 0);

    res.json({ items, total });
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo deudas", error });
  }
};

// ⭐ Marcar una venta fiada como pagada
export const markSaleAsPaid = async (req, res) => {
  try {
    const { saleId } = req.params;

    const sale = await Sale.findById(saleId);
    if (!sale) return res.status(404).json({ message: "Venta no encontrada" });

    const customer = await Customer.findById(sale.customer);
    customer.balance += sale.total;
    await customer.save();

    // Registrar en caja del día
    await CashRegister.create({
      type: "pago-deuda",
      amount: sale.total,
      customer: sale.customer
    });

    // Eliminar la venta fiada
    await Sale.findByIdAndDelete(saleId);

    res.json({ message: "Venta fiada pagada" });
  } catch (error) {
    res.status(500).json({ message: "Error al pagar deuda", error });
  }
};

// ⭐ Pago parcial
export const partialPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const customer = await Customer.findById(id);
    customer.balance += amount;
    await customer.save();

    await CashRegister.create({
      type: "pago-parcial-deuda",
      amount,
      customer: id
    });

    res.json({ message: "Pago parcial registrado" });
  } catch (error) {
    res.status(500).json({ message: "Error en pago parcial", error });
  }
};
