const express = require("express");
const router = express.Router();
const { admin } = require('../middleware/authMiddleware')
const AdminController = require('../controllers/AdminController')
const upload = require('../middleware/multer')
const { auth } = require('../middleware/authMiddleware')

// ================================= User ================================
router.put('/:userId/ban', auth, admin, AdminController.banUser)
router.get('/new-users', auth, admin, AdminController.getNewUsers)
router.get('/number-of-users', auth, admin, AdminController.getNumberOfUsers)
// ================================= Order ================================
router.get('/get-all-orders', auth, admin, AdminController.getOrdersPaginated)
router.get('/completed-orders', auth, admin, AdminController.getCompletedOrders)
router.get('/revenue-by-month', auth, admin, AdminController.getRevenueByMonth)

// ================================= Revenue ================================
router.get('/revenue', auth, admin, AdminController.getRevenue)

// ================================= Product ================================
router.post('/add-product', auth, admin, upload.array('images', 6), AdminController.addProduct)
router.put("/update-product/:id", auth, admin, upload.array('images', 6), AdminController.updateProduct);
router.delete("/delete-product/:id", auth, admin, AdminController.deleteProduct);



module.exports = router;
