const Cart = require('../models/Cart');

exports.addToCart = async (req, res) => {
  const { userId, sessionId, productId, quantity } = req.body;

  try {
    let cart = await Cart.findOne(userId ? { userId } : { sessionId });

    if (!cart) {
      cart = new Cart({ userId, sessionId, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    await cart.save();

    res.status(200).json({ message: 'Item added to cart', cart });
  } catch (error) {
    res.status(500).json({ message: 'Error adding item to cart', error });
  }
}

exports.removeFromCart = async (req, res) => {
  const { userId, sessionId, productId } = req.body;

  try {
    let cart = await Cart.findOne(userId ? { userId } : { sessionId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    await cart.save();

    res.status(200).json({ message: 'Item removed from cart', cart });
  } catch (error) {
    res.status(500).json({ message: 'Error removing item from cart', error });
  }
}
