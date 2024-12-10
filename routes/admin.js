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
router.get('/get-all-orders', auth, admin, AdminController.getOrdersPaginated)

// ================================= Revenue ================================
router.get('/revenue', auth, admin, AdminController.getRevenue)

// ================================= Product ================================
router.post('/add-product', auth, admin, upload.array('images', 6), AdminController.addProduct)
router.put("/update-product/:id", auth, admin, upload.array('images', 6), AdminController.updateProduct);
router.delete("/delete-product/:id", auth, admin, AdminController.deleteProduct);



module.exports = router;
