import express from "express";
import Booking from "../../models/booking.js";
import { getIO } from "../../config/socket.js";
import { DefaultEmail,AcceptRequestEmail,RejectRequestEmail } from "./bookings_mail.js";
import { validateEmail } from "./emailValidator.js";
import adminAuth from "../Middlewares/adminAuth.js";

const bookingsRouter = express.Router();

// Create a booking (no auth required, not tied to email/user)
bookingsRouter.post("/", async (req, res) => {
  try {
    const {
      customerName,
      phoneNumber,
      emailId,
      bookingType,
      packageName,
      hotelName,
      location,
      arrivalDate,
      departureDate,
      adults,
      children,
      paymentMethod,
      paymentDetails,
    } = req.body;

    // Basic required checks
    if (
      !customerName ||
      !phoneNumber ||
      !emailId ||
      !bookingType ||
      !arrivalDate ||
      !departureDate ||
      !adults
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Enforce conditional requirements
    if (bookingType === "package" && !packageName) {
      return res
        .status(400)
        .json({
          success: false,
          message: "packageName is required when bookingType is 'package'",
        });
    }
    if (bookingType === "stayOnly" && !hotelName) {
      return res
        .status(400)
        .json({
          success: false,
          message: "hotelName is required when bookingType is 'stayOnly'",
        });
    }

    // Validate dates
    const arrival = new Date(arrivalDate);
    const departure = new Date(departureDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

    // Check if dates are valid
    if (isNaN(arrival.getTime())) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid arrival date format",
        });
    }
    if (isNaN(departure.getTime())) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid departure date format",
        });
    }

    // Check if arrival date is in the past
    if (arrival < today) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Arrival date cannot be in the past",
        });
    }

    // Check if departure date is before or equal to arrival date
    if (departure <= arrival) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Departure date must be after arrival date",
        });
    }

    // Validate email using Verifalia
    const emailValidation = await validateEmail(emailId);
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

    // Prepare payment details object
    const paymentDetailsObj = paymentDetails ? {
      cardNumber: paymentDetails.cardNumber || undefined,
      cardHolderName: paymentDetails.cardHolderName || undefined,
      expiryDate: paymentDetails.expiryDate || undefined,
      cvv: paymentDetails.cvv || undefined,
      accountNumber: paymentDetails.accountNumber || undefined,
      bankName: paymentDetails.bankName || undefined,
      ifscCode: paymentDetails.ifscCode || undefined,
      accountHolderName: paymentDetails.accountHolderName || undefined,
      paypalEmail: paymentDetails.paypalEmail || undefined,
      paytmNumber: paymentDetails.paytmNumber || undefined,
      upiId: paymentDetails.upiId || undefined,
      transactionId: paymentDetails.transactionId || undefined,
      qrCodeScanned: paymentDetails.qrCodeScanned || false,
    } : undefined;

    const doc = new Booking({
      name: customerName,
      phoneNumber,
      email: emailId,
      bookingType,
      location: location || undefined,
      packageName: packageName || undefined,
      hotelName: hotelName || undefined,
      arrivalDate,
      departureDate,
      adults: Number(adults),
      children: children != null ? Number(children) : 0,
      paymentMethod: paymentMethod || undefined,
      paymentDetails: paymentDetailsObj,
    });

    await doc.save();
    
    // Emit new booking event via WebSocket
    try {
      const io = getIO();
      io.emit("new-booking", {
        bookingId: String(doc._id),
        name: customerName,
        bookingType: bookingType,
        title: packageName || hotelName || "Booking",
        arrivalDate: arrivalDate,
        departureDate: departureDate,
      });
    } catch (socketErr) {
      console.error("WebSocket emit failed, but booking was created:", socketErr);
      // Continue - booking is already saved
    }
    
    // Prepare booking data for email
    const bookingDataForEmail = {
      name: customerName,
      bookingType: bookingType,
      packageName: packageName,
      hotelName: hotelName,
      arrivalDate: arrivalDate,
      departureDate: departureDate,
      adults: Number(adults),
      children: children != null ? Number(children) : 0,
      totalAmount: doc.totalAmount,
      specialRequests: doc.specialRequests
    };
    
    // Send email asynchronously - don't fail booking if email fails
    try {
      await DefaultEmail(emailId, bookingDataForEmail);
    } catch (emailErr) {
      console.error("Email sending failed, but booking was created:", emailErr);
      // Continue - booking is already saved
    }
    
    return res
      .status(201)
      .json({ success: true, message: "Booking created", bookingId: doc._id });
  } catch (err) {
    console.error("Error creating booking:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

// Update booking status
bookingsRouter.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // expected: approved | rejected
    if (!status || !["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const result = await Booking.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    ).lean();
    if (!result)
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    
    // Prepare booking data for email
    const bookingDataForEmail = {
      name: result.name,
      bookingType: result.bookingType,
      packageName: result.packageName,
      hotelName: result.hotelName,
      arrivalDate: result.arrivalDate,
      departureDate: result.departureDate,
      adults: result.adults,
      children: result.children || 0,
      totalAmount: result.totalAmount,
      specialRequests: result.specialRequests
    };

    // Send email asynchronously - don't fail status update if email fails
    try {
      if(result.status == "approved"){
        await AcceptRequestEmail(result.email, bookingDataForEmail);
      }
      if(result.status == "rejected"){
        await RejectRequestEmail(result.email, bookingDataForEmail);
      }
    } catch (emailErr) {
      console.error("Email sending failed, but status was updated:", emailErr);
      // Continue - status is already updated
    }
    try {
      const io = getIO();
      io.emit("booking-status", {
        bookingId: String(result._id),
        status: result.status,
        name: result.name,
        title: result.packageName || result.hotelName || "Booking",
        arrivalDate: result.arrivalDate,
        departureDate: result.departureDate,
      });
    } catch (e) {
      // io not initialized; ignore silently
    }
    return res.json({ success: true, status: result.status });
  } catch (err) {
    console.error("Error updating booking status:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

// Get single booking by ID (Admin only)
bookingsRouter.get("/:id", async (req, res) => {
  try {
    const bookingData = await Booking.findById(req.params.id).lean();
    if (!bookingData) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }
    res.status(200).json({
      success: true,
      booking: bookingData,
    });
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch booking.",
    });
  }
});

// Update booking (Admin only)
bookingsRouter.put("/:id", adminAuth, async (req, res) => {
  try {
    const bookingData = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!bookingData) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Booking updated successfully!",
      booking: bookingData,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update booking.",
    });
  }
});

// Delete booking (Admin only)
bookingsRouter.delete("/:id", adminAuth, async (req, res) => {
  try {
    const bookingData = await Booking.findByIdAndDelete(req.params.id);

    if (!bookingData) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Booking deleted successfully!",
    });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete booking.",
    });
  }
});

// Optional: list bookings as JSON
bookingsRouter.get("/", async (req, res) => {
  try {
    const docs = await Booking.find({}).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, bookings: docs });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

export default bookingsRouter;
