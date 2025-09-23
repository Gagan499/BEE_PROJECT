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
  //insert data retrieval and preparation logic here
  res.render("admin.ejs");
});

pageRoutes.get("/book", (req, res) => {
  //insert data retrieval and preparation logic here
  res.render("booking.ejs");
});
export default pageRoutes;
