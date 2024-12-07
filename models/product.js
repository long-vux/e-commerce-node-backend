const mongoose = require("mongoose");

const variantSchema = mongoose.Schema({
  name: String,
  stock: Number,
});

const productSchema = mongoose.Schema({ 
  name: String,
  price: Number,
  image: String,
  description: String,
  tags: [String],
  category: String,
  variants: [variantSchema],
  totalSold: { type: Number, default: 0 },
});

productSchema.index({ name: 'text', price: 1 });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;

