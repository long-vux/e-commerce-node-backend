const Cart = require('../models/Cart');
const mongoose = require('mongoose');

/**
 * Adds an item to the cart.
 * Supports both anonymous and authenticated users.
 */
exports.addToCart = async (req, res) => {
  const { productId, quantity, price } = req.body;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }
  console.log('user', req.user)

  try {
    if (req.user) {
      console.log('req.user._id', req.user._id)
      let cart = await Cart.findOne({ user: req.user._id });
      if (!cart) {
        cart = new Cart({ user: req.user._id, items: [] });
      }

      const existingItem = cart.items.find(item => item.product.toString() === productId);
      if (existingItem) {
        existingItem.quantity = parseInt(existingItem.quantity) + parseInt(quantity);
        existingItem.price = parseInt(existingItem.price) + parseInt(price)
      } else {
        cart.items.push({ product: productId, quantity, price });
      }

      await cart.save();
      res.status(200).json({ message: 'Item added to cart', cart });
    } else {
      console.log('req.session', req.session)
      if (!req.session.cart) {
        req.session.cart = [];
      }

      const existingItem = req.session.cart.find(item => item.product.toString() === productId);
      if (existingItem) {
        existingItem.quantity = parseInt(existingItem.quantity) + parseInt(quantity);
        existingItem.price = parseInt(existingItem.price) + parseInt(price)
      } else {
        req.session.cart.push({ product: productId, quantity, price });
      }

      res.status(200).json({ message: 'Item added to cart', cart: req.session.cart });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error adding item to cart', error: error.message });
  }
}

/**
 * Retrieves the cart items.
 * Supports both anonymous and authenticated users.
 */
exports.getCart = async (req, res) => {
  try {
    if (req.user) {
      // Authenticated User: Retrieve cart from the database
      const cart = await Cart.findOne({ user: req.user._id });
      res.status(200).json({ cart });
    } else {
      // Anonymous User: Retrieve cart from the session
      res.status(200).json({ cart: req.session.cart });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error getting cart', error: error.message });
  }
}

/**
 * Clears the cart.
 * Supports both anonymous and authenticated users.
 */
exports.clearCart = async (req, res) => {
  try {
    if (req.user) {
      // Authenticated User: Delete cart from the database
      await Cart.findOneAndDelete({ user: req.user._id });
      res.status(200).json({ message: 'Cart cleared' });
    } else {
      // Anonymous User: Clear cart from the session
      req.session.cart = [];
      res.status(200).json({ message: 'Cart cleared' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error clearing cart', error: error.message });
  }
}

/**
 * Removes an item from the cart.
 * Supports both anonymous and authenticated users.
 */
exports.removeItem = async (req, res) => {
  const { productId } = req.body;

  try {
    if (req.user) {
      const cart = await Cart.findOne({ user: req.user._id });
      cart.items = cart.items.filter(
        (item) => item.product.toString() !== productId
      );

      await cart.save();
      res.status(200).json({ message: 'Item removed from cart', cart });
    } else {
      req.session.cart = req.session.cart.filter(item => item.product.toString() !== productId);
      res.status(200).json({ message: 'Item removed from cart', cart: req.session.cart });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error removing item from cart', error });
  }
}