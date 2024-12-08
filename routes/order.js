const express = require("express");
const router = express.Router();
const { getOrdersOfUser, getHistoryOfUser, trackOrder, updateOrder, deleteOrder } = require("../controllers/OrderController");
const { auth, admin } = require("../middleware/authMiddleware");

router.get("/get-orders-of-user", auth, getOrdersOfUser);
// router.get("/get-history-of-user/:user", auth, getHistoryOfUser);
router.get("/:id/track", auth, trackOrder);
router.put("/:id", auth, admin, updateOrder);
router.delete("/:id", auth, admin, deleteOrder);

module.exports = router;