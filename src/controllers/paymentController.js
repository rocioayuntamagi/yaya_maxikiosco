import { Payment } from "../models/Payment.js";
import { Customer } from "../models/Customer.js";

export const registerPayment = async (req, res) => {
  try {
    const { customer, amount } = req.body;

    const cust = await Customer.findById(customer);
    if (!cust) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    // Registrar pago
    const payment = await Payment.create({ customer, amount });

    // Actualizar saldo
    cust.balance -= amount;
    await cust.save();

    res.status(201).json({
      message: "Pago registrado",
      payment,
      newBalance: cust.balance
    });

  } catch (error) {
    res.status(500).json({ message: "Error al registrar pago", error });
  }
};
