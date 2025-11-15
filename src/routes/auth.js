import express from "express";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { generateToken, verifyToken } from "./jwtutils.js";
import user from "../../models/user.js";
import {FailedLoginPerDay, isBlocked, clearFailedAttempts} from "./loginlimit_redis.js";
import { sendForgotPasswordMail } from "./forgot_mail.js";
import client from "../redis_server.js";
import crypto from "crypto";
import { validateEmail, testVerifaliaCredentials } from "./emailValidator.js";


dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

const authRouter = express.Router();

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables.");
}

// register post
authRouter.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name , Email and Password required !",
      });
    }

    // Validate email using Verifalia
    const emailValidation = await validateEmail(email);
    if (!emailValidation.isValid) {
      let errorMessage = "Invalid email address";
      
      if (emailValidation.result) {
        if (emailValidation.result.isDisposableEmailAddress) {
          errorMessage = "Disposable email addresses are not allowed";
        } else if (emailValidation.result.classification === "Undeliverable") {
          errorMessage = "Email address is not deliverable";
        } else if (emailValidation.result.classification === "Invalid") {
          errorMessage = "Invalid email address format";
        }
      }
      
      return res.status(400).json({
        success: false,
        message: errorMessage,
        emailValidation: emailValidation.result,
      });
    }

    const existingUser = await user.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email is already in use" });
    }

    const saltRounds = 10;
    const hashpassword = await bcrypt.hash(password, saltRounds);

    const newUser = new user({
      name: name,
      email: email,
      password: hashpassword,
    });

    await newUser.save();
    return res.status(201).json({
      success: true,
      message: "Registeration done",
      user: { name: newUser.name, email: newUser.email },
    });
  } catch (err) {
    console.error("Error in registering user : ", err);
    return res
      .status(500)
      .json({ success: false, message: "Error in register page" });
  }
});

// login post

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and Password required !" });
    }
    // Check Redis limit first
    const blockStatus = await isBlocked(email);
    if(blockStatus.blocked){
      const remainingMinutes = Math.ceil(blockStatus.remainingSeconds / 60);
      return res.status(429).json({ 
        success: false, 
        message: `Login limit reached. Your account is temporarily blocked. Please try again after ${remainingMinutes} minute(s).`,
        blocked: true,
        remainingSeconds: blockStatus.remainingSeconds
      })
    }

    // find user
    const User = await user.findOne({ email });
    if (!User) {
      // Increment failed login attempts for invalid email
      await FailedLoginPerDay(email);
      return res
        .status(401)
        .json({ success: false, message: "Invalid Email and Password !" });
    }
    const name = User.name;

    // compare passowrd
    const isMatch = await bcrypt.compare(password, User.password);
    if (!isMatch) {
      // Increment failed login attempts for wrong password
      await FailedLoginPerDay(email);
      return res
        .status(401)
        .json({ success: false, message: "Invalid Credentials" });
    }

    // Clear failed attempts on successful login
    await clearFailedAttempts(email);
    //Genertae token
    const token = generateToken({ name, email });
    res
      .cookie("token", token, {
        httpOnly: true, // Prevent JS access
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        sameSite: "strict",
        secure: false, // set true behind HTTPS
      })
      .status(200)
      .json({ success: true, message: "Login successful", token });
  } catch (err) {
    console.error("error", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server error" });
  }
});

authRouter.get("/login/status", async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, LoggedIn: false, message: "Not Login" });
  }

  try {
    const decoded = verifyToken(token, JWT_SECRET);
    const User = await user.findOne({ email: decoded.email });
    if (!User) {
      return res
        .status(401)
        .json({ success: false, LoggedIn: false, message: "Not Login" });
    }
    res
      .status(200)
      .json({
        success: true,
        LoggedIn: true,
        message: "Log in",
        name: User.name,
      });
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, LoggedIn: false, message: "Not Login" });
  }
});

authRouter.post("/logout", async (req, res) => {
  res.clearCookie("token");
  res.json({ success: true, message: "Logged out successfully" });
});

authRouter.post("/forgot", sendForgotPasswordMail);

// Verify OTP
authRouter.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and OTP are required" 
      });
    }

    const otpKey = `otp:${email}`;
    const storedOtp = await client.get(otpKey);

    if (!storedOtp) {
      return res.status(400).json({ 
        success: false, 
        message: "OTP expired or invalid" 
      });
    }

    if (storedOtp !== otp) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid OTP" 
      });
    }

    // OTP verified successfully - create a reset token and store it
    const resetTokenKey = `reset:${email}`;
    const resetToken = crypto.randomBytes(32).toString("hex");
    await client.set(resetTokenKey, resetToken, { EX: 10 * 60 }); // 10 minutes

    // Delete the OTP after successful verification
    await client.del(otpKey);

    return res.status(200).json({ 
      success: true, 
      message: "OTP verified successfully",
      resetToken 
    });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
});

// Reset password
authRouter.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword, resetToken } = req.body;

    if (!email || !newPassword || !resetToken) {
      return res.status(400).json({ 
        success: false, 
        message: "Email, new password, and reset token are required" 
      });
    }

    // Verify reset token
    const resetTokenKey = `reset:${email}`;
    const storedToken = await client.get(resetTokenKey);

    if (!storedToken || storedToken !== resetToken) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid or expired reset token" 
      });
    }

    // Find user
    const User = await user.findOne({ email });
    if (!User) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashpassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    User.password = hashpassword;
    await User.save();

    // Delete reset token
    await client.del(resetTokenKey);

    return res.status(200).json({ 
      success: true, 
      message: "Password reset successfully" 
    });
  } catch (err) {
    console.error("Error resetting password:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
});

// Test Verifalia credentials (for debugging)
authRouter.get("/test-verifalia", async (req, res) => {
  try {
    const result = await testVerifaliaCredentials();
    return res.status(result.success ? 200 : 401).json(result);
  } catch (err) {
    console.error("Error testing Verifalia credentials:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error while testing credentials",
    });
  }
});

// current user info from cookie or header
authRouter.get("/me", async (req, res) => {
  try {
    const bearer = req.headers.authorization;
    const token =
      req.cookies?.token ||
      (bearer?.startsWith("Bearer ") ? bearer.substring(7) : null);
    if (!token)
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    const payload = verifyToken(token);
    const current = await user
      .findOne({ email: payload.email })
      .select("name email");
    if (!current)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    return res.json({ success: true, user: current });
  } catch (e) {
    const message =
      e?.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
    return res.status(401).json({ success: false, message });
  }
});

export default authRouter;
