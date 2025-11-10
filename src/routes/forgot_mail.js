import chalk from "chalk";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { generate_random_number } from "./random_no.js";
import client from "../redis_server.js";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.Email_User,
    pass: process.env.Email_Pass_Key,
  },
});

const OTP_EXPIRY = 10 * 60; // 10 minutes

export async function sendForgotPasswordMail(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
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
