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
router.get('/orders', auth, admin, AdminController.getOrdersPaginated)

// ================================= Revenue ================================
router.get('/revenue', auth, admin, AdminController.getRevenue)

// ================================= Product ================================
router.post('/add-product', auth, admin, upload.single('image'), AdminController.addProduct)
router.put("/:id", auth, admin, AdminController.updateProduct);
router.delete("/:id", auth, admin, AdminController.deleteProduct);

module.exports = router;
