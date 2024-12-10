const express = require('express');
const router = express.Router();
const CouponController = require('../controllers/CouponController');
const { auth, admin } = require('../middleware/authMiddleware'); 


router.post('/create', auth, admin, CouponController.createCoupon);
router.put('/update/:id', auth, admin, CouponController.updateCoupon);
router.get('/getById/:id', auth, admin, CouponController.getById);
router.get('/getAll', auth, admin, CouponController.getAll);
router.delete('/delete/:id', auth, admin, CouponController.deleteCoupon);

module.exports = router;