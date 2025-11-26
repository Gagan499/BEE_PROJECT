import mongoose from "mongoose";

const StayOnlySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["hotel", "resort", "villa", "apartment", "cottage"],
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: false,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  image: {
    type: String,
    required: false,
  },
  img: {
    type: String,
    required: false,
  },
  amenities: {
    type: [String],
    required: false,
  },
  features: {
    type: [String],
    required: false,
  },
  rating: {
    type: Number,
    required: false,
    min: 0,
    max: 5,
  },
  capacity: {
    adults: { type: Number, required: false },
    children: { type: Number, required: false },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

const StayOnly = mongoose.model("StayOnly", StayOnlySchema);

export default StayOnly;

