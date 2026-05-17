import { Provider } from "../models/Provider.js";

// Crear proveedor
export const createProvider = async (req, res) => {
  try {
    const provider = await Provider.create(req.body);
    res.status(201).json(provider);
  } catch (error) {
    res.status(500).json({ message: "Error al crear proveedor", error });
  }
};

// Obtener todos los proveedores
export const getProviders = async (req, res) => {
  try {
    const providers = await Provider.find();
    res.json(providers);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener proveedores", error });
  }
};

// Obtener proveedor por ID
export const getProviderById = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);

    if (!provider) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }

    res.json(provider);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener proveedor", error });
  }
};

// Actualizar proveedor
export const updateProvider = async (req, res) => {
  try {
    const provider = await Provider.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!provider) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }

    res.json(provider);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar proveedor", error });
  }
};

// Eliminar proveedor
export const deleteProvider = async (req, res) => {
  try {
    const provider = await Provider.findByIdAndDelete(req.params.id);

    if (!provider) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }

    res.json({ message: "Proveedor eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar proveedor", error });
  }
};
