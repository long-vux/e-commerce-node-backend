const Cart = require('../models/Cart');
const mongoose = require('mongoose');
const User = require('../models/User');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const VerifyToken = require('../models/VerifyToken');
const sendEmail = require('../utils/sendEmail');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { formatCurrency } = require('../utils/formatCurrency');
/**
 * Adds an item to the cart.
 * Supports both anonymous and authenticated users.
 */

exports.addToCart = async (req, res) => {

  const { productId, quantity, variant } = req.body;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  // Fetch Product Details
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(400).json({ message: 'Product not found' });
  }

  const price = product.price * parseInt(quantity, 10);
  console.log('Variant from request:', variant);

  console.log(variant)
  // Check Stock for the Selected Variant
  const stock = product.variants.find(v => v.name === variant)?.stock;
  if (!stock) {
    return res.status(400).json({ message: 'Variant not found' });
  } else if (stock < quantity) {
    return res.status(400).json({ message: 'Insufficient stock' });
  }

  try {
    if (req.user) {
      // =======================
      // Authenticated User Flow
      // =======================
      if (req.user) console.log('User logged in - adding to cart')

      // Fetch or Create Cart for the User
      let cart = await Cart.findOne({ user: req.user.id }).populate('items.product', 'name price images');
      if (!cart) {
        cart = await Cart.create({ user: req.user.id, items: [] });
      }

      // Check if the Product with the Same Variant Exists in the Cart
      let existingItem = cart.items.find(item =>
        item.product &&
        item.product._id.toString() === productId &&
        item.variant === variant
      );

      if (existingItem) {
        // Update Quantity and Price if Item Exists
        existingItem.quantity = parseInt(existingItem.quantity, 10) + parseInt(quantity, 10);
        existingItem.price = parseFloat(existingItem.price) + price;
      } else {
        // Add New Item to the Cart
        cart.items.push({ product: productId, quantity, price, variant });
      }

      // Save the Updated Cart
      await cart.save();

      // Re-populate to Ensure Product Details are Included
      cart = await Cart.findOne({ user: req.user.id }).populate('items.product', 'name price images');

      // Respond with the Updated Cart
      return res.status(200).json({ message: 'Item added to cart', cart });

    } else {
      // =========================
      // Anonymous User Flow
      // =========================
      console.log('Anonymous user - adding to cart')

      // Initialize Cart in Session if It Doesn't Exist
      if (!req.session.cart || !req.session.cart.items) {
        req.session.cart = { items: [], coupon: null };
      }

      let cart = req.session.cart;
      // Check if the Product with the Same Variant Exists in the Cart
      let existingItem = cart.items.find(item => {
        // Handle Both Populated and Unpopulated Product Fields
        if (item.product) {
          if (typeof item.product === 'string' || item.product instanceof mongoose.Types.ObjectId) {
            return item.product.toString() === productId && item.variant === variant;
          } else if (item.product._id) {
            return item.product._id.toString() === productId && item.variant === variant;
          }
        }
        return false;
      });

      if (existingItem) {
        // Update Quantity and Price if Item Exists
        existingItem.quantity = parseInt(existingItem.quantity, 10) + parseInt(quantity, 10);
        existingItem.price = parseFloat(existingItem.price) + price;
      } else {
        // Add New Item to the Cart
        cart.items.push({ product: productId, quantity, price, variant });
      }

      // Save the Updated Cart Back to Session
      req.session.cart = cart;
      // Ensure Session is Saved Before Proceeding
      await new Promise((resolve, reject) => {
        req.session.save(err => {
          if (err) {
            console.log('Error saving session:', err);
            return reject(err);
          }
          resolve();
        });
      });

      // Fetch Product Details for All Items in the Cart
      const populatedItems = await Product.find({
        _id: { $in: cart.items.map(item => item.product) }
      }, 'name price images ');

      // Prepare the Response Cart with Populated Product Details
      const responseCart = {
        items: cart.items.map(item => {
          const productDetail = populatedItems.find(p => p._id.toString() === item.product.toString());
          return {
            product: productDetail ? {
              _id: productDetail._id,
              name: productDetail.name,
              price: productDetail.price,
              image: productDetail.image
            } : null, // Handle Missing Products Gracefully
            quantity: item.quantity,
            price: item.price,
            variant: item.variant
          };
        }),
        coupon: cart.coupon || null
      };

      // Respond with the Updated Cart
      return res.status(200).json({ message: 'Item added to cart', cart: responseCart });
    }
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return res.status(500).json({ message: 'Error adding item to cart', error: error.message });
  }
}
/**
 * Retrieves the cart items.
 * Supports both anonymous and authenticated users.
 */


// Retrieve CloudFront URL from environment variables
const cloudFrontUrl = process.env.CLOUDFRONT_URL || 'https://your-cloudfront-domain.cloudfront.net';

exports.getCart = async (req, res) => {
  try {
    if (req.user) {
      // =======================
      // Authenticated User Flow
      // =======================

      // Retrieve cart from the database with populated product details
      let cart = await Cart.findOne({ user: req.user.id }).populate('items.product', 'name price images weight ');

      if (!cart) {
        // If no cart exists for the user, respond with an empty cart
        return res.status(200).json({ cart: { items: [], coupon: null } });
      }

      // Create a map for quick lookup of product details
      const productMap = {};
      cart.items.forEach(item => {
        if (item.product) {
          productMap[item.product._id.toString()] = item.product;
        }
      });

      // Prepare the response cart with populated product and variant details
      const items = cart.items.map(item => {
        const product = productMap[item.product._id.toString()];
        const image = product.images[0]
        return {
          name: product.name,
          price: item.price,
          originalPrice: product.price,
          quantity: item.quantity,
          image: `${process.env.CLOUDFRONT_URL}${image}`,
          variant: item.variant,
          weight: product.weight,
          selected: item.selected,
          _id: product._id
        };
      });

      return res.status(200).json({ cart: { items, coupon: cart.coupon || null } });
    } else {
      // =========================
      // Anonymous User Flow
      // =========================

      // Retrieve cart from the session
      let cart = req.session.cart;

      // If no cart exists in the session, respond with an empty cart
      if (!cart || !cart.items) {
        return res.status(200).json({ cart: { items: [], coupon: null } });
      }

      // Extract all product IDs from the cart items
      const productIds = cart.items.map(item => item.product);

      // Fetch product details from the database
      const products = await Product.find(
        { _id: { $in: productIds } },
        'name price images weight'
      );

      // Create a map for quick lookup of product details
      const productMap = {};
      products.forEach(product => {
        productMap[product._id.toString()] = product;
      });

      const items = cart.items.map(item => {
        const product = productMap[item.product.toString()];
        const image = product.images[0]

        return {
          _id: product._id,
          name: product.name,
          price: item.price,
          originalPrice: product.price,
          quantity: item.quantity,
          image: `${cloudFrontUrl}${image}`,
          variant: item.variant,
          weight: product.weight,
          selected: item.selected
        };
      });

      return res.status(200).json({ cart: { items, coupon: cart.coupon || null } });
    }
  } catch (error) {
    console.error('Error retrieving cart:', error);
    return res.status(500).json({ message: 'Error getting cart', error: error.message });
  }
};

exports.getMiniCart = async (req, res) => {
  if (req.user) console.log('User logged in - getting mini cart');

  try {
    if (req.user) {
      // =======================
      // Authenticated User Flow
      // =======================

      // Retrieve cart from the database with populated product details
      const cart = await Cart.findOne({ user: req.user.id }).populate('items.product', 'name price images variants');

      if (!cart) {
        // If no cart exists for the user, respond with an empty cart
        return res.status(200).json({ items: [] });
      }

      // Create a map for quick lookup of product details
      const productMap = {};
      cart.items.forEach(item => {
        if (item.product) {
          productMap[item.product._id.toString()] = item.product;
        }
      });

      console.log('productMap------------------------------------', productMap)

      // Prepare the items array with image URLs prepended by CloudFront URL
      const items = cart.items.map(item => {
        const product = productMap[item.product._id.toString()];
        const image = product.images[0]
        console.log('product.images[0]------------------------------------', product.images[0])
        // Find the variant details using variant ID
        const variantDetail = product.variants.id(item.variant);
        const variantInfo = variantDetail ? `${variantDetail.size} - ${variantDetail.color}` : 'Variant not found';

        return {
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          image: `${process.env.CLOUDFRONT_URL}${image}`,
          variant: variantInfo
        };
      });

      res.status(200).json({ items });
    } else {
      // =========================
      // Anonymous User Flow
      // =========================
      console.log('Anonymous user - getting mini cart');

      // Retrieve cart from the session
      const cart = req.session.cart;
      console.log('cart', cart)

      if (!cart || !cart.items) {
        return res.status(200).json({ items: [] });
      }

      // Extract all product IDs from the cart items
      const productIds = cart.items.map(item => item.product);
      console.log('productIds', productIds)
      // Fetch product details from the database
      const products = await Product.find(  
        { _id: { $in: productIds } },
        'name price images variants'
      );

      // Create a map for quick lookup of product details
      const productMap = {};
      products.forEach(product => {
        productMap[product._id.toString()] = product;
      });

      // Prepare the items array with image URLs prepended by CloudFront URL
      const items = cart.items.map(item => {
        const product = productMap[item.product.toString()];
        console.log('product', product)
        const image = product.images[0]

        // Find the variant details using variant ID
        const variantDetail = product.variants.id(item.variant);
        const variantInfo = variantDetail ? `${variantDetail.size} - ${variantDetail.color}` : 'Variant not found';

        return {
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          image: `${process.env.CLOUDFRONT_URL}${image}`,
          variant: variantInfo
        };
      });

      res.status(200).json({ items });
    }
  } catch (error) {
    console.error('Error getting mini cart:', error);
    return res.status(500).json({ message: 'Error getting mini cart', error: error.message });
  }
};

exports.getSelectedItems = async (req, res) => {
  try {
    let selectedItems = [];
    
    if (req.user) {
      // Authenticated User Flow
      const cart = await Cart.findOne({ user: req.user.id }).populate(
        'items.product',
        'name price images weight'
      );

      if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
      }

      // Filter only selected items
      selectedItems = cart.items
        .filter(item => item.selected)
        .map(item => {
          const product = item.product;
          const image = product.images[0];
          return {
            name: product.name,
            price: item.price,
            originalPrice: product.price,
            quantity: item.quantity,
            image: `${process.env.CLOUDFRONT_URL}${image}`,
            variant: item.variant,
            weight: product.weight,
            selected: item.selected,
            _id: product._id,
          };
        });
    } else {
      // Anonymous User Flow
      const cart = req.session.cart;

      if (!cart || !cart.items) {
        return res.status(404).json({ message: 'Cart not found' });
      }

      const productIds = cart.items.map(item => item.product);
      const products = await Product.find(
        { _id: { $in: productIds } },
        'name price images weight'
      );

      const productMap = {};
      products.forEach(product => {
        productMap[product._id.toString()] = product;
      });

      // Filter only selected items
      selectedItems = cart.items
        .filter(item => item.selected)
        .map(item => {
          const product = productMap[item.product.toString()];
          const image = product.images[0];

          return {
            name: product.name,
            price: item.price,
            quantity: item.quantity,
            image: `${process.env.CLOUDFRONT_URL}${image}`,
            variant: item.variant,
            weight: product.weight,
            selected: item.selected,
            _id: product._id,
          };
        });
    }

    return res.status(200).json({ items: selectedItems });
  } catch (error) {
    console.error('Error retrieving selected items:', error);
    return res
      .status(500)
      .json({ message: 'Error getting selected items', error: error.message });
  }
};
exports.updateItem = async (req, res) => {
  try {
    const { productId, variant, quantity, selected } = req.body;
    console.log('req.body', req.body)
    let cart;

    if (req.user) {
      // Authenticated User Flow
      cart = await Cart.findOne({ user: req.user.id });

      if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
      }
    } else {
      // Anonymous User Flow
      cart = req.session.cart;
      console.log('cart', cart)

      if (!cart || !cart.items) {
        return res.status(404).json({ message: 'Cart not found' });
      }
    }

    // Find the specific item in the cart
    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId && item.variant === variant
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    // Optionally, fetch the latest product price from the Products collection
    // to prevent price manipulation from the frontend
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (selected !== undefined) {
      cart.items[itemIndex].selected = selected;
    }

    // Update quantity and price
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].price = product.price * quantity;

    if (req.user) {
      // Save the updated cart for authenticated user
      await cart.save();
    } else {
      // Save the updated cart in session for anonymous user
      req.session.cart = cart;
    }

    return res.status(200).json({
      message: 'Item updated successfully',
      cart,
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateSelectedItem = async (req, res) => {
  try {
    const { productId, variant, selected } = req.body;

    if (req.user) {
      // Authenticated User Flow
      const cart = await Cart.findOne({ user: req.user.id });

      if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
      }

      const item = cart.items.find(
        item => item.product.toString() === productId && item.variant === variant
      );

      if (!item) {
        return res.status(404).json({ message: 'Item not found in cart' });
      }

      item.selected = selected;
      await cart.save();

      return res.status(200).json({ message: 'Item updated successfully', cart });
    } else {
      // Anonymous User Flow
      const cart = req.session.cart;

      if (!cart || !cart.items) {
        return res.status(404).json({ message: 'Cart not found' });
      }

      const item = cart.items.find(
        item => item.product.toString() === productId && item.variant === variant
      );

      if (!item) {
        return res.status(404).json({ message: 'Item not found in cart' });
      }

      item.selected = selected;
      req.session.cart = cart;

      return res.status(200).json({ message: 'Item updated successfully', cart });
    }
  } catch (error) {
    console.error('Error updating cart item:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

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
      req.session.cart = null
      res.status(200).json({ message: 'Cart cleared' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error clearing cart' });
  }
}

/**
 * Removes an item from the cart.
 * Supports both anonymous and authenticated users.
 */
exports.removeItem = async (req, res) => {
  const { productId, variant } = req.body; // variant is the name of the variant

  if (!productId || !variant) {
    return res.status(400).json({ message: 'Product ID and variant are required' });
  }

  try {
    if (req.user) {
      // =======================
      // Authenticated User Flow
      // =======================

      const cart = await Cart.findOne({ user: req.user.id });
      if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
      }

      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId && item.variant === variant
      );

      if (itemIndex === -1) {
        return res.status(404).json({ message: 'Item not found in cart' });
      }

      // Remove the item from the cart
      cart.items.splice(itemIndex, 1);
      await cart.save();

      return res.status(200).json({ message: 'Item removed from cart', cart });
    } else {
      // =========================
      // Anonymous User Flow
      // =========================

      if (!req.session.cart || !Array.isArray(req.session.cart.items)) {
        return res.status(404).json({ message: 'Cart not found' });
      }

      const cart = req.session.cart;
      const initialLength = cart.items.length;

      cart.items = cart.items.filter(
        (item) => !(item.product.toString() === productId && item.variant === variant)
      );

      if (cart.items.length === initialLength) {
        return res.status(404).json({ message: 'Item not found in cart' });
      }

      // If the cart is empty after removal, reset it
      if (cart.items.length === 0) {
        req.session.cart = { items: [], coupons: [] };
      } else {
        req.session.cart = cart;
      }

      // Save the session
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: 'Error saving session', error: err.message });
        }
        return res.status(200).json({ message: 'Item removed from cart', cart: req.session.cart });
      });
    }
  } catch (error) {
    console.error('Error removing item from cart:', error);
    return res.status(500).json({ message: 'Error removing item from cart', error: error.message });
  }
};

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
        req.session.cart = { items: [], coupon: null };
      }
      cart = req.session.cart;
    }
    if (!cart)
      return res.status(400).json({ message: 'Cart not found' });
    // find coupon
    const coupon = await Coupon.findOne({ _id: couponId, isActive: true });
    if (!coupon) {
      return res.status(400).json({ message: 'Coupon not found' });
    }

    if (req.user) {
      // Apply coupon for authenticated user
      if (!cart.coupon) {
        cart.coupon = null;
      }
      if (cart.coupon === couponId) {
        return res.status(400).json({ message: 'Coupon already applied', cart });
      }
      cart.coupon = couponId;
      await cart.save();
    } else {
      // Apply coupon for anonymous user
      if (!cart.coupon) {
        cart.coupon = null;
      }
      if (cart.coupon === couponId) {
        return res.status(400).json({ message: 'Coupon already applied', cart });
      }
      cart.coupon = couponId;
      req.session.cart = cart; // Save the updated cart back to session
    }

    res.status(200).json({ message: 'Coupon applied', cart: await cart.populate('coupon') });
  } catch (error) {
    res.status(500).json({ message: 'Error applying coupon', error: error.message });
  }
}

exports.removeCoupon = async (req, res) => {
  try {
    let cart
    if (req.user) {
      cart = await Cart.findOne({ user: req.user.id });
      cart.coupon = null;
      await cart.save();
    } else {
      cart = req.session.cart;
      if (!cart) {
        cart = { items: [], coupon: null };
      }

      cart.coupon = null;
      req.session.cart = cart;
    }

    if (!cart)
      return res.status(400).json({ message: 'Cart not found' });

    cart.coupon = null;
    res.status(200).json({ message: 'Coupon removed from cart', cart });
  } catch (error) {
    res.status(500).json({ message: 'Error removing coupon from cart', error: error.message });
  }
}

exports.checkout = async (req, res) => {
  const { receiverName, receiverEmail, receiverPhone, address, selectedItems, total, discount, shippingFee, tax} = req.body;
  
  if (!selectedItems || selectedItems.length === 0) {
    return res.status(400).json({ message: 'No items selected' });
  }

  try {
    let user = await User.findOne({ email: receiverEmail });
    let identifyUserFlag = '';

    // If user not found, create a new user
    if (!user) {
      identifyUserFlag = 'anonymous';
      const randomPassword = crypto.randomBytes(10).toString('hex').slice(0, 8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      user = await User.create({ firstName: receiverName, email: receiverEmail, address, password: hashedPassword });

      const token = await VerifyToken.create({
        userId: user._id,
        token: crypto.randomBytes(8).toString('hex')
      });

      const url = `${process.env.FRONTEND_URL}/${user._id}/verify/${token.token}`;
      const subject = 'Verify Your Email and Set Your Password';
      const htmlContent = `
        <h1>Welcome to MADNESS!</h1>
        <p>Thank you for browsing and making purchases at MADNESS!</p>
        <p>Please click the link below to verify your email and set your password:</p>
        <a href="${url}">Verify Email</a>
        <p>Your temporary password is: <strong>${randomPassword}</strong></p>
        <p>Please change your password after logging in for security reasons.</p>
        <p>Best regards,<br/>MADNESS Team</p>
      `;
      await sendEmail(receiverEmail, subject, htmlContent);
    } else {
      if (!req.user) {
        identifyUserFlag = 'not-logged-in';
        return res.status(401).json({ message: 'User already exists. Please log in to use your cart' });
      }
      identifyUserFlag = 'logged-in';
    }

    // find cart
    let cart;
    if (req.user) {
      cart = await Cart.findOne({ user: req.user.id });
    } else {
      cart = req.session.cart;
    }

    if (!cart) {
      return res.status(400).json({ message: 'Cart not found' });
    }

    if (cart.items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    // get selected items from cart
    const selectedCartItems = cart.items.filter(item => selectedItems.some(selectedItem => selectedItem.productId === item.product.toString() && selectedItem.variant === item.variant));

    if (selectedCartItems.length === 0) {
      return res.status(400).json({ message: 'No items selected' });
    }

    // Create order using the data provided by the frontend
    const order = await Order.create({
      user: user._id,
      items: selectedCartItems,
      discount: discount || 0, // percentage
      total: total,
      shippingFee: shippingFee || 0,
      tax: tax || 0,
      shippingAddress: address,
      status: 'pending',
      receiverPhone: receiverPhone,
      receiverName: receiverName
    });

    user.orders.push(order._id);
    await user.save();
    // update coupon usage
    if (cart.coupon) {
      const coupon = await Coupon.findOne({ _id: cart.coupon });
      coupon.usage += 1;
      coupon.maxUsage -= 1;

      if (coupon.maxUsage <= 0) {
        coupon.isActive = false;
      }
      await coupon.save();
    }

    if (req.user) {
      cart.items = cart.items.filter(item => !selectedCartItems.some(selectedItem => selectedItem.product.toString() === item.product.toString() && selectedItem.variant === item.variant));
      cart.discount = 0;
      cart.total = 0;
      cart.coupon = null;
      await cart.save();
    } else {
      req.session.cart = { items: [], coupon: null, discount: 0, total: 0 };
    }

    const url = `${process.env.FRONTEND_URL}`;
    const subject = 'Thank you for your purchase!';
    const htmlContent = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
        <h1 style="text-align: center; font-size: 24px; font-weight: bold;">Welcome to MADNESS!</h1>
        <p>Thank you for your purchase!</p>    
        <p>Your order has been placed successfully.</p>
        <p style="font-weight: bold;">Here are the details of your order:</p>
        <table>
          <tr>
            <th>Product</th>
            <th>Variant</th>
            <th>Quantity</th>
            <th>Price</th>
          </tr>
          ${selectedCartItems.map((item) => {
            const productName = item.product.name;
            const variant = item.variant;
            const quantity = item.quantity;
            const price = formatCurrency(item.price);
            return `
              <tr>
                <td>${productName}</td>
                <td>${variant}</td>
                <td>${quantity}</td>
                <td>${price}</td>
              </tr>
            `;
          }).join('')}
          <tr>
            <td colspan="3" style="text-align: right; font-weight: bold;">Subtotal:</td>
            <td>${formatCurrency(total)}</td>
          </tr>
          <tr>
            <td colspan="3" style="text-align: right; font-weight: bold;">Shipping Fee:</td>
            <td>${formatCurrency(shippingFee)}</td>
          </tr>
          <tr>
            <td colspan="3" style="text-align: right; font-weight: bold;">Tax:</td>
            <td>${formatCurrency(tax)}</td>
          </tr>
          <tr>
            <td colspan="3" style="text-align: right; font-weight: bold;">Total:</td>
            <td>${formatCurrency(total + shippingFee + tax)}</td>
          </tr>
        </table>
        <p>Best regards,<br/>MADNESS Team</p>
        <p>You can view your order details <a href="${url}/orders/${order._id}">here</a></p>
      </div>
    `;
    await sendEmail(receiverEmail, subject, htmlContent);

    res.status(200).json({ message: 'Order placed successfully. Please check your email for order details.', order });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
