import { Sale } from "../models/Sale.js";
import { Customer } from "../models/Customer.js";
import { CashRegister } from "../models/CashRegister.js";

const VALID_PAYMENT_METHODS = ["efectivo", "debito", "credito", "transferencia"];

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
    const { paymentMethod } = req.body;

    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ message: "Método de pago inválido." });
    }

    const openRegister = await CashRegister.findOne({ isOpen: true });
    if (!openRegister) {
      return res.status(400).json({
        message: "No hay una caja abierta. Abrí la caja antes de registrar pagos."
      });
    }

    const sale = await Sale.findById(saleId);
    if (!sale) return res.status(404).json({ message: "Venta no encontrada" });

    const customer = await Customer.findById(sale.customer);
    if (!customer) return res.status(404).json({ message: "Cliente no encontrado" });

    customer.balance += sale.total;
    await customer.save();

    openRegister.totals[paymentMethod] += sale.total;
    await openRegister.save();

    // Registrar en caja del día
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
    const { amount, paymentMethod } = req.body;

    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ message: "Método de pago inválido." });
    }

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: "Monto de pago inválido." });
    }

    const openRegister = await CashRegister.findOne({ isOpen: true });
    if (!openRegister) {
      return res.status(400).json({
        message: "No hay una caja abierta. Abrí la caja antes de registrar pagos."
      });
    }

    const customer = await Customer.findById(id);
    if (!customer) return res.status(404).json({ message: "Cliente no encontrado" });

    customer.balance += numericAmount;
    await customer.save();

    openRegister.totals[paymentMethod] += numericAmount;
    await openRegister.save();

    res.json({ message: "Pago parcial registrado" });
  } catch (error) {
    res.status(500).json({ message: "Error en pago parcial", error });
  }
};