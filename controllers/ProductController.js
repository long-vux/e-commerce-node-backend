const Product = require("../models/Product");
const Order = require("../models/Order");


exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().lean();

    const transformedProducts = products.map(product => {
      if (product.images && Array.isArray(product.images)) {
        product.images = product.images.map(image => `${process.env.CLOUDFRONT_URL}${image}`);
      } else {
        product.images = [];
      }

      if (product.variants && Array.isArray(product.variants)) {
        product.variants = product.variants.map(variant => {
          const [size, color] = variant.name.split(' - ');
          return {
            size: size,
            color: color,
            stock: variant.stock,
          };
        });
      }

      return product;
    });

    res.status(200).json({ success: true, data: transformedProducts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Transform product images
    if (product.images && Array.isArray(product.images)) {
      product.images = product.images.map(image => `${process.env.CLOUDFRONT_URL}${image}`);
    } else {
      product.images = [];
    }

    // Transform product variants
    if (product.variants && Array.isArray(product.variants)) {
      product.variants = product.variants.map(variant => {
        const [size, color] = variant.name.split(' - ');
        return {
          size: size,
          color: color,
          stock: variant.stock,
          _id: variant._id
        };
      });
    }

    let hasPurchased = false;
    if (req.user) {
      hasPurchased = await Order.findOne({ 
        user: req.user.id, 
        "products.product": id,
        status: { $in: ["completed", "shipped", "delivered"] },
      });
    }

    res.status(200).json({ success: true, data: { product, hasPurchased } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// get products by category
exports.getProductsByCategory = async (req, res) => {
  try {
    const category = req.params.category;
    const products = await Product.find({ category: category });
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// search & filter
exports.searchProducts = async (req, res) => {
  try {
    const { name } = req.query;
    console.log("this is search function: ", name)
    let query = {};

    if (name) query.name = { $regex: name, $options: 'i' };

    const products = await Product.find(query);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}


exports.sortByPrice = async (req, res) => {
  const { sort } = req.query;
  try {
    const products = await Product.find().sort({ price: sort === 'asc' ? 1 : -1 });
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
exports.getBestSellingProducts = async (req, res) => {
  try {
    // Step 1: Fetch Relevant Orders
    const orders = await Order.find({
      status: { $in: ["completed", "shipped", "delivered"] }
    }).select('items');
    console.log(orders);

    // Step 2: Calculate Total Sales per Product
    const productSales = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.product.toString();
        const quantity = item.quantity;
        if (productSales[productId]) {
          productSales[productId] += quantity;
        } else {
          productSales[productId] = quantity;
        }
      });
    });

    // Step 3: Sort and Select Top Products
    const sortedProductSales = Object.entries(productSales)
      .map(([productId, totalSold]) => ({ productId, totalSold }))
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 10); // Top 10 best-selling products

    // If no sales found, return an empty array
    if (sortedProductSales.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Step 4: Fetch Product Details with Multiple Images
    const productIds = sortedProductSales.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } }).select('name images price');

    // Step 5: Assemble the Final Response
    const bestSelling = sortedProductSales.map(item => {
      const product = products.find(p => p._id.toString() === item.productId);
      return {
        productId: item.productId,
        name: product ? product.name : 'Unknown Product',
        images: product && product.images 
          ? product.images.map(image => `${process.env.CLOUDFRONT_URL}${image}`) 
          : [],
        price: product ? product.price : null,
        totalSold: item.totalSold
      };
    });

    res.status(200).json({ success: true, data: bestSelling });
  } catch (error) {
    console.error('Error fetching best-selling products:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
