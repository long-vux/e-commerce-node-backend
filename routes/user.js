const express = require("express");
const router = express.Router();
const UserController = require("../controllers/UserController");
const { auth, authOptional } = require("../middleware/authMiddleware");
const upload = require("../middleware/multer");

// ==============================================================================
//                            Profile
// ==============================================================================
// PUT /api/user/updateProfile
router.put("/updateProfile", auth, upload.single('image'), UserController.updateProfile);

// PUT /api/user/password/change
router.put("/password/change", auth, UserController.changePassword);

// User Action: User requests to recover their password by providing their email.
// POST /api/user/password/recover
router.post("/password/recover", UserController.recoverPassword);

// User Action: User clicks the link in the email, which includes the reset token, and submits a new password.
// PUT /api/user/password/reset/:userId/:token
router.put("/password/reset/:userId/:token", UserController.resetPassword);

// ==============================================================================
//                            Addresses
// ==============================================================================

// // GET /api/user/addresses
router.get("/addresses", authOptional, UserController.getAddresses);  

// POST /api/user/addAddress
router.post("/addAddress", authOptional, UserController.addAddress);

// PUT /api/user/updateAddress/:addressId
  router.put("/updateAddress/:addressId", authOptional, UserController.updateAddress);

// DELETE /api/user/deleteAddress/:addressId
router.delete("/deleteAddress/:addressId", authOptional, UserController.deleteAddress);

module.exports = router;

