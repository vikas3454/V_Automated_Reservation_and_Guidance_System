import React, { useState, useEffect } from "react";
import "./HomePage.css";
import SignupPage from "./Signup";
import LoginPage from "./Login";
import WelcomeImage from "../images/img2.webp";
import Logo from "../images/logo.webp";

const HomePage = () => {
  const [activePage, setActivePage] = useState(null);
  const [typedText, setTypedText] = useState("");
  const fullText = "Welcome to SmartParking!!!";

  // Typing Effect Logic
  useEffect(() => {
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index < fullText.length) {
        setTypedText(fullText.slice(0, index + 1)); // Directly slice the string
        index++;
      } else {
        clearInterval(typingInterval); // Stop the interval once typing is complete
      }
    }, 100); // Typing speed in milliseconds
  
    return () => clearInterval(typingInterval); // Cleanup interval on unmount
  }, []);
  

  const renderContent = () => {
    if (activePage === "login") {
      return <LoginPage />;
    } else if (activePage === "signup") {
      return <SignupPage />;
    } else {
      return (
        <div className="welcome-section">
          <div className="welcome-text">
            <h1 className="typing-effect">{typedText}</h1>
            <p className="fade-in">Discover a smarter way to park. Save time, reduce hassle, and enjoy effortless parking at your fingertips.</p>
            <ul className="fade-in-list">
              <li><i className="fas fa-check-circle"></i> Real-Time Parking Availability</li>
              <li><i className="fas fa-clock"></i> Advance Reservations</li>
              <li><i className="fas fa-map-marker-alt"></i> Guided Navigation</li>
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
            className={`navbar-btn ${activePage === "login" ? "active" : ""}`}
            onClick={() => setActivePage("login")}
          >
            Login
          </button>
          <button
            className={`navbar-btn ${activePage === "signup" ? "active" : ""}`}
            onClick={() => setActivePage("signup")}
          >
            Signup
          </button>
        </div>
      </nav>
      <div className="content-area">{renderContent()}</div>
    </div>
  );
};

export default HomePage;
