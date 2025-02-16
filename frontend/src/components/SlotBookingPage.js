import React, { useState, useEffect } from "react"; 
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./SlotBookingPage.css";

const SlotBookingPage = () => {
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLocations = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get("http://localhost:5000/routes/locations", {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        });
        setLocations(response.data);
        setFilteredLocations(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching locations:", err);
        setError(err.response?.data?.message || "Failed to fetch locations");
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  useEffect(() => {
    const filtered = locations.filter((location) =>
      location.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLocations(filtered);
  }, [searchTerm, locations]);

  const handleLocationSelect = (location) => {
    navigate(`/slot-details/${location.id}`, { state: { location, id: location.id, locationName: location.name } });
  };

  if (loading) {
    return <div>Loading locations...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="slot-booking-page">
      <h2 className="page-title">Select your location for slot booking</h2>
      
      <input
  type="text"
  placeholder="Search locations..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  className="search-input"
  aria-label="Search locations"
  style={{
    color: "#333", // Dark text for visibility
    background: "rgba(255, 255, 255, 0.8)", // Light background for contrast
    padding: "10px 20px 10px 40px",
    border: "1px solid #ccc",
    borderRadius: "25px",
    fontSize: "1rem",
    width: "100%",
    maxWidth: "250px",
  }}
/>


      <div className="locations-list scroll-container">
        {filteredLocations.length > 0 ? (
          filteredLocations.map((location) => (
            <div
              key={location.id}
              className="location-card"
              onClick={() => handleLocationSelect(location)}
            >
              <h3>{location.name}</h3>
              <div className="slot-info">
                <div className="slot-field">
                  <strong>No. of Slots Vacant:</strong> {location.occupied}
                </div>
                <div className="slot-field">
                  <strong>Occupied:</strong> {location.vacant}
                </div>
                <div className="slot-field">
                  <strong>Reserved:</strong> {location.reserved}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No matching locations found.</p>
        )}
      </div>
    </div>
  );
};

export default SlotBookingPage;
