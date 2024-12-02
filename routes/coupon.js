const express = require('express');
const router = express.Router();
const CouponController = require('../controllers/CouponController');
const { auth } = require('../middleware/authMiddleware'); 

router.use(auth);

router.post('/create', CouponController.createCoupon);
router.put('/update/:id', CouponController.updateCoupon);
router.get('/getById/:id', CouponController.getById);
router.get('/getAll', CouponController.getAll);
router.delete('/delete/:id', CouponController.deleteCoupon);

module.exports = router;