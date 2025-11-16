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
      console.error(chalk.red("Email is required for DefaultEmail"));
      return; // Don't send response, just return
    }

    const mailOptions = {
      from: process.env.Email_User,
      to: email,
      subject: "Request for booking",
      text: "Hello, your booking request has been received.",
    };

    await transporter.sendMail(mailOptions);

    console.log(chalk.green(`Default Email sent to ${email}`));
    // Don't send response - let the calling route handle it

  } catch (err) {
    console.error(chalk.red("Error sending email:", err));
    // Don't send response - just log the error
    // The booking will still be created even if email fails
  }
}


export async function AcceptRequestEmail(email,req,res){
    try {
        if (!email) {
      console.error(chalk.red("Email is required for AcceptRequestEmail"));
      return; // Don't send response, just return
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
    // Don't send response - let the calling route handle it
    } catch (err) {
        console.error(chalk.red("Error sending accepting email: ",err));
        // Don't send response - just log the error
    }
}

export async function RejectRequestEmail(email,req,res){
    try {
        if (!email) {
      console.error(chalk.red("Email is required for RejectRequestEmail"));
      return; // Don't send response, just return
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
    // Don't send response - let the calling route handle it
    } catch (err) {
        console.error(chalk.red("Error sending rejecting email: ",err));
        // Don't send response - just log the error
    }
}
