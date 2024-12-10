const express = require('express');
const router = express.Router();
const CouponController = require('../controllers/CouponController');
const { auth, admin } = require('../middleware/authMiddleware'); 


router.post('/create', auth, admin, CouponController.createCoupon);
router.put('/update/:id', auth, admin, CouponController.updateCoupon);
router.get('/getById/:id', auth, CouponController.getById);
router.get('/getAll', auth, CouponController.getAll);
router.delete('/delete/:id', auth, admin, CouponController.deleteCoupon);

module.exports = router;