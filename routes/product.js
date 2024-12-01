const express = require("express");
const router = express.Router();
const ProductController = require("../controllers/ProductController");
const { auth } = require("../middleware/authMiddleware");

// GET /api/product/search
router.get("/search", ProductController.searchProducts);

// sort by price
router.get("/sort-by-price", ProductController.sortByPrice);

// GET /api/product
router.get("/", ProductController.getAllProducts);

// POST /api/add-product
router.post("/add-product", auth, ProductController.addProduct);

// GET /api/product/:id
router.get("/:id", ProductController.getProductById);

// PUT /api/product/:id
router.put("/:id", auth, ProductController.updateProduct);

// DELETE /api/product/:id
router.delete("/:id", auth, ProductController.deleteProduct);


module.exports = router;
