const express = require("express");
const router = express.Router();
const connection = require("../config/db"); // Assuming db connection setup is in db.js

// Route to fetch parking slots for a specific parking area
router.get("/:areaId", (req, res) => {
  const areaId = req.params.areaId;

  // Query to get the total slots and the slot details for the specific parking area
  const query = `
    SELECT 
      ParkingSlots.slot_id AS id, 
      ParkingSlots.status AS state, 
      CONCAT('S', ParkingSlots.slot_id) AS name
    FROM 
      ParkingSlots
    WHERE 
      ParkingSlots.area_id = ?
  `;

  connection.query(query, [areaId], (err, results) => {
    if (err) {
      console.error("Error fetching slot details:", err);
      res.status(500).json({ error: "Database error while fetching slot details" });
      return;
    }

    // Mapping the data to the format expected by the frontend
    const slots = results.map((row) => ({
      id: row.id,
      name: row.name,
      state: row.state, // 0 for Available, 1 for Reserved, 2 for Occupied
    }));

    // Get the total number of slots
    const totalSlots = slots.length;

    // Send back both totalSlots and slot data to the frontend
    res.json({
      totalSlots: totalSlots,
      slots: slots,
    });
  });
});

module.exports = router;
