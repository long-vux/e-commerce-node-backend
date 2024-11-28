const express = require("express");
const router = express.Router();
const UserController = require("../controllers/UserController");
const auth = require("../middleware/auth");

router.use(auth);

// router.get("/user", UserController.getUser);

// PUT /api/user/profile
router.put("/user/profile", UserController.updateProfile);

// POST /api/user/password/change
router.post("/user/password/change", UserController.changePassword);

// POST /api/user/password/recover
// router.post("/user/password/recover", UserController.recoverPassword);

// POST /api/user/addresses
router.post("/user/addresses", UserController.addAddress);

// PUT /api/user/addresses/:addressId
router.put("/user/addresses/:addressId", UserController.updateAddress);

// DELETE /api/user/addresses/:addressId
router.delete("/user/addresses/:addressId", UserController.deleteAddress);

// GET /api/user/addresses
// router.get("/user/addresses", UserController.getAddresses);

module.exports = router;
