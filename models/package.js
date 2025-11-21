import mongoose from "mongoose";

const PackageSchema = new mongoose.Schema({
  packageName: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: false,
  },
  type: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  Activities: {
    type: [String],
    required: true,
  },
  features: {
    type: [String],
    required: false,
  },
  Stay: {
    type: String,
    required: true,
  },
  hotelName: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: false,
  },
  image: {
    type: String,
    required: false,
  },
  img: {
    type: String,
    required: false,
  },
  badge: {
    type: String,
    required: false,
  },
  icon: {
    type: String,
    required: false,
  },
  location: {
    type: String,
    required: false,
  },
  days: {
    type: Number,
    required: false,
  },
  nights: {
    type: Number,
    required: false,
  },
  duration: {
    type: String,
    required: false,
  },
}, { timestamps: true });

const Package = mongoose.model("Package", PackageSchema);

export default Package;
