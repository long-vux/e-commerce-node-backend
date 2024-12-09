const Cart = require('../models/Cart');
const mongoose = require('mongoose');
const User = require('../models/User');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const VerifyToken = require('../models/VerifyToken');
const sendEmail = require('../utils/sendEmail');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

/**
 * Adds an item to the cart.
 * Supports both anonymous and authenticated users.
 */

exports.addToCart = async (req, res) => {
  if (req.user) console.log('User logged in - adding to cart')
  else console.log('Anonymous user - adding to cart')

  const { productId, quantity, variant } = req.body;

  // Validate Product ID
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

  // Check Stock for the Selected Variant
  const stock = product.variants.find(v => v.name && v.name.trim().toLowerCase() === variant.trim().toLowerCase())?.stock;
  console.log('Product Variants:', product.variants);
  console.log("This is stock: ", stock)
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

      // Fetch or Create Cart for the User
      let cart = await Cart.findOne({ user: req.user.id }).populate('items.product', 'name price image');
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
      cart = await Cart.findOne({ user: req.user.id }).populate('items.product', 'name price image');

      // Respond with the Updated Cart
      return res.status(200).json({ message: 'Item added to cart', cart });

    } else {
      // =========================
      // Anonymous User Flow
      // =========================

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
      }, 'name price image');

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
      let cart = await Cart.findOne({ user: req.user.id }).populate('items.product', 'name price images');

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
        console.log(product)
        const image = product.images[0]
        return {
          name: product.name,
          price: item.price,
          quantity: item.quantity,
          image: `${process.env.CLOUDFRONT_URL}${image}`,
          variant: item.variant,
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
        'name price images'
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
          name: product.name,
          price: item.price,
          quantity: item.quantity,
          image: `${cloudFrontUrl}/${image}`,
          variant: item.variant
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
  else console.log('Anonymous user - getting mini cart');

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

      // Prepare the items array with image URLs prepended by CloudFront URL
      const items = cart.items.map(item => {
        const product = productMap[item.product._id.toString()];
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
    } else {
      // =========================
      // Anonymous User Flow
      // =========================

      // Retrieve cart from the session
      const cart = req.session.cart;

      if (!cart || !cart.items) {
        return res.status(200).json({ items: [] });
      }

      // Extract all product IDs from the cart items
      const productIds = cart.items.map(item => item.product);

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
  let selectedItems = []
  if (req.user) {
    selectedItems = await Cart.findOne({ user: req.user.id }).populate('items.product', 'name price image')
  } else {
    selectedItems = req.session.cart
  }
  if (!selectedItems) {
    return res.status(400).json({ message: 'Cart not found' })
  }
  res.status(200).json({ items: selectedItems.items })
}

exports.updateItem = async (req, res) => {
  try {
    const { productId, variant, quantity } = req.body
    // Input Validation
    if (!productId || !variant || typeof quantity !== 'number') {
      return res.status(400).json({ message: 'Invalid input data' })
    }

    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' })
    }

    // Find the user's cart
    const cart = await Cart.findOne({ user: req.user.id })

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' })
    }

    // Find the specific item in the cart
    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId && item.variant === variant
    )

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' })
    }

    // Optionally, fetch the latest product price from the Products collection
    // to prevent price manipulation from the frontend
    const product = await Product.findById(productId)

    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    // Update quantity and price
    cart.items[itemIndex].quantity = quantity
    cart.items[itemIndex].price = product.price * quantity

    // Save the updated cart
    await cart.save()

    return res.status(200).json({
      message: 'Item updated successfully',
      cart,
    })
  } catch (error) {
    console.error('Error updating cart item:', error)
    return res.status(500).json({ message: 'Server error' })
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

// Create a new user when checkout but not login
exports.checkout = async (req, res) => {
  const { firstName, lastName, email, address, selectedItems } = req.body // selectedItems is an array of objects with productId and variant
  if (!selectedItems) {
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
      cart = req.session.cart

    if (!cart)
      return res.status(400).json({ message: 'Cart not found' })

    if (cart.items.length === 0)
      return res.status(400).json({ message: 'Your cart is empty' })

    // get selected items from cart
    const selectedCartItems = cart.items.filter(item => selectedItems.some(selectedItem => selectedItem.productId === item.product.toString() && selectedItem.variant === item.variant))

    if (selectedCartItems.length === 0)
      return res.status(400).json({ message: 'No items selected' })

    // calculate total of selected items
    cart.total = selectedCartItems.reduce((acc, item) => acc + item.price, 0)
    // apply coupon
    const coupon = cart.coupon
    let discount = 0
    if (coupon) {
      const couponObj = await Coupon.findById(coupon)
      discount = Number(couponObj.discountPercentage)
    }
    // Ensure discount does not exceed original total
    // calculate total after discount
    cart.total -= (cart.total * discount / 100)

    // create order
    const order = await Order.create({
      user: user._id,
      items: selectedCartItems,
      discount: discount, // percentage
      total: cart.total,
      shippingAddress: address,
      status: 'pending'
    })

    user.orders.push(order._id)
    await user.save()
    if (req.user) {
      cart.items = cart.items.filter(item => !selectedCartItems.some(selectedItem => selectedItem.product.toString() === item.product.toString() && selectedItem.variant === item.variant))
      cart.discount = 0
      cart.total = 0
      cart.coupon = null
      await cart.save()
    } else {
      req.session.cart = { items: [], coupon: null, discount: 0, total: 0 }
    }

    // send email to user to thank them for their purchase
    const url = `${process.env.FRONTEND_URL}`
    const subject = 'Thank you for your purchase!'
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
      const productName = item.product.name
      const variant = item.variant
      const quantity = item.quantity
      const price = item.price
      return `
            <tr>
              <td>${productName}</td>
              <td>${variant}</td>x
              <td>${quantity}</td>
              <td>${price}</td>
            </tr>
          `
    }).join('')}
        <tr>
          <td colspan="3" style="text-align: right; font-weight: bold;">Total:</td>
          <td>${cart.total}</td>
        </tr>
      </table>
      <p>Best regards,<br/>MADNESS Team</p>
      <p>You can view your order details <a href="${url}">here</a></p>
    </div>
    `
    await sendEmail(email, subject, htmlContent)

    res.status(200).json({ message: 'Order placed successfully. Please check your email for order details.', order })
  } catch (error) {
    return res.status(500).json({ message: 'Error processing checkout' })
  }
}