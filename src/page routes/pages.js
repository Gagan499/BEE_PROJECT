import express from "express";

const pageRoutes = express.Router();

pageRoutes.get("/login", (req, res) => {
  res.render("login.ejs");
});

pageRoutes.get("/user", (req, res) => {
  //insert data retrieval and preparation logic here
  res.render("user.ejs");
});

pageRoutes.get("/admin", (req, res) => {
  // Sample booking data for demonstration
  const bookings = [
    {
      name: "John Doe",
      location: "Dubai",
      date: "2025-10-15",
      status: "pending",
      phone: "+971-50-123-4567",
      email: "john.doe@email.com",
      adults: 2,
      children: 1,
      departureDate: "2025-10-20",
      bookingType: "package",
      packageName: "Dubai Luxury Package",
      hotel: "Burj Al Arab"
    },
    {
      name: "Jane Smith",
      location: "Abu Dhabi",
      date: "2025-11-05",
      status: "approved",
      phone: "+971-50-987-6543",
      email: "jane.smith@email.com",
      adults: 1,
      children: 0,
      departureDate: "2025-11-10",
      bookingType: "stayOnly",
      packageName: "City Break",
      hotel: "Emirates Palace"
    },
    {
      name: "Mike Johnson",
      location: "Sharjah",
      date: "2025-12-01",
      status: "rejected",
      phone: "+971-50-555-1234",
      email: "mike.johnson@email.com",
      adults: 4,
      children: 2,
      departureDate: "2025-12-07",
      bookingType: "package",
      packageName: "Family Adventure",
      hotel: "Coral Beach Resort"
    }
  ];
  
  res.render("admin.ejs", { bookings });
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
