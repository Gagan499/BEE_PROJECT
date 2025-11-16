import express from "express";
import Contact from "../../models/contact.js";
import { ContactEmailToAdmin, ContactConfirmationEmail } from "./contact_mail.js";
import { validateEmail } from "./emailValidator.js";

const contactRouter = express.Router();

// Handle contact form submission
contactRouter.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Basic required checks
    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
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

    // Save contact form submission to database
    const contactDoc = new Contact({
      name,
      email,
      message,
    });

    await contactDoc.save();

    // Send email to admin asynchronously - don't fail if email fails
    try {
      await ContactEmailToAdmin(name, email, message, req, res);
    } catch (emailErr) {
      console.error("Email sending to admin failed, but contact was saved:", emailErr);
      // Continue - contact is already saved
    }

    // Send confirmation email to user asynchronously
    try {
      await ContactConfirmationEmail(email, name, req, res);
    } catch (emailErr) {
      console.error("Confirmation email sending failed:", emailErr);
      // Continue - contact is already saved
    }

    return res
      .status(201)
      .json({ 
        success: true, 
        message: "Your message has been received. We'll get back to you soon!",
        contactId: contactDoc._id 
      });
  } catch (err) {
    console.error("Error creating contact submission:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

// Get all contact submissions (for admin)
contactRouter.get("/", async (req, res) => {
  try {
    const contacts = await Contact.find({})
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, contacts });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

// Update contact status (for admin)
contactRouter.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !["new", "read", "replied"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const result = await Contact.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    ).lean();
    
    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Contact not found" });
    }

    return res.json({ success: true, contact: result });
  } catch (err) {
    console.error("Error updating contact status:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

export default contactRouter;

