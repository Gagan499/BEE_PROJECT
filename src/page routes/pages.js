import express from "express";
import Booking from "../../models/booking.js";
import Package from "../../models/package.js";
import StayOnly from "../../models/stayOnly.js";
import authenticator from "../Middlewares/authenticator.js";
import adminAuth from "../Middlewares/adminAuth.js";
import user from "../../models/user.js";

const pageRoutes = express.Router();

pageRoutes.get('/about',(req,res)=>{
  res.render('about.ejs');
});

pageRoutes.get("/contact",(req,res)=>{
  res.render("contact.ejs");
});

pageRoutes.get("/login", (req, res) => {
  res.render("login.ejs");
});

pageRoutes.get("/change-password",(req,res)=>{
  res.render("forgotpass.ejs");
})

// User Profile Page - Shows user details and their bookings
pageRoutes.get("/profile", authenticator, async (req, res) => {
  try {
    // Get user email from token
    const userEmail = req.user.email;
    
    // Fetch user details
    const userData = await user.findOne({ email: userEmail }).select("name email createdAt").lean();
    
    if (!userData) {
      return res.status(404).render("error.ejs", {
        errorCode: 404,
        errorMessage: "User not found.",
      });
    }

    // Fetch user's bookings (filtered by email)
    const docs = await Booking.find({ email: userEmail }).sort({ createdAt: -1 }).lean();
    const fmt = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "-");
    const bookings = docs.map((b, i) => ({
      _id: b._id.toString(),
      idx: i + 1,
      title: b.hotelName || b.packageName,
      name: b.name,
      location: b.location || "-",
      arrival: fmt(b.arrivalDate),
      departure: fmt(b.departureDate),
      arrivalDate: fmt(b.arrivalDate),
      departureDate: fmt(b.departureDate),
      status: b.status || "pending",
      phoneNumber: b.phoneNumber,
      phone: b.phoneNumber || b.phone,
      email: b.email,
      bookingType: b.bookingType,
      packageName: b.packageName,
      hotelName: b.hotelName,
      roomType: b.roomType,
      adults: b.adults,
      children: b.children,
      totalAmount: b.totalAmount || b.price,
      price: b.price,
      specialRequests: b.specialRequests,
      notes: b.notes,
      createdAt: b.createdAt,
    }));

    // Format user join date
    const joinDate = userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'N/A';

    res.render("profile.ejs", { 
      user: userData,
      joinDate,
      bookings: bookings || []
    });
  } catch (err) {
    console.error("Failed to load user profile:", err);
    res.render("error.ejs", {
      errorCode: 500,
      errorMessage: "Failed to load profile. Please try again.",
    });
  }
});

pageRoutes.get("/user", authenticator, async (req, res) => {
  try {
    const docs = await Booking.find({}).sort({ createdAt: -1 }).lean();
    const fmt = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "-");
    const bookings = docs.map((b, i) => ({
      _id: b._id.toString(),
      idx: i + 1,
      title: b.hotelName || b.packageName,
      name: b.name,
      location: b.location || "-",
      arrival: fmt(b.arrivalDate),
      departure: fmt(b.departureDate),
      arrivalDate: fmt(b.arrivalDate),
      departureDate: fmt(b.departureDate),
      status: b.status || "pending",
      phoneNumber: b.phoneNumber,
      phone: b.phoneNumber || b.phone,
      email: b.email,
      bookingType: b.bookingType,
      packageName: b.packageName,
      hotelName: b.hotelName,
      roomType: b.roomType,
      adults: b.adults,
      children: b.children,
      totalAmount: b.totalAmount || b.price,
      price: b.price,
      specialRequests: b.specialRequests,
      notes: b.notes,
      createdAt: b.createdAt,
    }));
    res.render("user.ejs", { bookings });
  } catch (err) {
    console.error("Failed to load user bookings:", err);
    res.render("user.ejs", { bookings: [] });
  }
});

pageRoutes.get("/admin", authenticator, async (req, res) => {
  try {
    const docs = await Booking.find({}).sort({ createdAt: -1 }).lean();
    const toCss = (s) => (s === 'approved' ? 'approve' : s === 'rejected' ? 'reject' : 'pending');
    const fmt = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "-");
    const bookings = docs.map((b, i) => ({
      _id: b._id.toString(),
      idx: i + 1,
      name: b.name,
      email: b.email,
      phone: b.phoneNumber || b.phone,
      location: b.location || "-",
      hotelName: b.hotelName,
      packageName: b.packageName,
      title: b.hotelName || b.packageName,
      roomType: b.roomType,
      arrivalDate: fmt(b.arrivalDate),
      departureDate: fmt(b.departureDate),
      arrival: fmt(b.arrivalDate),
      departure: fmt(b.departureDate),
      adults: b.adults,
      children: b.children,
      specialRequests: b.specialRequests,
      notes: b.notes,
      totalAmount: b.totalAmount || b.price,
      price: b.price,
      bookingType: b.bookingType,
      status: b.status || "pending",
      cssStatus: toCss(b.status || 'pending'),
      createdAt: b.createdAt,
    }));
    
    // Fetch packages and stay-only for admin management
    const packages = await Package.find({}).sort({ createdAt: -1 }).lean();
    const stayOnlyList = await StayOnly.find({}).sort({ createdAt: -1 }).lean();
    
    res.render("admin.ejs", { bookings, packages: packages || [], stayOnlyList: stayOnlyList || [] });
  } catch (err) {
    console.error("Failed to load admin data:", err);
    res.render("admin.ejs", { bookings: [], packages: [], stayOnlyList: [] });
  }
});

pageRoutes.get("/booking", authenticator, async (req, res) => {
  try {
    // Fetch available rooms/packages for booking
    const packages = await Package.find({}).lean();
    // Fetch stay-only accommodations
    const stayOnlyList = await StayOnly.find({ isActive: true }).lean();
    res.render("booking_flow.ejs", { 
      packages: packages || [],
      stayOnlyList: stayOnlyList || []
    });
  } catch (err) {
    console.error("Failed to load booking data:", err);
    res.render("booking_flow.ejs", { packages: [], stayOnlyList: [] });
  }
});

pageRoutes.get("/packages", async (req, res) => {
  try {
    const packages = await Package.find({}).lean();
    res.render("packages.ejs", { packages: packages || [] });
  } catch (err) {
    console.error("Failed to load packages:", err);
    res.render("packages.ejs", { packages: [] });
  }
});

// Admin package creation page
pageRoutes.get("/create-package", adminAuth, (req, res) => {
  res.render("create-package.ejs");
});

// Admin stay-only creation page
pageRoutes.get("/create-stay-only", adminAuth, (req, res) => {
  res.render("create-stay-only.ejs");
});

export default pageRoutes;
