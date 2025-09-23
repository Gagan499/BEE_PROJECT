import mongoose from "mongoose";

const bookingsSchema = new mongoose.Schema(
  {
    UserID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    Name: {
      type: String,
      ref: "User",
      required: true,
    },
    Email: {
      type: String,
      required: true,
      ref: "User",
      unique: true,
    },
    PackageName: {
      type: String,
      ref: "Package",
      required: true,
    },
    HotelName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },
    ArrivalDate: {
      type: Date,
      required: true,
    },
    DepartureDate: {
      type: Date,
      required: true,
    },
    Adults: {
      type: Number,
      required: true,
    },
    Children: {
      type: Number,
      required: false,
    },
    email: {
      type: String,
      required: true,
      ref: "User",
      unique: true,
    },
  },
  { timestamps: true }
);

const bookings = mongoose.model("bookings", bookingsSchema);

export default bookings;
