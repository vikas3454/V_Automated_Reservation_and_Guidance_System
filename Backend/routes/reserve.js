const express = require('express');
const router = express.Router();
const connection = require('../config/db');

// GET /reserve - Retrieve the latest active reservation
router.get('/reserve', (req, res) => {
  const query = `
    SELECT reservation_id, user_id, slot_id, area_id, vehicle_number, 
           location, active_state, reservation_time, status
    FROM reservations
    WHERE active_state = 1
    ORDER BY reservation_time DESC
    LIMIT 1;
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching reservations:', err);
      return res.status(500).json({ error: 'Error fetching reservations' });
    }

    if (results.length === 0) {
      console.log('No active reservations found.');
      return res.status(404).json({ message: 'No active reservations found' });
    }

    const reservation = results[0];
    const reservationTime = new Date(reservation.reservation_time);
    const currentTime = new Date();
    const remainingTime = Math.max(0, 3600000 - (currentTime - reservationTime)); // 1-hour reservation slot

    console.log('Active reservation found:', reservation);
    console.log('Remaining time for reservation:', remainingTime);

    res.status(200).json({
      active: true,
      reservation,
      remainingTime,
    });
  });
});

// POST /reserve - Create a new reservation
router.post('/reserve', (req, res) => {
  const { slot, location, vehicleNumber, user_id, status } = req.body;

  console.log('Received reservation request:', req.body);

  const reservationStatus = status ? 1 : 0; // 1 if payment is successful, 0 otherwise
  console.log('Payment Success:', status, 'Setting reservation status to:', reservationStatus);

  if (reservationStatus === 1) {
    // Check if slot is available only if payment is successful
    const checkSlotQuery = `
      SELECT * FROM parkingslots 
      WHERE slot_id = ? AND area_id = ? AND status = 0;
    `;

    connection.query(checkSlotQuery, [slot.slot_id, slot.area_id], (err, results) => {
      if (err) {
        console.error('Error checking slot availability:', err);
        return res.status(500).json({ error: 'Error checking slot availability' });
      }

      if (results.length === 0) {
        console.log('Slot not found or already reserved.');
        return res.status(404).json({ error: 'Slot not found or already reserved' });
      }

      createReservation(reservationStatus);
    });
  } else {
    // Directly create reservation if payment failed (status = 0)
    createReservation(reservationStatus);
  }

  function createReservation(status) {
    const insertReservationQuery = `
      INSERT INTO reservations (user_id, slot_id, area_id, vehicle_number, location, active_state, reservation_time, status)
      VALUES (?, ?, ?, ?, ?, 1, NOW(), ?);
    `;

    connection.query(
      insertReservationQuery,
      [user_id, slot.slot_id, slot.area_id, vehicleNumber, location, status],
      (err, result) => {
        if (err) {
          console.error('Error reserving the slot:', err);
          return res.status(500).json({ error: 'Error reserving the slot' });
        }

        console.log('Reservation created successfully:', result.insertId);

        if (status === 1) {
          // Update slot status only if payment is successful
          const updateSlotQuery = `
            UPDATE parkingslots
            SET status = 1
            WHERE slot_id = ? AND area_id = ?;
          `;

          connection.query(updateSlotQuery, [slot.slot_id, slot.area_id], (err, updateResult) => {
            if (err) {
              console.error('Error updating slot status:', err);
              return res.status(500).json({ error: 'Error updating slot status' });
            }

            console.log('Slot status updated successfully');
            
            // Update the reservation status to 1 (payment successful)
            const updateReservationStatusQuery = `
              UPDATE reservations
              SET status = 1
              WHERE id = ?;
            `;

            connection.query(updateReservationStatusQuery, [result.insertId], (err, updateReservationResult) => {
              if (err) {
                console.error('Error updating reservation status:', err);
                return res.status(500).json({ error: 'Error updating reservation status' });
              }

              console.log('Reservation status updated successfully');
              res.status(201).json({ message: 'Reservation successful', reservationId: result.insertId });
            });
          });
        } else {
          // If payment failed, do not update slot status
          console.log('Payment failed, slot status remains unchanged.');
          res.status(201).json({ message: 'Reservation stored, payment failed', reservationId: result.insertId });
        }
      }
    );
  }
});

module.exports = router;
