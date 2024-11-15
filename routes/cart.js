const express = require('express');
const router = express.Router();
const CartController = require('../controllers/CartController');

router.post('/cart/add', CartController.addToCart);
router.post('/cart/remove', CartController.removeFromCart);

module.exports = router;
