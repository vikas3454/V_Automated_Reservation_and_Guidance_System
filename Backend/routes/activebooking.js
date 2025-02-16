const express = require('express');
const router = express.Router();
const connection = require('../config/db');
const PRICE_PER_MINUTE = 2; // ₹2 per minute
console.log("✅ Active bookings route loaded!");

// 🟢 Fetch active bookings for a user
router.get('/activebooking', (req, res) => {
  console.log("🚀 Received request on /activebooking");

  const userId = req.query.userId;
  console.log("🔍 Extracted userId:", userId);

  if (!userId) {
  console.error("❌ Missing userId in request!");
  return res.status(400).json({ error: 'User ID is required' });
}

console.log('📌 Fetching active bookings for userId:', userId);

const query = `
  SELECT id, slot_id, area_id, location, vehicle_number, remaining_time, status 
  FROM reservations 
  WHERE active_state = 1 AND (status=1 OR status=2 or status=3) AND user_id = ?
`;

connection.query(query, [userId], (err, reservations) => {
  if (err) {
    console.error('❌ Error fetching active bookings:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }

  console.log('✅ Active bookings fetched:', reservations.length, "records");

  const updatePromises = reservations.map((booking) => {
    return new Promise((resolve, reject) => {
      const checkParkedQuery = `SELECT parked_time, status FROM parkingslots WHERE slot_id = ? AND area_id = ?`;

      connection.query(checkParkedQuery, [booking.slot_id, booking.area_id], (err, slotResults) => {
        if (err) {
          console.error(`❌ Error checking parking status for slot ${booking.slot_id}:`, err);
          return reject(err);
        }

        if (slotResults.length > 0) {
          const slotStatus = slotResults[0].status;

          if (slotStatus === 2) { 
            // Vehicle is parked
            console.log(slotStatus);
            const parkedTime = new Date(slotResults[0].parked_time);
            const currentTime = new Date();
            const durationMinutes = Math.floor((currentTime - parkedTime) / (1000 * 60));
            const newPrice = durationMinutes * PRICE_PER_MINUTE;

            console.log(`🅿️ Vehicle parked at ${parkedTime} for slot ${booking.slot_id}. Updating reservation status.`);

            const updateReservationQuery = `UPDATE reservations SET status = 2, price = ? WHERE id = ?`;
            connection.query(updateReservationQuery, [newPrice, booking.id], (updateErr) => {
              if (updateErr) {
                console.error(`❌ Error updating reservation for booking ID ${booking.id}:`, updateErr);
                return reject(updateErr);
              }
              resolve({ ...booking, status: 2, parked_time: parkedTime, price: newPrice });
            });

          } else if (slotStatus === 0) { 
            // Vehicle has left
            const parkedTime = new Date(slotResults[0].parked_time);
            const currentTime = new Date();
            const totalMinutes = Math.floor((currentTime - parkedTime) / (1000 * 60));
            const totalPrice = totalMinutes * PRICE_PER_MINUTE;

            console.log(`🚗 Vehicle left from slot ${booking.slot_id}. Updating reservation status to 3.`);

            const updateReservationQuery = `UPDATE reservations SET status = 3, price = ? WHERE id = ?`;
            connection.query(updateReservationQuery, [totalPrice, booking.id], (updateErr) => {
              if (updateErr) {
                console.error(`❌ Error updating reservation for booking ID ${booking.id}:`, updateErr);
                return reject(updateErr);
              }
              resolve({ ...booking, status: 3, parked_time: totalMinutes, price: totalPrice });
            });

          } else {
            resolve(booking);
          }
        } else {
          const updatedRemainingTime = Math.max(booking.remaining_time - 1, 0);
          const updateQuery = `
            UPDATE reservations 
            SET remaining_time = ?, status = CASE WHEN ? = 0 THEN 0 ELSE status END 
            WHERE id = ?
          `;
          connection.query(updateQuery, [updatedRemainingTime, updatedRemainingTime, booking.id], (updateErr) => {
            if (updateErr) {
              console.error(`❌ Error updating remaining_time for booking ID ${booking.id}:`, updateErr);
              return reject(updateErr);
            }

            if (updatedRemainingTime === 0) {
              console.log(`🔄 Releasing parking slot ${booking.slot_id} in area ${booking.area_id}`);
              const updateSlotQuery = `UPDATE parkingslots SET status = 0 WHERE slot_id = ? AND area_id = ?`;
              connection.query(updateSlotQuery, [booking.slot_id, booking.area_id], (slotErr) => {
                if (slotErr) {
                  console.error(`❌ Error updating parking slot ${booking.slot_id}:`, slotErr);
                  return reject(slotErr);
                }
                console.log(`✅ Parking slot ${booking.slot_id} is now available.`);
                resolve({ ...booking, remaining_time: updatedRemainingTime, status: 0, parked_time: null });
              });
            } else {
              resolve({ ...booking, remaining_time: updatedRemainingTime, parked_time: null });
            }
          });
        }
      });
    });
  });

  Promise.all(updatePromises)
    .then((updatedResults) => {
      console.log("✅ All updates completed.");
      res.json(updatedResults);
    })
    .catch(() => {
      res.status(500).json({ error: "Error updating data in database" });
    });
});
});


// 🔄 Background task to update remaining time and free parking slots every second
setInterval(() => {
  //console.log("🔄 Running automatic booking and parking slot update...");

  const query = `SELECT id, slot_id, area_id, remaining_time FROM reservations WHERE active_state = 1 AND status = 1`;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error fetching active bookings:', err);
      return;
    }

    results.forEach((booking) => {
      const updatedRemainingTime = Math.max(booking.remaining_time - 1, 0);

      console.log(`🕒 Booking ID: ${booking.id}, Remaining Time: ${updatedRemainingTime}`);

      // 🟢 Update remaining time and status
      const updateQuery = `
        UPDATE reservations 
        SET remaining_time = ?, status = CASE WHEN ? = 0 THEN 0 ELSE status END 
        WHERE id = ?`;

      connection.query(updateQuery, [updatedRemainingTime, updatedRemainingTime, booking.id], (updateErr) => {
        if (updateErr) {
          console.error(`❌ Error updating booking ID ${booking.id}:`, updateErr);
        } else {
          console.log(`✅ Booking ID ${booking.id} updated.`);

          if (updatedRemainingTime === 0) {
            // 🟢 Free up the parking slot using area_id
            console.log(`🔄 Attempting to free up parking slot for slot_id: ${booking.slot_id}, area_id: ${booking.area_id}`);

            const updateSlotQuery = `UPDATE parkingslots SET status = 0 WHERE slot_id = ? AND area_id = ?`;
            connection.query(updateSlotQuery, [booking.slot_id, booking.area_id], (slotErr) => {
              if (slotErr) {
                console.error(`❌ Error updating parking slot ${booking.slot_id} in area ${booking.area_id}:`, slotErr);
              } else {
                console.log(`✅ Parking slot ${booking.slot_id} in area ${booking.area_id} is now available.`);
              }
            });
          }
        }
      });
    });
  });
}, 1000); // Runs every second

router.put('/activebooking/extend/:id', (req, res) => {
  const bookingId = req.params.id;
  const updateQuery = `
    UPDATE reservations 
    SET remaining_time = remaining_time+1800
    WHERE id = ? AND active_state = 1 AND status = 1
  `;

  connection.query(updateQuery, [bookingId], (err, result) => {
    if (err) {
      console.error(`❌ Error extending reservation ID ${bookingId}:`, err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }

    if (result.affectedRows === 0) {
      console.warn(`⚠ No active booking found for ID ${bookingId}`);
      return res.status(404).json({ success: false, message: 'Booking not found or already inactive' });
    }

    console.log(`✅ Booking ID ${bookingId} extended successfully.`);
    //res.json({ success: true, message: 'Booking extended successfully' });

    const fetchQuery = `SELECT remaining_time FROM reservations WHERE id = ?`;
    connection.query(fetchQuery, [bookingId], (fetchErr, fetchResult) => {
      if (fetchErr) {
        console.error(`❌ Error fetching updated time for reservation ID ${bookingId}:`, fetchErr);
        return res.status(500).json({ success: false, error: 'Internal server error' });
      }

      if (fetchResult.length === 0) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }

      const newRemainingTime = fetchResult[0].remaining_time;

      console.log(`✅ Booking ID ${bookingId} extended successfully. New remaining time: ${newRemainingTime}`);
      return res.json({ success: true, new_remaining_time: newRemainingTime });
    });
  });
});
//checkout payment
router.put('/activebooking/checkoutpayment/:bookingId', async (req, res) => {
  const { bookingId } = req.params;

  // ✅ Update the reservation: Set payment = 'success' & status = 4
  const updateQuery = `
      UPDATE reservations 
      SET payment_status = 'paid', status = 4 
      WHERE id = ?
  `;

  connection.query(updateQuery, [bookingId], (err, result) => {
      if (err) {
          console.error('❌ Error updating payment status:', err);
          return res.status(500).json({ success: false, message: 'Database error' });
      }

      if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      console.log(`✅ Payment successful for booking ID ${bookingId}.`);
      res.json({ success: true, message: 'Payment successful & status updated' });
  });
});

router.put('/api/reservations/cancel/:bookingId', (req, res) => {
  const { bookingId } = req.params;

  // Retrieve area_id and slot_id before canceling the booking
  const getSlotQuery = `SELECT area_id, slot_id FROM reservations WHERE id = ?`;

  connection.query(getSlotQuery, [bookingId], (err, results) => {
    if (err) {
      console.error('❌ Error fetching booking details:', err);
      return res.status(500).json({ success: false, error: 'Error fetching booking details' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const { area_id, slot_id } = results[0];

    // Cancel the booking by updating the status
    const cancelQuery = `UPDATE reservations SET status = 0 WHERE id = ?`;

    connection.query(cancelQuery, [bookingId], (cancelErr, cancelResult) => {
      if (cancelErr) {
        console.error('❌ Error canceling booking:', cancelErr);
        return res.status(500).json({ success: false, error: 'Error canceling booking' });
      }

      if (cancelResult.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }

      // Update the parking slot to set status = 0
      const updateSlotQuery = `UPDATE parkingslots SET status = 0 WHERE area_id = ? AND slot_id = ?`;

      connection.query(updateSlotQuery, [area_id, slot_id], (slotErr) => {
        if (slotErr) {
          console.error(`❌ Error updating parking slot ${slot_id} in area ${area_id}:`, slotErr);
          return res.status(500).json({ success: false, error: 'Error updating parking slot status' });
        }

        console.log(`✅ Parking slot ${slot_id} in area ${area_id} is now available.`);
        res.json({ success: true, message: 'Booking canceled successfully. You will get your refund in 5 working days.' });
        console.log(`✅ Booking ID ${bookingId} cancelled successfully.`);
      });
    });
  });
});

module.exports = router;
