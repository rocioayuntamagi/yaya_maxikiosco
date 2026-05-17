import { Customer } from "../models/Customer.js";
import { Sale } from "../models/Sale.js";
import { Payment } from "../models/Payment.js";

// Crear cliente
export const createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: "Error al crear cliente", error });
  }
};

// Obtener todos los clientes
export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener clientes", error });
  }
};

// Estado de cuenta
export const customerAccount = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    const sales = await Sale.find({
      customer: id,
      paymentMethod: "fiado"
    });

    const payments = await Payment.find({ customer: id });

    res.json({
      customer,
      sales,
      payments,
      balance: customer.balance
    });

  } catch (error) {
    res.status(500).json({ message: "Error al obtener estado de cuenta", error });
  }
};
