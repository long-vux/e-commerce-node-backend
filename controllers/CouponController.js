const Coupon = require('../models/Coupon');

exports.createCoupon = async (req, res) => {
  try {
    const { code, discountPercentage, maxUsage } = req.body;
    // check if code already exists
    const existingCoupon = await Coupon.findOne({ code });
    if (existingCoupon) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }
    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 3 days from now
    const coupon = await Coupon.create({ code, discountPercentage, maxUsage, expiryDate });
    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: 'Error creating coupon' });
  }
};
exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { code } = req.body;

    // Check if a coupon with the same code exists, excluding the one being updated
    const existingCoupon = await Coupon.findOne({ code, _id: { $ne: id } });

    if (existingCoupon) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    // Update the coupon with the provided id
    const coupon = await Coupon.findByIdAndUpdate(id, req.body, { new: true });

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.status(200).json(coupon);
  } catch (error) {
    res.status(500).json({ message: 'Error updating coupon', error: error.message });
  }
};


exports.getById = async (req, res) => {
  const { id } = req.params;
  try {
    const coupon = await Coupon.findOne({ _id: id });
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    res.status(200).json(coupon);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching coupon' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching coupons' });
  }
};

exports.deleteCoupon = async (req, res) => {
  const { id } = req.params;
  try {
    await Coupon.findOneAndDelete({ _id: id });
    res.status(200).json({ message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting coupon' });
  }
};
