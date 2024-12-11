const express = require("express");
const router = express.Router();
const { getOrdersOfUser, getOrderDetails, updateOrder, deleteOrder } = require("../controllers/OrderController");
const { auth, admin } = require("../middleware/authMiddleware");

router.get("/get-orders-of-user", auth, getOrdersOfUser);
router.get("/get-order-details/:id", auth, getOrderDetails);
router.put("/:id", auth, admin, updateOrder);
router.delete("/:id", auth, admin, deleteOrder);

module.exports = router;