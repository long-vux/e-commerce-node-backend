const User = require('../models/User')
const Order = require('../models/Order')
const Product = require('../models/Product')
const { uploadToS3, deleteFromS3 } = require('../utils/s3Upload')

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

// ==============================================================================
//                            Products
// ==============================================================================

exports.addProduct = async (req, res) => {
  try {
    const { name, description, price, category, tags, variants, weight } = req.body;

    // Parse variants if it's a string
    let parsedVariants;
    if (typeof variants === 'string') {
      try {
        parsedVariants = JSON.parse(variants);
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Invalid variants format' });
      }
    } else {
      parsedVariants = variants;
    }

    // Transform parsedVariants to match the database format
    const formattedVariants = parsedVariants.map(v => ({
      name: `${v.size} - ${v.color}`,
      stock: Number(v.stock), // Ensure stock is a number
    }));

    

    const images = req.files; // Assuming images are sent as multipart/form-data

    if (!images || images.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one image is required.' });
    }

    // Upload each image to AWS S3 and collect their filenames
    const uploadedImages = [];
    for (const image of images) {
      const fileName = `${Date.now()}_${image.originalname}`;
      await uploadToS3(image.buffer, fileName, image.mimetype);
      uploadedImages.push(fileName);
    }

    // Create the product with the uploaded image URLs
    const product = await Product.create({
      name,
      description,
      price,
      category,
      tags: tags.split(',').map(tag => tag.trim()),
      variants: formattedVariants,
      images: uploadedImages,
      weight,
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, tags, variants, existingImages, weight } = req.body;
    const images = req.files; // New images uploaded
    // Parse variants if it's a string
    let parsedVariants;
    if (typeof variants === 'string') {
      try {
        parsedVariants = JSON.parse(variants);
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Invalid variants format' });
      }
    } else {
      parsedVariants = variants;
    }

    // Transform parsedVariants to match the database format
    const formattedVariants = parsedVariants.map(v => ({
      name: `${v.size} - ${v.color}`,
      stock: Number(v.stock), // Ensure stock is a number
    }));

    // Fetch the current product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const currentImages = product.images;
    let existingImagesArray;
    if (typeof existingImages === 'string') {
      try {
        existingImagesArray = JSON.parse(existingImages);
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Invalid existingImages format' });
      }
    } else if (Array.isArray(existingImages)) {
      existingImagesArray = existingImages;
    } else {
      existingImagesArray = [];
    }
    // Determine images to keep and delete
    const imagesToKeep = existingImagesArray.map(url => {
      try {
        const urlObj = new URL(url);
        return urlObj.pathname.split('/').pop();
      } catch (e) {
        // If the URL is invalid, assume it's already a filename
        return url.split('/').pop();
      }
    });
    const imagesToDelete = currentImages.filter(image => !imagesToKeep.includes(image));

    // Delete images not present in the new upload from S3
    for (const image of imagesToDelete) {
      await deleteFromS3(image);
    }

    const uploadedImages = [];
    if (images && images.length > 0) {
      for (const image of images) {
        const fileName = `${Date.now()}_${image.originalname}`;
        await uploadToS3(image.buffer, fileName, image.mimetype);
        uploadedImages.push(fileName);
      }
    
    }

    // Combine existing images with newly uploaded images
    const finalImages = [...imagesToKeep, ...uploadedImages];
    // Update the product with the new data
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name,
        description,
        price,
        category,
        tags: tags.split(',').map(tag => tag.trim()),
        variants: formattedVariants,
        images: finalImages,
        weight,
      },
      { new: true }
    );

    res.status(200).json({ success: true, data: updatedProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Remove images from S3
    for (const imageName of product.images) {
      await deleteFromS3(imageName);
    }

    // Delete the product from the database
    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Product and associated images deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};