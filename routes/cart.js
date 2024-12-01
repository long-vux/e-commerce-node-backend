const express = require('express');
const router = express.Router();
const CartController = require('../controllers/CartController');
const authOptional = require('../middleware/authMiddleware');

router.get('/get-cart', authOptional, CartController.getCart);
router.post('/add-to-cart', authOptional, CartController.addToCart);
router.delete('/remove-item', authOptional, CartController.removeItem);
router.delete('/clear-cart', authOptional, CartController.clearCart);

module.exports = router;
