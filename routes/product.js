const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');

// **Define specific routes before parameterized routes**
// Route to get best-selling products
router.get('/best-selling-products', ProductController.getBestSellingProducts);

// Route to get all categories
router.get('/get-categories', ProductController.getCategories);

// Route to get products by category
router.get('/category/:category', ProductController.getProductsByCategory);

// Route to search products
router.get('/search', ProductController.searchProducts);

// Route to sort products by price
router.get('/sort-by-price', ProductController.sortByPrice);

// Route to get a product by ID
router.get('/:id', ProductController.getProductById);

// Route to get all products
router.get('/', ProductController.getAllProducts);

module.exports = router;