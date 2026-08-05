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
    const customers = await Customer.find().sort({ name: 1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener clientes", error });
  }
};

// Obtener cliente por ID
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener cliente", error });
  }
};

// Actualizar cliente
export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar cliente", error });
  }
};

// Eliminar cliente
export const deleteCustomer = async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: "Cliente eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar cliente", error });
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
