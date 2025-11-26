import express from "express";
import StayOnly from "../../models/stayOnly.js";
import adminAuth from "../Middlewares/adminAuth.js";

const stayOnlyRouter = express.Router();

// Create stay-only accommodation (Admin only)
stayOnlyRouter.post("/create", adminAuth, async (req, res) => {
  try {
    const {
      name,
      type,
      description,
      location,
      price,
      image,
      img,
      amenities,
      features,
      rating,
      capacity,
      isActive,
    } = req.body;

    // Validate required fields
    if (!name || !type || !description || !price) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, type, description, and price are required.",
      });
    }

    // Check if accommodation with same name already exists
    const existingStayOnly = await StayOnly.findOne({ name });
    if (existingStayOnly) {
      return res.status(400).json({
        success: false,
        message: "An accommodation with this name already exists.",
      });
    }

    // Create new stay-only accommodation
    const newStayOnly = new StayOnly({
      name,
      type,
      description,
      location: location || undefined,
      price: Number(price),
      image: image || undefined,
      img: img || image || undefined,
      amenities: amenities && Array.isArray(amenities) ? amenities : amenities ? [amenities] : [],
      features: features && Array.isArray(features) ? features : features ? [features] : [],
      rating: rating ? Number(rating) : undefined,
      capacity: capacity || undefined,
      isActive: isActive !== undefined ? isActive : true,
    });

    await newStayOnly.save();

    res.status(201).json({
      success: true,
      message: "Stay-only accommodation created successfully!",
      stayOnly: newStayOnly,
    });
  } catch (error) {
    console.error("Error creating stay-only accommodation:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create stay-only accommodation. Please try again.",
    });
  }
});

// Get all stay-only accommodations (Public)
stayOnlyRouter.get("/list", async (req, res) => {
  try {
    const stayOnlyList = await StayOnly.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    res.status(200).json({
      success: true,
      stayOnlyList: stayOnlyList || [],
    });
  } catch (error) {
    console.error("Error fetching stay-only accommodations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stay-only accommodations.",
    });
  }
});

// Get all stay-only accommodations including inactive (Admin only)
stayOnlyRouter.get("/admin/list", adminAuth, async (req, res) => {
  try {
    const stayOnlyList = await StayOnly.find({}).sort({ createdAt: -1 }).lean();
    res.status(200).json({
      success: true,
      stayOnlyList: stayOnlyList || [],
    });
  } catch (error) {
    console.error("Error fetching stay-only accommodations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stay-only accommodations.",
    });
  }
});

// Get single stay-only accommodation by ID (Public)
stayOnlyRouter.get("/:id", async (req, res) => {
  try {
    const stayOnlyData = await StayOnly.findById(req.params.id).lean();
    if (!stayOnlyData) {
      return res.status(404).json({
        success: false,
        message: "Stay-only accommodation not found.",
      });
    }
    res.status(200).json({
      success: true,
      stayOnly: stayOnlyData,
    });
  } catch (error) {
    console.error("Error fetching stay-only accommodation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stay-only accommodation.",
    });
  }
});

// Update stay-only accommodation (Admin only)
stayOnlyRouter.put("/:id", adminAuth, async (req, res) => {
  try {
    const stayOnlyData = await StayOnly.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!stayOnlyData) {
      return res.status(404).json({
        success: false,
        message: "Stay-only accommodation not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Stay-only accommodation updated successfully!",
      stayOnly: stayOnlyData,
    });
  } catch (error) {
    console.error("Error updating stay-only accommodation:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update stay-only accommodation.",
    });
  }
});

// Delete stay-only accommodation (Admin only)
stayOnlyRouter.delete("/:id", adminAuth, async (req, res) => {
  try {
    const stayOnlyData = await StayOnly.findByIdAndDelete(req.params.id);

    if (!stayOnlyData) {
      return res.status(404).json({
        success: false,
        message: "Stay-only accommodation not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Stay-only accommodation deleted successfully!",
    });
  } catch (error) {
    console.error("Error deleting stay-only accommodation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete stay-only accommodation.",
    });
  }
});

export default stayOnlyRouter;

