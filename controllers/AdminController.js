const User = require('../models/User')
const Order = require('../models/Order')
const Product = require('../models/Product')
// ==============================================================================
//                            Users
// ==============================================================================

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
    res.status(200).json({ success: true, data: users })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getNewUsers = async (req, res) => {
  try {
    const users = await User.find({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }) // 24 hours
    res.status(200).json({ success: true, data: users })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(userId, { isBanned: true }, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ==============================================================================
//                            Orders
// ==============================================================================

exports.getOrdersPaginated = async (req, res) => {
  try {
    const { page = 1, limit = 20, filter } = req.query;
    const query = {};

    const now = new Date();
    switch (filter) {
      case 'today':
        query.createdAt = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        query.createdAt = { 
          $gte: new Date(yesterday.setHours(0, 0, 0, 0)),
          $lt: new Date(yesterday.setHours(23, 59, 59, 999)) 
        };
        break;
      case 'this_week':
        const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        query.createdAt = { $gte: firstDayOfWeek };
        break;
      case 'this_month':
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        query.createdAt = { $gte: firstDayOfMonth };
        break;
      case 'custom':
        const { start, end } = req.body;
        query.createdAt = { 
          $gte: new Date(start), 
          $lte: new Date(end) 
        };
        break;
      default:
        break;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.status(200).json({ success: true, data: orders, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// get revenue
exports.getRevenue = async (req, res) => {
  try {
    const revenue = await Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]) 
    res.status(200).json({ success: true, data: revenue })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// best-selling products
exports.getBestSellingProducts = async (req, res) => {
  try {
    const bestSelling = await Order.aggregate([
      // Deconstruct the products array in each order
      { $unwind: '$products' },
      
      // Group by product ID and calculate the total quantity sold
      { 
        $group: { 
          _id: '$products.product', 
          totalSold: { $sum: '$products.quantity' } 
        } 
      },
      
      // Sort the products by totalSold in descending order
      { $sort: { totalSold: -1 } },
      
      // Optional: Limit the results to the top 10 best-selling products
      { $limit: 10 },
      
      // Lookup to fetch product details from the Products collection
      { 
        $lookup: { 
          from: 'products', 
          localField: '_id', 
          foreignField: '_id', 
          as: 'productDetails' 
        } 
      },
      
      // Unwind the productDetails array to get object format
      { $unwind: '$productDetails' },
      
      // Project the desired fields
      { 
        $project: { 
          _id: 0,
          productId: '$_id',
          name: '$productDetails.name',
          totalSold: 1  
        } 
      }
    ]);

    res.status(200).json({ success: true, data: bestSelling });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
//                            Products
// ==============================================================================

// include add product to category
exports.addProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
} 