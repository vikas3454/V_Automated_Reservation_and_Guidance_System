const connection = require("../config/db");
const { sendEmail } = require("../utils/emailService");
const { generateOtp } = require("../utils/otpGenerator");

// Function to send OTP to the user
exports.sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

  const query = `
    INSERT INTO users (email, otp, otp_expiry)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE otp = ?, otp_expiry = ?
  `;

  connection.query(query, [email, otp, otpExpiry, otp, otpExpiry], async (err) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    try {
      await sendEmail(email, "Your OTP for Signup", `Your OTP is ${otp}. It expires in 5 minutes.`);
      return res.status(200).json({ message: "OTP sent successfully" });
    } catch (emailErr) {
      console.error("Email sending error:", emailErr);
      return res.status(500).json({ error: "Failed to send OTP" });
    }
  });
};

// Function to verify the OTP provided by the user
exports.verifyOtp = (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  const query = "SELECT otp, otp_expiry FROM users WHERE email = ?";
  connection.query(query, [email], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "No OTP found for the provided email" });
    }

    const storedOtp = results[0].otp;
    const otpExpiry = results[0].otp_expiry;

    if (!storedOtp || new Date() > new Date(otpExpiry)) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    if (storedOtp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    const updateQuery = `
      UPDATE users
      SET otp = NULL, otp_expiry = NULL, email_verified = TRUE
      WHERE email = ?
    `;
    connection.query(updateQuery, [email], (updateErr) => {
      if (updateErr) {
        console.error("Database error:", updateErr);
        return res.status(500).json({ error: "Database error" });
      }
      return res.status(200).json({ message: "Email verified successfully" });
    });
  });
};
