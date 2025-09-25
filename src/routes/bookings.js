import express from "express";
import Booking from "../../models/booking.js";
import { getIO } from "../../config/socket.js";

const bookingsRouter = express.Router();

// Create a booking (no auth required, not tied to email/user)
bookingsRouter.post("/", async (req, res) => {
  try {s
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
    });

    await doc.save();
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
