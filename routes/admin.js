const express = require("express");
const router = express.Router();
const { admin } = require('../middleware/authMiddleware')
const AdminController = require('../controllers/AdminController')
const upload = require('../middleware/multer')

router.use(admin)

// ================================= User ================================
router.get('/', AdminController.getUsers)
router.put('/:userId/ban', AdminController.banUser)
router.get('/new-users', AdminController.getNewUsers)

// ================================= Order ================================
router.get('/orders', AdminController.getOrdersPaginated)

// ================================= Revenue ================================
router.get('/revenue', AdminController.getRevenue)

// ================================= Best Selling Products ================================
router.get('/best-selling-products', AdminController.getBestSellingProducts)

// ================================= Product ================================
router.post('/add-product', upload.single('image'), AdminController.addProduct)
router.put("/:id", AdminController.updateProduct);
router.delete("/:id", AdminController.deleteProduct);

module.exports = router;
