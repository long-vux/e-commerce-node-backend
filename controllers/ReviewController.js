const Review = require("../models/Review");
const Order = require("../models/Order"); // Assuming you have an Order model

// Add a review (Anyone can write a review, but only purchasers can rate)
exports.addReview = async (req, res) => {
    try {
        const {productId} = req.params
        const { reviewText, rating } = req.body;
        const userId = req.user.id; // From authenticate middleware
        // If rating is provided, verify purchase
        if (rating) {
            const hasPurchased = await Order.findOne({
                user: userId,
                "items.product": productId,
            });

            if (!hasPurchased) {
                return res.status(403).json({ message: "You can only rate products you have purchased." });
            }
        }

        const review = new Review({
            product: productId,
            user: userId,
            reviewText,
            rating,
        });

        await review.save();
        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get reviews for a product
exports.getReviews = async (req, res) => {
    try {
        const { productId } = req.params; // Product ID
        const reviews = await Review.find({ product: productId }).populate('user', 'firstName lastName');
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { reviewText, rating } = req.body;
        const userId = req.user.id;
        const review = await Review.findOne({_id: id, user: userId})
        if (!review) {
            return res.status(404).json({ message: "Review not found." });
        }
        await Review.findByIdAndUpdate(id, { reviewText, rating });
        res.status(200).json({ message: 'Review updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
