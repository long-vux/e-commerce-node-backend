const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const mongoose = require('mongoose');
const User = require('../models/User');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const VerifyToken = require('../models/VerifyToken');
const sendEmail = require('../utils/sendEmail');
const Order = require('../models/Order');

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

exports.applyCoupon = async (req, res) => {
  const { couponId } = req.body;
  try {
    // find cart
    let cart
    if (req.user)
      cart = await Cart.findOne({ user: req.user._id });
    else
      cart = req.session.cart

    if (!cart)
      return res.status(400).json({ message: 'Cart not found', error: error.message });

    // find coupon
    const coupon = await Coupon.findOne({ _id: couponId, isActive: true });
    if (!coupon)
      return res.status(400).json({ message: 'Coupon not found', error: error.message });

    // apply coupon
    cart.coupons.push(couponId);
    await cart.save();

    res.status(200).json(coupon);
  } catch (error) {
    res.status(500).json({ message: 'Error applying coupon', error: error.message });
  }
}

exports.removeCoupon = async (req, res) => {
  const { couponId } = req.body;
  try {
    let cart
    if (req.user)
      cart = await Cart.findOne({ user: req.user._id });
    else
      cart = await Cart.findOne({ sessionId: req.session.id });

    if (!cart)
      return res.status(400).json({ message: 'Cart not found' });

    cart.coupons = cart.coupons.filter(id => id.toString() !== couponId);
    await cart.save();
    res.status(200).json({ message: 'Coupon removed from cart' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing coupon from cart', error });
  }
}

// Create a new user when checkout but not login
exports.checkout = async (req, res) => {
  const { lastName, firstName, email, address, selectedItems } = req.body
  try {
    let user = await User.findOne({ email })

    if (!user) {
      const randomPassword = crypto.randomBytes(10).toString('hex').slice(0, 8)
      const hashedPassword = await bcrypt.hash(randomPassword, 10)
      user = await User.create({ lastName, firstName, email, address, password: hashedPassword })

      const token = await VerifyToken.create({
        userId: user._id,
        token: crypto.randomBytes(8).toString('hex')
      })

      //   Send verification email
      const url = `${process.env.FRONTEND_URL}/${user._id}/verify/${token.token}`
      const subject = 'Verify Your Email and Set Your Password'
      const htmlContent = `
      <h1>Welcome to MADNESS!</h1>
      <p>Thank you for browing and making purchases at MADNESS!</p>
      <p>Please click the link below to verify your email and set your password:</p>
      <a href="${url}">Verify Email</a>
      <p>Your temporary password is: <strong>${randomPassword}</strong></p>
      <p>Please change your password after logging in for security reasons.</p>
      <p>Best regards,<br/>MADNESS Team</p>
    `
      await sendEmail(email, subject, htmlContent)
    } else {
      if (!req.user) {
        return res.status(401).json({ message: 'User already exists. Please log in to use your cart' })
      }
    }

    // find cart
    let cart
    if (req.user)
      cart = await Cart.findOne({ user: req.user._id })
    else
      cart = await Cart.findOne({ sessionId: req.session.id })

    if (!cart)
      return res.status(400).json({ message: 'Cart not found' })

    const cartItems = cart.items
    if (cartItems.length === 0)
      return res.status(400).json({ message: 'Your cart is empty' })

    // calculate total
    cart.originalTotal = cartItems.reduce((acc, item) => acc + item.price, 0)

    // apply coupon
    const coupons = cart.coupons
    let discount = 0
    if (coupons.length > 0) {
      discount = coupons.reduce((acc, coupon) => acc + coupon.discountPercentage, 0)
      cart.total = cart.originalTotal - (cart.originalTotal * discount / 100)
    }

    // create order
    const order = await Order.create({
      user: user._id,
      items: cartItems.map(item => ({
        product: item.productId,
        quantity: item.quantity,
        price: item.price
      })),
      discount: discount, // percentage
      total: cart.total,
      shippingAddress: address,
      status: 'pending'
    })

    user.orders.push(order._id)
    await user.save()

    if (req.user) {
      cart.items = cart.items.filter(item => !selectedItems.includes(item.product.toString()))
      await cart.save()
    } else {
      req.session.cart = []
    }

    res.status(200).json({ message: 'Order placed successfully, Please check your email to verify your account and complete the purchase.', order })
  } catch (error) {
    return res.status(500).json({ message: 'Error processing checkout', error: error.message })
  }
}