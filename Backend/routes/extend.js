const express = require('express');
const router = express.Router();
const connection = require('../config/db');

// 🟢 Extend booking and reset reservation time
router.put('api/reservations/extend/:id', (req, res) => {
  const bookingId = req.params.id;
  const newReservationTime = new Date(); // Current time

  const updateQuery = `
    UPDATE reservations 
    SET reservation_time = ?, remaining_time = 120
    WHERE id = ? AND active_state = 1 AND status = 1
  `;

  connection.query(updateQuery, [newReservationTime, bookingId], (err, result) => {
    if (err) {
      console.error(`❌ Error extending reservation ID ${bookingId}:`, err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }

    if (result.affectedRows === 0) {
      console.warn(`⚠ No active booking found for ID ${bookingId}`);
      return res.status(404).json({ success: false, message: 'Booking not found or already inactive' });
    }

    console.log(`✅ Booking ID ${bookingId} extended successfully.`);
    res.json({ success: true, message: 'Booking extended successfully' });
  });
});

module.exports = router;
