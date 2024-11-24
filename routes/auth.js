const express = require("express");
const dotenv = require("dotenv");
const AuthController = require('../controllers/AuthController')

dotenv.config();

const router = express.Router();

router.post('/googleLogin', AuthController.googleLogin)
router.post('/login', AuthController.login)
router.post('/register', AuthController.register)

module.exports = router;
