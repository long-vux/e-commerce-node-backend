const Product = require("../models/Product");
const User = require("../models/User");

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
 
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

exports.getProductsByCategory = async (req, res) => {
  try {
    const category = req.params.category;
    const products = await Product.find({ categories: category });
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// search & filter
exports.searchProducts = async (req, res) => {
  try { 
    const { name, minPrice, maxPrice, tags, categories } = req.query;
    let query = {};

    if (name) query.name = { $regex: name, $options: 'i' };
    if (minPrice || maxPrice) query.price = { $gte: minPrice, $lte: maxPrice };
    if (tags) {
      const tagsArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagsArray };
    }
    if (categories) {
      const categoriesArray = categories.split(',').map(category => category.trim());
      query.categories = { $in: categoriesArray };
    }

    const products = await Product.find(query);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

exports.sortByPrice = async (req, res) => {
  const { sort } = req.query;
  try {
    const products = await Product.find().sort({ price: sort === 'asc' ? 1 : -1 });
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

