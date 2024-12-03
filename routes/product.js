const express = require("express");
const router = express.Router();
const ProductController = require("../controllers/ProductController");

// GET /api/product/search
router.get("/search", ProductController.searchProducts);

// sort by price
router.get("/sort-by-price", ProductController.sortByPrice);

// GET /api/product
router.get("/", ProductController.getAllProducts);

// GET /api/product/:id
router.get("/:id", ProductController.getProductById);

// GET /api/product/category/:categoryId
router.get("/category/:categoryId", ProductController.getProductsByCategory);

module.exports = router;
