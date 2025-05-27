const express = require("express");
const router = express.Router();
const { 
  checkUser, 
  signup, 
  login, 
  forgotPassword, 
  resetPassword 
} = require("./userController");

// User authentication routes
router.post("/check", checkUser);
router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
