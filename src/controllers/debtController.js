import Debt from "../models/Debt.js";
import { Customer } from "../models/Customer.js";

export const addDebt = async (req, res) => {
  try {
    const { clientId, items, total } = req.body;

    if (!clientId) {
      return res.status(400).json({ message: "Debe seleccionar un cliente." });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "La deuda debe tener productos." });
    }

    // Crear deuda
    const debt = await Debt.create({
      customer: clientId,   // ⭐ CAMBIADO
      items,
      total,
    });

    // Actualizar balance del cliente
    await Customer.findByIdAndUpdate(clientId, {
      $inc: { balance: total },
    });

    res.json({
      message: "Deuda registrada correctamente",
      debt,
    });

  } catch (error) {
    console.error("Error al registrar deuda:", error);
    res.status(500).json({ message: "Error al registrar deuda" });
  }
};
