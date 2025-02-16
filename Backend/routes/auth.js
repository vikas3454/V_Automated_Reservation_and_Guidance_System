const express = require("express");
const router = express.Router();
const db = require('../config/db');
const crypto = require("crypto");
const path = require("path");
const nodemailer = require("nodemailer");
router.use('/logo', express.static(path.join(__dirname)));

// Send OTP Endpoint
router.post("/send-otp", async (req, res) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const otp = crypto.randomInt(100000, 999999); // Generate a 6-digit OTP
  const expires = Date.now() + 5 * 60 * 1000; // OTP expires in 5 minutes

  // Store OTP and expiry in the database
  const query = "INSERT INTO otp_verifications (email, otp, expires) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE otp = ?, expires = ?";
  db.query(query, [email, otp, expires, otp, expires], (err, result) => {
    if (err) {
      console.error("Error inserting OTP:", err);
      return res.status(500).json({ error: "Failed to store OTP. Try again later." });
    }

    // Configure nodemailer to send OTP
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "vemulavikas679@gmail.com", // Your email
        pass: "vjzw boca bnlr kjuu", // Your application-specific password
      },
    });

    const mailOptions = {
      from: "vemulavikas679@gmail.com",
      to: email,
      subject: "Your One-Time Password (OTP) for Smart Parking Registration",
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f7f7f7; color: #333; text-align: center; padding: 20px;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
              <img src="http://localhost:5000/routes/logo.webp" alt="Smart Parking Logo" style="width: 200px; margin-bottom: 20px;" />
              <h2 style="color: #007bff;">Hello, ${name}</h2>
              <p>Thank you for choosing <strong>Smart Parking</strong>! We’re excited to help you with a seamless parking experience.</p>
              <p>To complete your registration, please use the following One-Time Password (OTP):</p>
              <h3 style="background-color: #007bff; color: #ffffff; padding: 10px 20px; display: inline-block; border-radius: 5px;">${otp}</h3>
              <p>This OTP is valid for <strong>5 minutes</strong> from the time of this email.</p>
              <p><a href="your-otp-verification-url" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Now</a></p>
              <p>If you did not request this OTP, please ignore this email or contact our support team at <a href="mailto:support@smartparking.com">support@smartparking.com</a>.</p>
              <footer style="margin-top: 20px; text-align: center; font-size: 12px;">
                <p>Best regards, <br> The Smart Parking Team</p>
                <p><a href="https://www.smartparking.com/privacy" style="color: #007bff;">Privacy Policy</a> | <a href="https://www.smartparking.com" style="color: #007bff;">Visit Our Website</a></p>
              </footer>
            </div>
          </body>
        </html>
      `,
    };

    // Send OTP email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending OTP email:", error);
        return res.status(500).json({ error: "Failed to send OTP email." });
      }
      res.json({ message: "OTP sent successfully." });
    });
  });
});

// Verify OTP Endpoint
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  // Retrieve OTP from the database
  const query = "SELECT otp, expires FROM otp_verifications WHERE email = ?";
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error("Error retrieving OTP:", err);
      return res.status(500).json({ error: "Failed to retrieve OTP. Try again later." });
    }

    if (results.length === 0) return res.status(400).json({ error: "OTP not found for this email." });

    const storedOtp = results[0];
    if (storedOtp.expires < Date.now()) return res.status(400).json({ error: "OTP has expired." });
    if (storedOtp.otp !== parseInt(otp)) return res.status(400).json({ error: "Invalid OTP." });

    // OTP verified, update email_verified in the database
    const updateQuery = "UPDATE users SET email_verified = true WHERE email = ?";
    db.query(updateQuery, [email], (err, result) => {
      if (err) {
        console.error("Error updating email verification:", err);
        return res.status(500).json({ error: "Failed to update email verification." });
      }

      console.log("Email verification updated successfully for:", email);

      // Delete OTP record after successful verification
      const deleteQuery = "DELETE FROM otp_verifications WHERE email = ?";
      db.query(deleteQuery, [email], (err, result) => {
        if (err) {
          console.error("Error deleting OTP record:", err);
        }
      });

      res.json({ message: "Email verified successfully." });
    });
  });
});

// Store Signup Data
router.post("/signup", (req, res) => {
  const { name, email, password, mobile, vehicleNumber1, vehicleNumber2, vehicleNumber3 } = req.body;
  console.log(name);
  console.log(vehicleNumber1);
  console.log(vehicleNumber2);
  console.log(vehicleNumber3);
  // Validate required fields
  if (!name || !email || !password || !mobile || !vehicleNumber1) {
    return res.status(400).json({ error: "Name, email, password, mobile, and at least one vehicle number are required." });
  }

  // Check if the email already exists
  const checkEmailQuery = "SELECT * FROM users WHERE email = ?";
  db.query(checkEmailQuery, [email], (err, results) => {
    if (err) {
      console.error("Error checking email existence:", err);
      return res.status(500).json({ error: "Failed to check email existence." });
    }

    if (results.length > 0) {
      // Email already exists, check if it is verified
      const user = results[0];
      if (user.email_verified) {
        return res.status(400).json({ error: "Email already exists and is verified." });
      } else {
        return res.status(400).json({ error: "Email is not verified. Please verify your email first." });
      }
    }

    // Proceed with registration if the email does not exist
    const query = `
      INSERT INTO users 
      (name, email, password, mobile, email_verified, vehicle_number1, vehicle_number2, vehicle_number3) 
      VALUES (?, ?, ?, ?, false, ?, ?, ?)
    `;

    // Handle the optional vehicle numbers, ensure they are either the value or null if not provided
    db.query(
      query,
      [
        name,
        email,
        password,
        mobile,
        vehicleNumber1,
        vehicleNumber2 || null, // If vehicle_number2 is not provided, set it to null
        vehicleNumber3 || null  // If vehicle_number3 is not provided, set it to null
      ],
      (err, result) => {
        if (err) {
          console.error("Error inserting data:", err);
          return res.status(500).json({ error: "Failed to register user." });
        }

        console.log("User registered successfully:", name);
        res.json({ message: "User registered successfully." });
      }
    );
  });
});

module.exports = router;
