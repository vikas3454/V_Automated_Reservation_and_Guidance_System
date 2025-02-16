import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import axios from "axios"; // To make API requests
import "./Dashboard.css";
import SignupPage from "./Signup";
import LoginPage from "./Login";
import SlotBookingPage from "./SlotBookingPage";
import WelcomeImage from "../images/img2.webp";
import Logo from "../images/logo.webp";
import BookingHistoryPage from "./bookingHistoryPage";
import ActiveBookingsPage from "./ActiveBookingsPage"; 

const Dashboard = () => {
  const [activePage, setActivePage] = useState(null);
  const [typedText, setTypedText] = useState("");
  const [user, setUser] = useState(null); // Store user profile data
  const fullText = "Welcome to SmartParking!!!";
  const navigate = useNavigate(); // Initialize navigate
  //const token = localStorage.getItem("token"); // Get token from localStorage

  // Typing Effect Logic
  useEffect(() => {
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index < fullText.length) {
        setTypedText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typingInterval);
      }
    }, 100);

    return () => clearInterval(typingInterval);
  }, []);

  // Fetch user profile after login
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Token in useEffect:", token); // Verify the token

    if (token) {
      // If a token is present, fetch the user profile
      axios
        .get("http://localhost:5000/routes/profile", {
          headers: { Authorization: `Bearer ${token}` }, // Sending the token in headers
        })
        .then((response) => {
          console.log("Profile response:", response);
          setUser(response.data.user); // Set user data from response
          localStorage.setItem("userId",response.data.user.id);
        })
        .catch((error) => {
          console.error("Error fetching profile:", error);
          localStorage.removeItem("token"); // Remove invalid token
          navigate("/login"); // Redirect to login page
        });
    } else {
      console.log("No token found, redirecting to login...");
      navigate("/login"); // Redirect to login page if no token
    }
  }, [navigate]);

  const handleLogout = () => {
    console.log("Logout clicked");
    localStorage.removeItem("token"); // Remove token from localStorage
    localStorage.removeItem("userId");
    setUser(null); // Clear user data
    navigate("/"); // Redirect to home page (login)
  };

  const renderContent = () => {
    if (activePage === "login") {
      return <LoginPage />;
    } else if (activePage === "signup") {
      return <SignupPage />;
    } else if (activePage === "slotBooking") {
      return <SlotBookingPage />;
    } else if (activePage === "history") {
      return <BookingHistoryPage />

    } else if (activePage === "activeBookings") {
      return <ActiveBookingsPage />; 
    } else if (activePage === "profile" && user) {
      return (
        <div className="profile-container">
          <div className="profile-card">
            <div className="profile-header">
              Welcome, {user.name}
            </div>
            <div className="profile-details">
              <p><span className="label">Name:</span> {user.name}</p>
              <p><span className="label">Email:</span> {user.email}</p>
              <p><span className="label">Mobile:</span> {user.mobile}</p>
              <p><span className="label">Vehicle 1:</span> {user.VehicleNumber1}</p>
              <p><span className="label">Vehicle 2:</span> {user.VehicleNumber2 || 'Not Provided'}</p>
              <p><span className="label">Vehicle 3:</span> {user.VehicleNumber3 || 'Not Provided'}</p>
            </div>
            <div className="profile-actions">
              <button onClick={() => console.log("Edit Profile")}>Edit Profile</button>
              <button onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      );
    }else {
      return (
        <div className="welcome-section">
          <div className="welcome-text">
            <h1 className="typing-effect">{typedText}</h1>
            <p className="fade-in">
              Discover a smarter way to park. Save time, reduce hassle, and enjoy effortless parking at your fingertips.
            </p>
            <ul className="fade-in-list">
              <li>
                <i className="fas fa-check-circle"></i> Real-Time Parking Availability
              </li>
              <li>
                <i className="fas fa-clock"></i> Advance Reservations
              </li>
              <li>
                <i className="fas fa-map-marker-alt"></i> Guided Navigation
              </li>
            </ul>
            <button onClick={() => setActivePage("signup")}>Get Started</button>
          </div>
          <div className="welcome-image">
            <img src={WelcomeImage} alt="Smart Parking" />
          </div>
        </div>
      );
    }
  };

  return (
    <div className="home-page">
      <nav className="navbar">
        <img src={Logo} alt="SmartPark Logo" className="navbar-logo" />
        <div className="navbar-links">
          <button
            className={`navbar-btn ${activePage === null ? "active" : ""}`}
            onClick={() => setActivePage(null)}
          >
            Home
          </button>
          <button
            className={`navbar-btn ${activePage === "slotBooking" ? "active" : ""}`}
            onClick={() => setActivePage("slotBooking")}
          >
            Slot Booking
          </button>
          <button
            className={`navbar-btn ${activePage === "history" ? "active" : ""}`}
            onClick={() => setActivePage("history")}
          >
            History
          </button>
          <button className={`navbar-btn ${activePage === "activeBookings" ? "active" : ""}`} onClick={() => setActivePage("activeBookings")}>
            Active Bookings
          </button>
          <div className="user-details-dropdown">
            <button className="navbar-btn user-btn">
              {user ? `Welcome, ${user.name}` : "User Details"} <i className="fas fa-user"></i>
            </button>
            <div className="dropdown-content">
              {user ? (
                <>
                  <button onClick={() => setActivePage("profile")}>Profile</button>
                  <button onClick={handleLogout}>Logout</button>
                </>
              ) : (
                <p>Please log in</p>
              )}
            </div>
          </div>
        </div>
      </nav>
      <div className="content-area">{renderContent()}</div>
    </div>
  );
};

export default Dashboard; 