import express from "express";
import Booking from "../../models/booking.js";

const pageRoutes = express.Router();

pageRoutes.get('/abput',(req,res)=>{
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

pageRoutes.get("/user", async (req, res) => {
  try {
    const docs = await Booking.find({}).sort({ createdAt: -1 }).lean();
    const fmt = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "-");
    const bookings = docs.map((b, i) => ({
      _id: b._id.toString(),
      idx: i + 1,
      title: b.hotelName || b.packageName || "Booking",
      name: b.name,
      location: b.location || "-",
      arrival: fmt(b.arrivalDate),
      departure: fmt(b.departureDate),
      status: b.status || "pending",
      // full details for view-only modal
      phoneNumber: b.phoneNumber || "",
      email: b.email || "",
      bookingType: b.bookingType || "package",
      packageName: b.packageName || "",
      hotelName: b.hotelName || "",
      adults: b.adults || 1,
      children: b.children || 0,
      arrivalISO: fmt(b.arrivalDate),
      departureISO: fmt(b.departureDate),
    }));
    res.render("user.ejs", { bookings });
  } catch (err) {
    console.error("Failed to load user bookings:", err);
    res.render("user.ejs", { bookings: [] });
  }
});

pageRoutes.get("/admin", async (req, res) => {
  try {
    const docs = await Booking.find({}).sort({ createdAt: -1 }).lean();
    const toCss = (s) => (s === 'approved' ? 'approve' : s === 'rejected' ? 'reject' : 'pending');
    const bookings = docs.map(b => ({
      _id: b._id.toString(),
      name: b.name,
      location: b.location || "-",
      date: b.arrivalDate ? new Date(b.arrivalDate).toISOString().slice(0,10) : "-",
      status: b.status || "pending",
      cssStatus: toCss(b.status || 'pending'),
    }));
    res.render("admin.ejs", { bookings });
  } catch (err) {
    console.error("Failed to load bookings:", err);
    res.render("admin.ejs", { bookings: [] });
  }
});

pageRoutes.get("/book", (req, res) => {
  //insert data retrieval and preparation logic here
  res.render("booking.ejs");
});

pageRoutes.get("/packages", (req, res) => {
  // Sample package data for demonstration
  const packages = [
    {
      title: "The Bali Package",
      days: 4,
      nights: 4,
      img: "/assets/images/carousel/bali.png",
      desc: "Experience the beautiful beaches and rich culture of Bali with our comprehensive 4-day package."
    },
    {
      title: "Jaipur Heritage Tour",
      days: 3,
      nights: 3,
      img: "/assets/images/carousel/jaipur.png",
      desc: "Explore the pink city's magnificent palaces, forts, and vibrant markets in this cultural journey."
    },
    {
      title: "Los Angeles Adventure",
      days: 5,
      nights: 5,
      img: "/assets/images/carousel/la.png",
      desc: "Discover the city of angels with Hollywood tours, beach visits, and theme park adventures."
    },
    {
      title: "Maldives Paradise",
      days: 6,
      nights: 6,
      img: "/assets/images/carousel/maldives.png",
      desc: "Relax in overwater bungalows and enjoy crystal clear waters in this tropical paradise."
    },
    {
      title: "Switzerland Alpine Experience",
      days: 7,
      nights: 7,
      img: "/assets/images/carousel/switzerland.png",
      desc: "Journey through the Swiss Alps with scenic train rides and breathtaking mountain views."
    },
    {
      title: "Dubai Luxury Escape",
      days: 4,
      nights: 4,
      img: "/assets/images/AdobeStock_601264716_Preview.png",
      desc: "Experience luxury shopping, desert safaris, and world-class dining in the UAE."
    }
  ];
  
  res.render("packages.ejs", { packages });
});

export default pageRoutes;
