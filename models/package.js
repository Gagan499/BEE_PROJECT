import mongoose from "mongoose";

const PackageSchema = new mongoose.Schema({
  packageName: {
    type: String,
    required: true,
    unique: true,
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
  Stay: {
    type: String,
    required: true,
  },
  hotelName: {
    type: String,
    required: true,
  },
});

const Package = mongoose.model("Package", PackageSchema);

export default Package;
