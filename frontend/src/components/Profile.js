import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Profile.css";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedUser, setUpdatedUser] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      navigate("/login");
      return;
    }

    axios
      .get(`http://localhost:5000/routes/eprofile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setUser(response.data.user);
        setUpdatedUser(response.data.user);
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 100);
      })
      .catch((error) => {
        console.error("Error fetching profile:", error);
        navigate("/login");
      });
  }, [navigate]);

  const handleChange = (e) => {
    setUpdatedUser({ ...updatedUser, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    axios
      .put(`http://localhost:5000/routes/update-profile/${userId}`, updatedUser, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setUser(updatedUser);
        setIsEditing(false);
      })
      .catch((error) => {
        console.error("Error updating profile:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  if (!user) {
    return <p>Loading profile...</p>;
  }

  return (
    <div className="profile-container" style={{ overflowY: "auto", maxHeight: "90vh" }}>
      <h2>Profile</h2>
      <div className="profile-card">
        {isEditing ? (
          <>
            <label>Name: <input type="text" name="name" value={updatedUser.name} onChange={handleChange} /></label>
            <label>Email: <input type="email" name="email" value={updatedUser.email} disabled /></label>
            <label>Mobile: <input type="text" name="mobile" value={updatedUser.mobile} onChange={handleChange} /></label>
            <label>Vehicle 1: <input type="text" name="vehicle_number1" value={updatedUser.vehicle_number1} onChange={handleChange} /></label>
            <label>Vehicle 2: <input type="text" name="vehicle_number2" value={updatedUser.vehicle_number2 || ""} onChange={handleChange} /></label>
            <label>Vehicle 3: <input type="text" name="vehicle_number3" value={updatedUser.vehicle_number3 || ""} onChange={handleChange} /></label>
          </>
        ) : (
          <>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Mobile:</strong> {user.mobile}</p>
            <p><strong>Vehicle 1:</strong> {user.vehicle_number1}</p>
            <p><strong>Vehicle 2:</strong> {user.vehicle_number2 || "Not Provided"}</p>
            <p><strong>Vehicle 3:</strong> {user.vehicle_number3 || "Not Provided"}</p>
          </>
        )}

        <div className="profile-actions">
          {isEditing ? (
            <>
              <button onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setIsEditing(false)}>Cancel</button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)}>Edit Profile</button>
          )}
          <button onClick={handleLogout}>Logout</button>
          <button onClick={() => navigate("/dashboard")}>Home</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
