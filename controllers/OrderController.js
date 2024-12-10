const Order = require("../models/Order");
const Product = require("../models/Product");

const getOrdersOfUser = async (req, res) => {
  const { id } = req.user;
  
  try {
    const orders = await Order.find({ user: id }).populate('items.product', 'name price images').lean();
    // add cloudFront url to images
    orders.forEach(order => {
      order.items.forEach(item => {
        console.log(item.product.images[0])
        item.product.image = `${process.env.CLOUDFRONT_URL}${item.product.images[0]}`;
      });
    });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getHistoryOfUser = async (req, res) => {
  const { id } = req.user;
  try {
    const orders = await Order.find({ user: id, status: "delivered" }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrderDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findById(id).populate('items.product', 'name price images');
    // add cloudFront url to images
    order.items.forEach(item => {
      item.product.images = item.product.images.map(image => `${process.env.CLOUDFRONT_URL}${image}`);
    });
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// update order status and update total sold of each item in order
const updateOrder = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    if(status === 'confirmed') {
      const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
      // update total sold of each item in order
      const items = order.items;
      for (let i = 0; i < items.length; i++) {
        const product = await Product.findById(items[i].product); // find product
        console.log(product)
        // update total sold of product
        product.totalSold += items[i].quantity;
        // update stock of variant
        product.variants.find(variant => variant.name === items[i].variant).stock -= items[i].quantity;
        await product.save();
      }
      res.status(200).json(order);
    } else {
      res.status(400).json({ message: "Order cannot be updated" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    await Order.findByIdAndDelete(id);
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOrdersOfUser,
  getHistoryOfUser,
  getOrderDetails,
  updateOrder,
  deleteOrder
};