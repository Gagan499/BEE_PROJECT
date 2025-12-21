import chalk from "chalk";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { generate_random_number } from "./random_no.js";
import client from "../redis_server.js";
import { validateEmail } from "./emailValidator.js";
import { verifyToken } from "./jwtutils.js";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.Email_User,
    pass: process.env.Email_Pass_Key,
  },
});

const OTP_EXPIRY = 10 * 60; // 10 minutes

// Allowed email for password reset (can be set in environment variable)
const ALLOWED_USER_EMAIL = process.env.USER_EMAIL || process.env.ALLOWED_FORGOT_PASSWORD_EMAIL;

export async function sendForgotPasswordMail(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if user is logged in
    let loggedInUserEmail = null;
    try {
      let token = req.cookies?.token;
      if (!token) {
        const authHeader = req.headers["authorization"] || req.headers["Authorization"];
        if (authHeader && authHeader.startsWith("Bearer ")) {
          token = authHeader.substring("Bearer ".length);
        }
      }
      
      if (token) {
        const decoded = verifyToken(token);
        loggedInUserEmail = decoded.email;
      }
    } catch (err) {
      // Token invalid or expired - user is not logged in
      loggedInUserEmail = null;
    }

    // Validate access: Only logged-in users can reset their own password, or specific allowed email
    if (loggedInUserEmail) {
      // User is logged in - only allow if email matches their own email
      if (email.toLowerCase() !== loggedInUserEmail.toLowerCase()) {
        return res.status(403).json({ 
          error: "You can only reset the password for your own account" 
        });
      }
    } else {
      // User is not logged in - only allow if email matches the allowed user email
      if (!ALLOWED_USER_EMAIL || email.toLowerCase() !== ALLOWED_USER_EMAIL.toLowerCase()) {
        return res.status(403).json({ 
          error: "Password reset is only available for logged-in users or authorized email addresses" 
        });
      }
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
        error: errorMessage,
        emailValidation: emailValidation.result 
      });
    }

    const otp = generate_random_number().toString();
    const otpKey = `otp:${email}`;

    // Store OTP in Redis with expiry
    await client.set(otpKey, otp, { EX: OTP_EXPIRY });

    const mailOptions = {
      from: process.env.Email_User,
      to: email,
      subject: "Password Reset Request",
      text: `Your password reset OTP is: ${otp}. This OTP will expire in 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    console.log(chalk.blue(`Password reset email sent to ${email}`));
    res.status(200).json({ message: "Email sent successfully" });

  } catch (err) {
    console.error(chalk.red("Error sending forgot password mail:", err));
    res.status(500).json({ error: "Failed to send email" });
  }
}
