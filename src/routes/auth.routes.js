const express = require("express");
const {
  register,
  login,
  sendOtp,
  verifyOtp,
  googleAuth,
  getAllUsers,
} = require("../controllers/auth.controller");
const { requireAdmin } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/google", googleAuth);
router.get("/users",getAllUsers);
module.exports = router;
