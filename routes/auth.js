const express = require("express");
const dotenv = require("dotenv");
const AuthController = require('../controllers/AuthController')

dotenv.config();

const router = express.Router();

// POST /api/auth/googleLogin
router.post('/googleLogin', AuthController.googleLogin)

// POST /api/auth/login
router.post('/login', AuthController.login)

// POST /api/auth/register
router.post('/register', AuthController.register)

// POST /api/auth/createUser
// router.post('/createUser', AuthController.createUser)

module.exports = router;
