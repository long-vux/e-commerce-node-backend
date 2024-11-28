const express = require("express");
const router = express.Router();
const UserController = require("../controllers/UserController");
const auth = require("../middleware/auth");

// router.use(auth);

// router.get("/user", UserController.getUser);

// PUT /api/user/updateProfile
router.put("/updateProfile", UserController.updateProfile);

// POST /api/user/password/change
router.post("/password/change", UserController.changePassword);

// User Action: User requests to recover their password by providing their email.
// POST /api/user/password/recover
router.post("/password/recover", UserController.recoverPassword);

// User Action: User clicks the link in the email, which includes the reset token, and submits a new password.
// PUT /api/user/password/reset/:userId/:token
router.put("/password/reset/:userId/:token", UserController.resetPassword);

// POST /api/user/addresses
router.post("/addresses", UserController.addAddress);

// PUT /api/user/addresses/:addressId
router.put("/addresses/:addressId", UserController.updateAddress);

// DELETE /api/user/addresses/:addressId
router.delete("/addresses/:addressId", UserController.deleteAddress);

// GET /api/user/addresses
// router.get("/user/addresses", UserController.getAddresses);

module.exports = router;
