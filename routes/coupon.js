const express = require('express');
const router = express.Router();
const CouponController = require('../controllers/CouponController');
const { admin } = require('../middleware/authMiddleware'); 
const { auth } = require('../middleware/authMiddleware')


router.post('/create', auth, CouponController.createCoupon);
router.put('/update/:id', admin, CouponController.updateCoupon);
router.get('/getById/:id', CouponController.getById);
router.get('/getAll', CouponController.getAll);
router.delete('/delete/:id', admin, CouponController.deleteCoupon);

module.exports = router;