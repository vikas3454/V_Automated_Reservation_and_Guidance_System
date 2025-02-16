import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SlotDetailsPage.css';

const SlotDetailsPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { location, id } = state;

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (location && location.id) {
      const fetchSlots = async () => {
        try {
          const response = await axios.get(`http://localhost:5000/routes/${location.id}`);
          setSlots(response.data.slots);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchSlots();
    }
  }, [location]);

  const getSlotColor = (state) => {
    switch (state) {
      case 0:
        return '#4CAF50'; // Available (Green)
      case 1:
        return '#FFD700'; // Reserved (Yellow)
      case 2:
        return null; // For occupied, render a car icon instead
      case 3:
        return '#FF0000'; // Under Maintenance (Red)
      default:
        return 'lightgrey'; // Default (Grey)
    }
  };

  const handleSlotClick = (slot) => {
    if (slot.state === 0) {
      navigate('/reservation', { state: { location, slot } });
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="slot-details-page">
      <div className="header">
        <h2>Parking Slots at {location.name}</h2>
        <div className="legend">
          <span><div className="legend-box available"></div> Available</span>
          <span><div className="legend-box reserved"></div> Reserved</span>
          <span><div className="legend-box maintenance"></div> Under Maintenance</span>
          <span>🚗 Occupied</span>
        </div>
      </div>

      <div className="slots-grid">
        {slots.length > 0 ? (
          slots.map((slot, index) => (
            <div
              key={index}
              className="slot"
              style={{ backgroundColor: getSlotColor(slot.state) }}
              onClick={() => handleSlotClick(slot)}
            >
              {slot.state === 2 ? (
                <span className="car-icon">🚗</span>
              ) : (
                <>
                  <h3>Slot {slot.id}</h3>
                  <p style={{ color: slot.state === 3 ? 'red' : 'black' }}>
                    {slot.state === 0 ? 'Available' : slot.state === 1 ? 'Reserved' : 'Under Maintenance'}
                  </p>
                </>
              )}
            </div>
          ))
        ) : (
          <p>No slots available.</p>
        )}
      </div>

      <button className="back-button" onClick={() => navigate(-1)}>
        Back
      </button>
    </div>
  );
};

export default SlotDetailsPage;
