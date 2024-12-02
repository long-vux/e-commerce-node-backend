const express = require("express");
const router = express.Router();
const UserController = require("../controllers/UserController");
const { auth } = require("../middleware/authMiddleware");

router.use(auth);

// ==============================================================================
//                            Profile
// ==============================================================================
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


// ==============================================================================
//                            Addresses
// ==============================================================================

// GET /api/user/addresses
router.get("/addresses", UserController.getAddresses);  

// POST /api/user/addAddress
router.post("/addAddress", UserController.addAddress);

// PUT /api/user/updateAddress/:addressId
router.put("/updateAddress/:addressId", UserController.updateAddress);

// DELETE /api/user/deleteAddress/:addressId
router.delete("/deleteAddress/:addressId", UserController.deleteAddress);

module.exports = router;
