const mongoose = require("mongoose");

const variantSchema = mongoose.Schema({
  name: String,
  stock: Number,
});

const productSchema = mongoose.Schema({ 
  name: String,
  description: String,
  price: Number,
  category: String,
  tags: [String],
  variants: [variantSchema],
  images: [String],
  totalSold: { type: Number, default: 0 },
  weight: { type: Number, default: 500 }, // in grams
});

productSchema.index({ name: 'text', price: 1 });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;

