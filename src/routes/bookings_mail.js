import nodemailer from "nodemailer";
import chalk from "chalk";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.Email_User,
    pass: process.env.Email_Pass_Key,
  },
});


export async function DefaultEmail(email, req, res) {
  try {
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const mailOptions = {
      from: process.env.Email_User,
      to: email,
      subject: "Request for booking",
      text: "Hello, your booking request has been received.",
    };

    await transporter.sendMail(mailOptions);

    console.log(chalk.green(`Default Email sent to ${email}`));
    res.status(200).json({ success: true, message: "Email sent successfully" });

  } catch (err) {
    console.error(chalk.red("Error sending email:", err));
    res.status(500).json({ success: false, error: "Failed to send email" });
  }
}


export async function AcceptRequestEmail(email,req,res){
    try {
        if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const mailOptions = {
        from: process.env.Email_User,
        to: email,
        subject: "Booking Request Approved ✅", // Updated subject
        text: `Hello,

            Your booking request has been approved. We look forward to serving you!

            Thank you,
            ThePalmWay`,
        };

    await transporter.sendMail(mailOptions);

    console.log(chalk.green(`Acceptance Email sent to ${email}`));
    res.status(200).json({ success: true, message: "Email sent successfully" });
    } catch (err) {
        console.error(chalk.red("Error sending accepting email: ",err));
        res.status(500).json({success:false,error:"Failed to send email"});
    }
}

export async function RejectRequestEmail(email,req,res){
    try {
        if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

 const mailOptions = {
      from: process.env.Email_User,
      to: email,
      subject: "Booking Request Declined ❌", // Updated subject
      text: `Hello,

        We regret to inform you that your booking request has been rejected. 
        Please contact support if you have any questions.

        Thank you,
        ThePalmWay`
    };

    await transporter.sendMail(mailOptions);

    console.log(chalk.green(`Rejecting Email sent to ${email}`));
    res.status(200).json({ success: true, message: "Email sent successfully" });
    } catch (err) {
        console.error(chalk.red("Error sending rejecting email: ",err));
        res.status(500).json({success:false,error:"Failed to send email"});
    }
}
