const express = require("express");
const router = express.Router();
const connection = require("../config/db"); // Import MySQL connection

// Get Profile
router.get("/eprofile/:userId", (req, res) => {
  const userId = req.params.userId;

  const query = "SELECT name, email, mobile, vehicle_number1, vehicle_number2, vehicle_number3 FROM users WHERE id = ?";
  
  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching user profile:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: results[0] });
  });
});

// Update Profile
router.put("/update-profile/:userId", (req, res) => {
  const { userId } = req.params;
  const { name, email, mobile, vehicle_number1, vehicle_number2, vehicle_number3 } = req.body;

  const sql = `
    UPDATE users 
    SET name = ?, email = ?, mobile = ?, vehicle_number1 = ?, vehicle_number2 = ?, vehicle_number3 = ? 
    WHERE id = ?`;

  connection.query(
    sql,
    [name, email, mobile, vehicle_number1, vehicle_number2, vehicle_number3, userId],
    (err, result) => {
      if (err) {
        console.error("Error updating profile:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "User not found or no changes made" });
      }
      res.json({ message: "Profile updated successfully" });
    }
  );
});

module.exports = router;
