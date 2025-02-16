const express = require("express");
const router = express.Router();
const connection = require("../config/db"); // Adjust the path to your dbConnection.js

// Route to fetch parking locations and slot statuses
router.get("/locations", (req, res) => {
  const query = `
    SELECT 
      ParkingAreas.area_id AS area_id, 
      ParkingAreas.name AS area_name,
      ParkingAreas.total_slots AS Total,
      COUNT(CASE WHEN ParkingSlots.status = 2 THEN 1 END) AS vacant,
      COUNT(CASE WHEN ParkingSlots.status = 0 THEN 1 END) AS occupied,
      COUNT(CASE WHEN ParkingSlots.status = 1 THEN 1 END) AS reserved
    FROM 
      ParkingAreas
    LEFT JOIN 
      ParkingSlots 
    ON 
      ParkingAreas.area_id = ParkingSlots.area_id
    GROUP BY 
      ParkingAreas.area_id, ParkingAreas.name;
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching locations:", err);
      res.status(500).json({ error: "Database error while fetching locations" });
      return;
    }

    const locations = results.map((row) => ({
      id: row.area_id,
      name: row.area_name,
      total:row.Total,
      vacant: row.vacant || 0,
      occupied: row.occupied || 0,
      reserved: row.reserved || 0,
    }));

    res.json(locations);
    console.log(locations);
  });
});

module.exports = router;
