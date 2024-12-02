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
  try {
    if (req.user) {
      // authenticated user
      let cart = await Cart.findOne({ user: req.user.id });
      if (!cart) {
        cart = await Cart.create({ user: req.user.id, items: [] });
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
      console.log('req.session.cart', req.session.cart)
      if (!req.session.cart) {
        req.session.cart = { items: [], coupons: [] };
      }

      const existingItem = req.session.cart.items.find(item => item.product.toString() === productId);
      if (existingItem) {
        existingItem.quantity = parseInt(existingItem.quantity) + parseInt(quantity);
        existingItem.price = parseInt(existingItem.price) + parseInt(price)
      } else {
        req.session.cart.items.push({ product: productId, quantity, price });
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
      const cart = await Cart.findOne({ user: req.user.id });
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
      await Cart.findOneAndDelete({ user: req.user.id });
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
  const { productId } = req.params;

  try {
    const existingItem = await Cart.findOne({ user: req.user.id, items: { $elemMatch: { product: productId } } })
    if (!existingItem) {
      return res.status(400).json({ message: 'Product not found' });
    }

    if (req.user) {
      const cart = await Cart.findOne({ user: req.user.id });
      cart.items = cart.items.filter(
        (item) => item.product.toString() !== productId
      );
      await cart.save();
      res.status(200).json({ message: 'Item removed from cart', cart });
    } else {
      let cart = req.session.cart
      cart.items = cart.items.filter(item => item.product.toString() !== productId);

      // if cart is empty, set it to empty object (have items and coupons to avoid undefined)
      if (cart.items.length === 0) {
        req.session.cart = { items: [], coupons: [] };
      }

      res.status(200).json({ message: 'Item removed from cart', cart });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error removing item from cart', error: error.message });
  }
}

exports.applyCoupon = async (req, res) => {
  const { couponId } = req.body;
  try {
    // find cart
    let cart
    if (req.user) {
      cart = await Cart.findOne({ user: req.user.id });
    } else {
      // Initialize cart structure if not present
      if (!req.session.cart) {
        req.session.cart = { items: [], coupons: [] };
      }
      cart = req.session.cart;
    }
    if (!cart)
      return res.status(400).json({ message: 'Cart not found', error: error.message });
    // find coupon
    const coupon = await Coupon.findOne({ _id: couponId, isActive: true });
    if (!coupon) {
      return res.status(400).json({ message: 'Coupon not found' });
    }

    if (req.user) {
      // Apply coupon for authenticated user
      if (!cart.coupons) {
        cart.coupons = [];
      }
      if (cart.coupons.includes(couponId)) {
        return res.status(400).json({ message: 'Coupon already applied', cart });
      }
      cart.coupons.push(couponId);
      await cart.save();
    } else {
      // Apply coupon for anonymous user
      if (!cart.coupons) {
        cart.coupons = [];
      }
      if (cart.coupons.includes(couponId)) {
        return res.status(400).json({ message: 'Coupon already applied', cart });
      }
      cart.coupons.push(couponId);
      req.session.cart = cart; // Save the updated cart back to session
    }

    res.status(200).json({ message: 'Coupon applied', cart });
  } catch (error) {
    res.status(500).json({ message: 'Error applying coupon', error: error.message });
  }
}

exports.removeCoupon = async (req, res) => {
  const { couponId } = req.params;
  try {
    let cart
    if (req.user) {
      cart = await Cart.findOne({ user: req.user.id });
      cart.coupons = cart.coupons.filter(id => id.toString() !== couponId);
      await cart.save();
    } else {
      cart = req.session.cart;
      if (!cart) {
        cart = { items: [], coupons: [] };
      }

      cart.coupons = cart.coupons.filter(id => id.toString() !== couponId);
      req.session.cart = cart;
    }

    if (!cart)
      return res.status(400).json({ message: 'Cart not found' });

    cart.coupons = cart.coupons.filter(id => id.toString() !== couponId);
    res.status(200).json({ message: 'Coupon removed from cart', cart });
  } catch (error) {
    res.status(500).json({ message: 'Error removing coupon from cart', error: error.message });
  }
}

// Create a new user when checkout but not login
exports.checkout = async (req, res) => {
  const { firstName, lastName, email, address, selectedItemIds } = req.body
  if (!selectedItemIds) {
    return res.status(400).json({ message: 'No items selected' })
  }
  let identifyUserFlag = ''
  try {
    let user = await User.findOne({ email })
    // if user not found, create a new user
    if (!user) {
      identifyUserFlag = 'anonymous'
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
        identifyUserFlag = 'not-logged-in'
        return res.status(401).json({ message: 'User already exists. Please log in to use your cart' })
      }
      identifyUserFlag = 'logged-in'
    }

    // find cart
    let cart
    if (req.user)
      cart = await Cart.findOne({ user: req.user.id })
    else
      cart = await Cart.findOne({ sessionId: req.session.id })

    if (!cart)
      return res.status(400).json({ message: 'Cart not found' })

    const cartItems = cart.items
    if (cartItems.length === 0)
      return res.status(400).json({ message: 'Your cart is empty' })

    // calculate total
    cart.originalTotal = cartItems.reduce((acc, item) => acc + item.price, 0)
    console.log('cart.originalTotal', cart.originalTotal)
    // apply coupon
    const coupons = cart.coupons
    let discount = 0
    if (coupons.length > 0) {
      discount = coupons.map(async (coupon) => {
        const couponObj = await Coupon.findById(coupon)
        return Number(couponObj.discountPercentage)
      })
      discount = await Promise.all(discount)
    }
    // Ensure discount does not exceed original total
    console.log('discount', discount)
    // calculate total after discount
    cart.total = cart.originalTotal - (cart.originalTotal * discount / 100)
    console.log('cart.total', cart.total)
    if (isNaN(cart.total)) {
      cart.total = cart.originalTotal
    }

    // only add selected items to order
    const selectedItems = cartItems.filter(item => selectedItemIds.includes(item.product.toString()))
    if (selectedItems.length === 0) {
      return res.status(400).json({ message: 'No items selected' })
    }
    // create order
    const order = await Order.create({
      user: user._id,
      items: selectedItems,
      discount: discount, // percentage
      total: cart.total,
      shippingAddress: address,
      status: 'pending'
    })

    user.orders.push(order._id)
    await user.save()
    
    if (req.user) {
      cart.items = cart.items.filter(item => !selectedItemIds.includes(item.product.toString()))
      cart.discount = 0
      cart.total = 0
      await cart.save()
    } else {
      req.session.cart = { items: [], coupons: [], discount: 0, total: 0 }
    }

    res.status(200).json({ message: 'Order placed successfully, Please check your email to verify your account and complete the purchase.', order })
  } catch (error) {
    return res.status(500).json({ message: 'Error processing checkout', error: error.message })
  }
}