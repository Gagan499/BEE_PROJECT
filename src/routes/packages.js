import express from "express";
import Package from "../../models/package.js";
import adminAuth from "../Middlewares/adminAuth.js";

const packagesRouter = express.Router();

// Create package (Admin only)
packagesRouter.post("/create", adminAuth, async (req, res) => {
  try {
    const {
      packageName,
      title,
      type,
      description,
      Activities,
      features,
      Stay,
      hotelName,
      price,
      image,
      img,
      badge,
      icon,
      location,
      days,
      nights,
      duration,
    } = req.body;

    // Validate required fields
    if (!packageName || !type || !description || !Activities || !Stay || !hotelName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: packageName, type, description, Activities, Stay, and hotelName are required.",
      });
    }

    // Check if package with same name already exists
    const existingPackage = await Package.findOne({ packageName });
    if (existingPackage) {
      return res.status(400).json({
        success: false,
        message: "A package with this name already exists.",
      });
    }

    // Create new package
    const newPackage = new Package({
      packageName,
      title: title || undefined,
      type,
      description,
      Activities: Array.isArray(Activities) ? Activities : [Activities],
      features: features && Array.isArray(features) ? features : features ? [features] : undefined,
      Stay,
      hotelName,
      price: price ? Number(price) : undefined,
      image: image || undefined,
      img: img || image || undefined,
      badge: badge || undefined,
      icon: icon || undefined,
      location: location || undefined,
      days: days ? Number(days) : undefined,
      nights: nights ? Number(nights) : undefined,
      duration: duration || undefined,
    });

    await newPackage.save();

    res.status(201).json({
      success: true,
      message: "Package created successfully!",
      package: newPackage,
    });
  } catch (error) {
    console.error("Error creating package:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create package. Please try again.",
    });
  }
});

// Get all packages (Public) - API endpoint only
packagesRouter.get("/list", async (req, res) => {
  try {
    const packages = await Package.find({}).sort({ createdAt: -1 }).lean();
    res.status(200).json({
      success: true,
      packages: packages || [],
    });
  } catch (error) {
    console.error("Error fetching packages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch packages.",
    });
  }
});

// Get single package by ID (Public)
packagesRouter.get("/:id", async (req, res) => {
  try {
    const packageData = await Package.findById(req.params.id).lean();
    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: "Package not found.",
      });
    }
    res.status(200).json({
      success: true,
      package: packageData,
    });
  } catch (error) {
    console.error("Error fetching package:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch package.",
    });
  }
});

// Update package (Admin only)
packagesRouter.put("/:id", adminAuth, async (req, res) => {
  try {
    const packageData = await Package.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: "Package not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Package updated successfully!",
      package: packageData,
    });
  } catch (error) {
    console.error("Error updating package:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update package.",
    });
  }
});

// Delete package (Admin only)
packagesRouter.delete("/:id", adminAuth, async (req, res) => {
  try {
    const packageData = await Package.findByIdAndDelete(req.params.id);

    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: "Package not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Package deleted successfully!",
    });
  } catch (error) {
    console.error("Error deleting package:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete package.",
    });
  }
});

export default packagesRouter;

