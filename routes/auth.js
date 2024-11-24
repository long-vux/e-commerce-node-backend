const express = require("express");
const dotenv = require("dotenv");
const AuthController = require('../controllers/AuthController')

dotenv.config();

const router = express.Router();

router.post('/googleLogin', AuthController.googleLogin)


module.exports = router;
