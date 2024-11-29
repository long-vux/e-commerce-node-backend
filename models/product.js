const mongoose = require("mongoose");

const variantSchema = mongoose.Schema({
  color: String,    
  size: String,
  stock: Number,
});

const productSchema = mongoose.Schema({
  name: String,
  price: Number,
  image: String,
  description: String,
  tags: [String],
  categories: [String],
  variants: [variantSchema],
});

productSchema.index({ name: 'text', price: 1 });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;

