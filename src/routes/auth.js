import express from "express";
import bcrypt from "bcryptjs";
import dotenv, { config } from "dotenv";
import { generateToken } from "./jwtutils";
import user from "../../models/user";

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
    const existingUser = user.findOne({ email });

    if (!existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email is already use" });
    }

    const saltRounds = 10;
    const hashpassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
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
    const user = user.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid Email and Password !" });
    }

    // compare passowrd
    const isMatch = bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid Credentials" });
    }

    // generate jwt

    const token = generateToken({ email });
    res
      .cookie("token", token, {
        httpOnly: false, // Cannot be accessed by JS
        maxAge: JWT_TTL_SEC * 1000, // 1 day
        sameSite: "lax", // Prevent CSRF
        secure: false, // Set true if using HTTPS
      })
      .status(200)
      .json({ message: "Login successful" });
  } catch (err) {
    console.error("error", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server error" });
  }
});
