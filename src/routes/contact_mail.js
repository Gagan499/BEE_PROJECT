import nodemailer from "nodemailer";
import chalk from "chalk";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.Email_User,
    pass: process.env.Email_Pass_Key,
  },
});

// Send email to admin when user submits contact form
export async function ContactEmailToAdmin(name, email, message, req, res) {
  try {
    if (!email || !name || !message) {
      console.error(chalk.red("Missing required fields for ContactEmailToAdmin"));
      return; // Don't send response, just return
    }

    const adminEmail = process.env.Admin_Email || process.env.Email_User; // Use Admin_Email if set, otherwise use Email_User

    const mailOptions = {
      from: process.env.Email_User,
      to: process.env.Email_User,
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #25a85c; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Name:</strong> ${name}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 10px 0;"><strong>Message:</strong></p>
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin-top: 10px;">
              <p style="margin: 0; white-space: pre-wrap;">₹{message}</p>
            </div>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            You can reply directly to this email to contact ${name} at ${email}
          </p>
        </div>
      `,
      replyTo: email, // Allow admin to reply directly to the user
    };

    await transporter.sendMail(mailOptions);

    console.log(chalk.green(`Contact email sent to admin from ${name} (${email})`));
    // Don't send response - let the calling route handle it

  } catch (err) {
    console.error(chalk.red("Error sending contact email to admin:", err));
    // Don't send response - just log the error
  }
}

// Send confirmation email to user
export async function ContactConfirmationEmail(userEmail, userName, req, res) {
  try {
    if (!userEmail || !userName) {
      console.error(chalk.red("Missing required fields for ContactConfirmationEmail"));
      return; // Don't send response, just return
    }

    const mailOptions = {
      from: process.env.Email_User,
      to: userEmail,
      subject: "Thank you for contacting ThePalmWay",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #25a85c; padding-bottom: 10px;">
            Thank You, ${userName}!
          </h2>
          <p style="color: #666; line-height: 1.6;">
            We have received your message and will get back to you as soon as possible.
          </p>
          <p style="color: #666; line-height: 1.6;">
            Our team typically responds within 24-48 hours.
          </p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #333; font-weight: bold;">ThePalmWay Team</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log(chalk.green(`Confirmation email sent to ${userEmail}`));
    // Don't send response - let the calling route handle it

  } catch (err) {
    console.error(chalk.red("Error sending confirmation email:", err));
    // Don't send response - just log the error
  }
}

