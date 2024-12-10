const express = require('express')
const router = express.Router()
const {auth, optionalAuth} = require('../middleware/authMiddleware')
const ReviewController = require('../controllers/ReviewController')

router.post('/:productId',auth,  ReviewController.addReview)
router.get('/getReviews/:productId', ReviewController.getReviews)
router.put('/updateReview/:id', auth, ReviewController.updateReview)

module.exports = router