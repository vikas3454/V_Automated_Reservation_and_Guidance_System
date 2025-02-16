import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ReservationPage.css';

const ReservationPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  let reservationAttempted = false; // Prevent duplicate reservations

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get('http://localhost:5000/routes/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data.user);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError('Failed to fetch user profile. Please try again.');
        navigate('/login');
      }
    };

    fetchUserProfile();
  }, [navigate]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  if (!state || !state.slot || !state.location) {
    return <div>Loading slot details...</div>;
  }

  const { slot, location } = state;

  const handlePayment = async () => {
    try {
      setPaymentProcessing(true);
      setError('');
      reservationAttempted = false; // Reset flag before payment attempt

      const response = await axios.post('http://localhost:5000/routes/payment', {
        amount: 3000,
      });

      const { order_id } = response.data;

      const options = {
        key: 'rzp_test_LvN2Or4O5JP9tu',
        amount: 3000,
        currency: 'INR',
        name: 'Parking Reservation',
        description: `Payment for slot ${slot.name}`,
        order_id,
        handler: async (response) => {
          if (!reservationAttempted) {
            reservationAttempted = true;
            await handleSubmit(response.razorpay_payment_id, true);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: { color: '#3399cc' },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        setError('Payment failed. You can try again or proceed without payment.');

        if (!reservationAttempted) {
          reservationAttempted = true;
          handleSubmit(null, false);
        }
      });

      rzp.open();
    } catch (error) {
      console.error('Error initiating payment:', error);
      setError('Payment initiation failed. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleSubmit = async (paymentId, paymentSuccess) => {
    if (!vehicleNumber) {
      setError('Please select a vehicle.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const reservationData = {
        user_id: user.id,
        slot: {
          slot_id: slot.id,
          area_id: location.id,
        },
        location: location.name,
        vehicleNumber,
        paymentId,
        status: paymentSuccess ? 1 : 0, // 1 for success, 0 for failure
      };

      const response = await axios.post(
        'http://localhost:5000/api/reservations/reserve',
        reservationData
      );

      if (response.status === 201) {
        alert(paymentSuccess ? 'Reservation and payment successful!' : 'Reservation stored, payment failed.');
        
        // Redirect to ActiveBookingPage after successful payment
        if (paymentSuccess) {
          navigate('/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError('Failed to store reservation in the database.');
      }
    } catch (error) {
      console.error('Error during reservation:', error);
      setError(error.response?.data?.error || 'Error during reservation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reservation-page">
      <h2>Reserve Slot {slot.name} at {location.name}</h2>
      <div className="reservation-box">
        {user ? (
          <div className="user-info">
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </div>
        ) : (
          <div>Loading user data...</div>
        )}

        <div className="slot-location-info">
          <p><strong>Slot Location:</strong> {location.name}</p>
          <p><strong>Slot Number:</strong> {slot.name}</p>
        </div>

        {user && (
          <div>
            <label htmlFor="vehicleNumber">Select Vehicle</label>
            <select
              id="vehicleNumber"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              disabled={isLoading || paymentProcessing}
            >
              <option value="">--Select Vehicle--</option>
              {user.VehicleNumber1 && <option value={user.VehicleNumber1}>{user.VehicleNumber1}</option>}
              {user.VehicleNumber2 && <option value={user.VehicleNumber2}>{user.VehicleNumber2}</option>}
              {user.VehicleNumber3 && <option value={user.VehicleNumber3}>{user.VehicleNumber3}</option>}
            </select>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <button onClick={handlePayment} disabled={isLoading || paymentProcessing}>
          {paymentProcessing ? 'Processing Payment...' : 'Pay and Reserve'}
        </button>
      </div>
    </div>
  );
};

export default ReservationPage;
