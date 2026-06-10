import { Product } from "../models/Product.js";

// Crear producto
export const createProduct = async (req, res) => {
  console.log("🛠 createProduct llamado");
  console.log("Body recibido:", req.body);
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
  console.error("❌ Error en createProduct:", error);
  res.status(500).json({ message: "Error al crear producto", error });
}

};

// Obtener todos los productos
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener productos", error });
  }
};

// Obtener un producto por ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener producto", error });
  }
};

// Actualizar producto
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar producto", error });
  }
};

// Eliminar producto
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json({ message: "Producto eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar producto", error });
  }
};

export const getProductByBarcode = async (req, res) => {
  try {
    const product = await Product.findOne({ barcode: req.params.code });

    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json(product);

  } catch (error) {
    res.status(500).json({ message: "Error al buscar producto", error });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const q = req.query.q || req.query.query || "";

    if (!q) {
      return res.json([]);
    }

    const products = await Product.find({
      name: { $regex: q, $options: "i" }
    }).limit(20);

    res.json(products);

  } catch (error) {
    res.status(500).json({ message: "Error al buscar productos", error });
  }
};


export const advancedSearchProducts = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.json([]);
    }

    const regex = new RegExp(query, "i");

    const products = await Product.find({
      $or: [
        { name: regex },          // coincidencia por nombre
        { barcode: regex },       // coincidencia por código
        { category: regex },      // coincidencia por categoría
        { providerName: regex }   // coincidencia por proveedor (si lo guardás)
      ]
    })
      .sort({ salesCount: -1 })   // orden por más vendidos (si lo agregamos)
      .limit(20);

    res.json(products);

  } catch (error) {
    res.status(500).json({ message: "Error en búsqueda avanzada", error });
  }
};
