import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import './ActiveBookingsPage.css';


const ActiveBookings = () => {
  const [activeBookings, setActiveBookings] = useState([]);
  const navigate = useNavigate();
  const MAX_TIME = 1800; // 30 minutes default remaining time
  const PRICE_PER_MINUTE = 2; // ₹2 per minute

  useEffect(() => {
    const fetchActiveBookings = async () => {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
  
      if (!token || !userId) {
        navigate("/login");
        return;
      }
  
      try {
        const response = await axios.get(
          `http://localhost:5000/activebooking?userId=${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
  
        if (Array.isArray(response.data)) {
          const bookingsWithTimers = response.data.map((booking) => {
            let parkedTimeInSeconds = 0;
  
            if (booking.status === 2 && booking.parked_time) {
              const parkedTimeDate = new Date(booking.parked_time); // Convert to Date
              const currentTime = new Date(); // Current time
              parkedTimeInSeconds = Math.floor((currentTime - parkedTimeDate) / 1000); // Difference in seconds
            }
  
            return {
              ...booking,
              remainingTime: booking.remaining_time || MAX_TIME,
              parkedTime: booking.status === 2 ? parkedTimeInSeconds : 0,
            };
          });
  
          setActiveBookings(bookingsWithTimers);
          console.log("Processed bookings:", bookingsWithTimers);
        } else {
          console.error("❌ Invalid response format:", response.data);
        }
      } catch (error) {
        console.error("❌ Error fetching active bookings:", error);
      }
    };
  
    fetchActiveBookings();
  }, [navigate]);  

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBookings((prevBookings) =>
        prevBookings.map((booking) => {
          if (booking.status === 1 && booking.remainingTime > 0) {
            return { ...booking, remainingTime: booking.remainingTime - 1 };
          } else if (booking.status === 2) {
            return { ...booking, parkedTime: booking.parkedTime + 1 };
          }
          return booking;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ⬇ API to update reservation status in the backend
  const updateReservationStatus = async (bookingId) => {
    try {
      await axios.put(`http://localhost:5000/updateReservation/${bookingId}`, {
        status: 0, // Set status to 0 when time expires
      });
    } catch (error) {
      console.error('❌ Error updating reservation status:', error);
    }
  };

  const handleExtend = async (bookingId) => {
    try {
      const response = await axios.post('http://localhost:5000/routes/payment', {
        amount: 3000, // ₹30 in paise
      });
  
      const { order_id } = response.data;
  
      // Check if Razorpay script is available
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => initiatePayment(order_id, bookingId);
        document.body.appendChild(script);
      } else {
        initiatePayment(order_id, bookingId);
      }
    } catch (error) {
      console.error('❌ Error initiating payment:', error);
      alert('Error initiating payment. Please try again.');
    }
  };
  
  const initiatePayment = (order_id, bookingId) => {
    const options = {
      key: 'rzp_test_LvN2Or4O5JP9tu',
      amount: 3000,
      currency: 'INR',
      name: 'Parking Reservation',
      description: `Payment for extending booking ${bookingId}`,
      order_id,
      handler: async (paymentResponse) => {
        try {
          const extendResponse = await axios.put(
            `http://localhost:5000/activebooking/extend/${bookingId}`
          );
  
          if (extendResponse.data.success) {
            setActiveBookings((prevBookings) =>
              prevBookings.map((booking) =>
                booking.id === bookingId
                  ? { ...booking, remainingTime: extendResponse.data.new_remaining_time}
                  : booking
              )
            );
          } else {
            console.error('❌ Failed to extend booking:', extendResponse.data);
          }
        } catch (error) {
          console.error('❌ Error extending the booking:', error);
        }
      },
      prefill: {
        name: 'User Name', // Replace with actual user data if available
        email: 'user@example.com',
      },
      theme: { color: '#3399cc' },
    };
  
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      console.error('Payment failed:', response.error);
      alert('Payment failed. Please try again.');
    });
  
    rzp.open();
  };
  
  
  

  const handleCancel = async (bookingId) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/reservations/cancel/${bookingId}`, {
        status: 0, // Set status to canceled
      });
  
      if (response.data.success) {
        setActiveBookings((prevBookings) => prevBookings.filter((booking) => booking.id !== bookingId));
        alert('Booking canceled. You will receive your refund in 5 working days.');
      } else {
        console.error('❌ Failed to cancel booking:', response.data);
        alert('Failed to cancel the booking. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error canceling the booking:', error);
      alert('Error canceling booking. Please try again.');
    }
  };
  

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

//const DEFAULT_MAP_LINK = "https://maps.app.goo.gl/nYzzBJPXvH3m9mZSA";

const handleViewMap = () => {
  window.open("https://www.google.com/maps/dir/?api=1&destination=12.9716,77.5946&travelmode=driving", "_blank");
};
const handlePayment = async (bookingId, price) => {
  try {
    const response = await axios.post('http://localhost:5000/routes/payment', {
      amount: price * 100, // Convert ₹ to paise
    });

    const { order_id } = response.data;

    // Check if Razorpay script is available
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => hinitiatePayment(order_id, bookingId, price);
      document.body.appendChild(script);
    } else {
      hinitiatePayment(order_id, bookingId, price);
    }
  } catch (error) {
    console.error('❌ Error initiating payment:', error);
    alert('Error initiating payment. Please try again.');
  }
};

const hinitiatePayment = (order_id, bookingId, price) => {
  const options = {
    key: 'rzp_test_LvN2Or4O5JP9tu',
    amount: price * 100, // Convert ₹ to paise
    currency: 'INR',
    name: 'Parking Reservation',
    description: `Payment for booking ${bookingId}`,
    order_id,
    handler: async (paymentResponse) => {
      try {
        // ✅ Update reservations table with payment status and status=4
        const paymentUpdate = await axios.put(
          `http://localhost:5000/activebooking/checkoutpayment/${bookingId}`,
          { payment: "success", status: 4 }
        );

        if (paymentUpdate.data.success) {
          setActiveBookings((prevBookings) =>
            prevBookings.map((booking) =>
              booking.id === bookingId
                ? { ...booking, status: 4, payment: "success" }
                : booking
            )
          );
          alert('✅ Payment successful! You can checkout');
          window.location.reload()
          navigate('/dashboard');
        } else {
          console.error('❌ Failed to update payment status:', paymentUpdate.data);
        }
      } catch (error) {
        console.error('❌ Error updating payment status:', error);
      }
    },
    prefill: {
      name: 'User Name',
      email: 'user@example.com',
    },
    theme: { color: '#3399cc' },
  };

  const rzp = new window.Razorpay(options);
  rzp.on('payment.failed', function (response) {
    console.error('❌ Payment failed:', response.error);
    alert('❌ Payment failed. Please try again.');
  });

  rzp.open();
};




return (
  <div className="active-bookings-container">
    <h2>Active Bookings</h2>
    {activeBookings.length === 0 ? (
      <p>No active bookings</p>
    ) : (
      activeBookings.map((booking) => (
        <div key={booking.id} className="active-booking-card">
          <div className="active-booking-details">
            <h3>Booking ID: {booking.id}</h3>
            <p><strong>Slot:</strong> {booking.slot_id || 'N/A'}</p>
            <p><strong>Location:</strong> {booking.location || 'N/A'}</p>
            <p><strong>Vehicle:</strong> {booking.vehicle_number || 'N/A'}</p>
          </div>
          <div className="active-booking-timer">
  {booking.status === 2 ? (
    // 🅿️ **Vehicle Parked View (Status = 2)**
    <div className="parked-time-container">
      <CircularProgressbar
        value={(booking.parkedTime % MAX_TIME) / MAX_TIME * 100}
        text={formatTime(booking.parkedTime)}
        styles={buildStyles({
          textSize: '18px',
          pathColor: '#007bff',
          textColor: '#333',
          trailColor: '#f0f0f0',
        })}
      />
      <button className="price-button">Price: ₹{booking.price}</button>
    </div>
  ) : booking.status === 3 ? (
    // 🚗 **Vehicle Left View (Status = 3)**
    <div className="payment-container">
      <p>Total Time: {formatTime(booking.parked_time)}</p>
      <p>Total Price: ₹{booking.price}</p>
      <button className="pay-button" onClick={() => handlePayment(booking.id, booking.price)}>Pay Now</button>
    </div>
            ) : (
              <CircularProgressbar
                value={(booking.remainingTime / MAX_TIME) * 100}
                text={formatTime(booking.remainingTime)}
                styles={buildStyles({
                  textSize: '18px',
                  pathColor: booking.remainingTime > 300 ? '#28a745' : '#dc3545',
                  textColor: '#333',
                  trailColor: '#f0f0f0',
                })}
              />
            )}
          </div>
          <div className="active-booking-actions">
            {booking.status !== 2 && booking.status!==3 && (
              <>
                <button className="active-booking-extend-btn" onClick={() => handleExtend(booking.id)}>Extend</button>
                <button className="active-booking-cancel-btn" onClick={() => handleCancel(booking.id)}>Cancel</button>
              </>
            )}
            <button className="active-booking-map-btn" onClick={() => handleViewMap(booking.map_link)}>View Map</button>
          </div>
        </div>
      ))
    )}
  </div>
);
};

export default ActiveBookings;
