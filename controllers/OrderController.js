const Order = require("../models/Order");

const getOrdersOfUser = async (req, res) => {
  const { user } = req.params;
  try {
    const orders = await Order.find({ user });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getHistoryOfUser = async (req, res) => {
  const { user } = req.params;
  try {
    const orders = await Order.find({ user, status: "delivered" }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const trackOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findById(id);
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrder = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    res.status(200).json(order);
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
  trackOrder,
  updateOrder,
  deleteOrder
};

