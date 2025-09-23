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
export default pageRoutes;
