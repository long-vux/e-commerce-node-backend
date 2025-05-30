const express = require('express');
const router = express.Router();
const CartController = require('../controllers/CartController');
const { authOptional } = require('../middleware/authMiddleware');

router.post('/add-to-cart', authOptional, CartController.addToCart);
router.get('/get-cart', authOptional, CartController.getCart);
router.get('/get-minicart', authOptional, CartController.getMiniCart);
router.delete('/clear-cart', authOptional, CartController.clearCart);
router.delete('/remove-item', authOptional, CartController.removeItem);
router.post('/apply-coupon', authOptional, CartController.applyCoupon);
router.delete('/remove-coupon/:couponId', authOptional, CartController.removeCoupon);
router.post('/checkout', authOptional, CartController.checkout);
router.put('/update-item', authOptional, CartController.updateItem);
router.put('/update-selected-item', authOptional, CartController.updateSelectedItem);
router.get('/get-selected-items', authOptional, CartController.getSelectedItems);
module.exports = router;