const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const { createResponse, ErrorResponse } = require("../utils/responseWrapper");
const jwt = require("jsonwebtoken");
const sendOtpEmail = require("../utils/sendEmail");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client("YOUR_CLIENT_ID");
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json(ErrorResponse(400, "User already exists"));

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, password: hashed });

    return res
      .status(201)
      .json(createResponse(201, user, "User created successfully"));
  } catch (error) {
    return res.status(500).json(ErrorResponse(500, "Internal server error"));
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json(ErrorResponse(404, "User not found"));

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json(ErrorResponse(400, "Invalid credentials"));

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(200).json({
      status: "success",
      message: "Login successful",
      token,
      role: user.role,
      name: user.name,
    });
  } catch (error) {
    return res.status(500).json(ErrorResponse(500, "Internal server error"));
  }
};

const sendOtp = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res.status(400).json(ErrorResponse(400, "Email is required"));
    }

    email = email.toLowerCase().trim();
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    if (user?.otpExpiry && user.otpExpiry > Date.now()) {
      return res.status(400).json({
        status: "error",
        message: "Please wait before resending OTP",
      });
    }

    user.otp = await bcrypt.hash(otp, 10);
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();
    await sendOtpEmail(email, otp);

    return res
      .status(200)
      .json(createResponse(200, null, "OTP sent successfully"));
  } catch (error) {
    console.error("SEND OTP ERROR:", error);
    return res.status(500).json(ErrorResponse(500, "Internal server error"));
  }
};

const verifyOtp = async (req, res) => {
  try {
    let { email, otp, name } = req.body;
    email = email.toLowerCase().trim();

    if (!email || !otp) {
      return res.status(400).json({
        status: "error",
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const isOtpValid = await bcrypt.compare(otp, user.otp);
    if (!isOtpValid) {
      return res.status(400).json({
        status: "error",
        message: "Invalid OTP",
      });
    }

    if (user.otpExpiry < Date.now()) {
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();

      return res.status(400).json({
        status: "error",
        message: "OTP expired",
      });
    }

    // ✅ SAVE NAME ON FIRST LOGIN
    if (name && !user.name) {
      user.name = name;
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;

    await user.save();

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(200).json({
      status: "success",
      message: "OTP verified successfully",
      token,
      role: user.role,
      name: user.name, // ✅ SEND NAME BACK
      isProfileComplete: !!user.name,
    });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { credential, name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Name is required",
      });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience:
        "96657188171-rjsohnkkm0gjcp0iodluc9523tknctrf.apps.googleusercontent.com",
    });

    const payload = ticket.getPayload();

    const email = payload.email;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        name, // ✅ use frontend name
        isVerified: true,
      });
    } else {
      // ✅ update name if not present
      if (!user.name) {
        user.name = name;
        await user.save();
      }
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(200).json({
      token,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      status: "error",
      message: "Google authentication failed",
    });
  }
};

module.exports = { register, login, sendOtp, verifyOtp, googleAuth };
