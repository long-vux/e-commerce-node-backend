const Review = require("../models/Review");
const Order = require("../models/Order"); // Assuming you have an Order model

// Add a review (Anyone can write a review, but only purchasers can rate)
exports.addReview = async (req, res) => {
    try {
        const { id } = req.params; // Product ID
        const { reviewText, rating } = req.body;
        const userId = req.user.id; // From authenticate middleware

        // If rating is provided, verify purchase
        if (rating) {
            const hasPurchased = await Order.findOne({
                user: userId,
                "products.product": id,
            });

            if (!hasPurchased) {
                return res.status(403).json({ message: "You can only rate products you have purchased." });
            }
        }

        const review = new Review({
            product: id,
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
        const { id } = req.params; // Product ID
        const reviews = await Review.find({ product: id }).populate('user', 'name');
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};