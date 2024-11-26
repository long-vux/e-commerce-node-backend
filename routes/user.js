const express = require("express");
const router = express.Router();
const UserController = require("../controllers/UserController");


// POST /api/user/recoverPassword
router.post('/recoverPassword', UserController.recoverPassword)

module.exports = router;
