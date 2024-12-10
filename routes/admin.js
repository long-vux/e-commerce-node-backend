const express = require("express");
const router = express.Router();
const { admin } = require('../middleware/authMiddleware')
const AdminController = require('../controllers/AdminController')
const upload = require('../middleware/multer')
const { auth } = require('../middleware/authMiddleware')


// ================================= User ================================
router.get('/', auth, admin, AdminController.getUsers)
router.put('/:userId/ban', auth, admin, AdminController.banUser)
router.get('/new-users', auth, admin, AdminController.getNewUsers)
// ================================= Order ================================

// ================================= Revenue ================================

// ================================= Product ================================
router.post('/add-product', auth, admin, upload.array('images', 6), AdminController.addProduct)
router.put("/update-product/:id", auth, admin, upload.array('images', 6), AdminController.updateProduct);
router.delete("/delete-product/:id", auth, admin, AdminController.deleteProduct);

//================================== DASHBOARD ==========================
router.get('/revenue-by-month',  AdminController.getRevenueByMonth)
router.get('/revenue',  AdminController.getRevenue)
router.get('/get-all-orders',  AdminController.getOrdersPaginated)
router.get('/completed-orders',  AdminController.getCompletedOrders)
router.get('/number-of-users',  AdminController.getNumberOfUsers)


module.exports = router;
