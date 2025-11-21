import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    // Optional linkage - not required (no session/email tie)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: false,
    },
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    phone: { type: String, required: false },
    email: { type: String, required: true },
    bookingType: { type: String, enum: ["package", "stayOnly"], required: true },
    location: { type: String, required: false },
    packageName: { type: String, required: false }, // required when bookingType = "package"
    hotelName: { type: String, required: false },   // required when bookingType = "stayOnly"
    roomType: { type: String, required: false },
    title: { type: String, required: false },
    arrivalDate: { type: Date, required: true },
    departureDate: { type: Date, required: true },
    adults: { type: Number, required: true, min: 1 },
    children: { type: Number, required: false, default: 0, min: 0 },
    totalAmount: { type: Number, required: false },
    price: { type: Number, required: false },
    specialRequests: { type: String, required: false },
    notes: { type: String, required: false },
    status: { type: String, enum: ["pending", "approved", "rejected", "confirmed", "completed"], default: "pending" },
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
