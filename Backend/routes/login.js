const express = require("express");
const jwt = require("jsonwebtoken");
const connection = require("../config/db"); // Use your existing database connection
require('dotenv').config(); // Load environment variables from .env file

const router = express.Router();

// Login Route
router.post("/login", (req, res) => {
  const { identifier, password } = req.body;

  // Check if the identifier is an email or mobile number
  let query;
  if (identifier.includes("@")) {
    query = "SELECT * FROM users WHERE email = ?";
  } else {
    query = "SELECT * FROM users WHERE mobile = ?";
  }

  connection.query(query, [identifier], (err, rows) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: "Something went wrong." });
    }

    if (rows.length === 0) {
      return res.status(400).json({ error: "Invalid credentials." });
    }

    const user = rows[0];

    // Directly compare the password (in plaintext)
    if (user.password !== password) {
      return res.status(400).json({ error: "Invalid credentials." });
    }

    // If login is successful, create a JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Return the JWT token in the response
    return res.status(200).json({ message: "Login successful!", token });
  });
});

// Profile Route (fetch user data using JWT)
router.get("/profile", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Get token after "Bearer "

  if (!token) {
    return res.status(401).json({ error: "No token provided." });
  }

  // Verify the JWT token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: "Token has expired." });
      }
      return res.status(401).json({ error: "Invalid token." });
    }

    const userId = decoded.userId;

    // Fetch user data from DB
    connection.query("SELECT * FROM users WHERE id = ?", [userId], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Something went wrong." });
      }

      if (rows.length === 0) {
        return res.status(404).json({ error: "User not found." });
      }

      const user = rows[0];
      return res.status(200).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          VehicleNumber1: user.vehicle_number1,
          VehicleNumber2: user.vehicle_number2,
          VehicleNumber3: user.vehicle_number3,

        }
      });
    });
  });
});

module.exports = router;
