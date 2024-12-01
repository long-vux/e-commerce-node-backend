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

// GET /api/auth/:id/verify/:token
router.get('/:id/verify/:token', AuthController.verifyEmail)


module.exports = router;