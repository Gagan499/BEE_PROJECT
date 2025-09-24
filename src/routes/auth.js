import express from "express";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { generateToken, verifyToken } from "./jwtutils.js";
import user from "../../models/user.js";

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
      return res
        .status(400)
        .json({
          success: false,
          message: "Name , Email and Password required !",
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
    // generate token
    // const token = generateToken({ email });

    // res.cookie("token", token, {
    //   httpOnly: false, // Cannot be accessed by JS
    //   maxAge: JWT_TTL_SEC * 1000, // 1 day
    //   sameSite: "lax", // Prevent CSRF
    //   secure: false, // Set true if using HTTPS
    // });

    return res
      .status(201)
      .json({
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

    // find user
    const User = await user.findOne({ email });
    if (!User) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid Email and Password !" });
    }

    // compare passowrd
    const isMatch = await bcrypt.compare(password, User.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid Credentials" });
    }

    // generate jwt
    const token = generateToken({ email });
    res
      .cookie("token", token, {
        httpOnly: true, // Prevent JS access
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        sameSite: "lax",
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


// current user info from cookie or header
authRouter.get("/me", async (req, res) => {
  try {
    const bearer = req.headers.authorization;
    const token = req.cookies?.token || (bearer?.startsWith("Bearer ") ? bearer.substring(7) : null);
    if (!token) return res.status(401).json({ success: false, message: "Not authenticated" });
    const payload = verifyToken(token);
    const current = await user.findOne({ email: payload.email }).select("name email");
    if (!current) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, user: current });
  } catch (e) {
    const message = e?.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ success: false, message });
  }
});


export default authRouter;