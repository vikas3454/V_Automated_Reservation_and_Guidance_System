import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import backgroundImg from "../images/img1.webp";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async () => {
    if (formData.identifier && formData.password) {
      console.log("Attempting login with data:", formData); // Debugging: Log form data

      try {
        const response = await fetch("http://localhost:5000/routes/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();
        console.log("API Response:", data); // Debugging: Log the API response

        if (response.ok) {
          console.log("Login successful, redirecting...");
          alert("Login successful!");

          // Storing the token and username for subsequent requests
          console.log(data);
          localStorage.setItem("token", data.token); // Save JWT token
          localStorage.setItem("username", data.username); // Save username
          localStorage.setItem("userId",data.user_id);
          console.log(data);
          console.log("Token and username saved:", {
            token: data.token,
            username: data.username,
          });

          navigate("/Dashboard"); // Navigate to the dashboard after login
        } else {
          console.error("Login failed with error:", data.error);
          alert(data.error || "Invalid credentials.");
        }
      } catch (error) {
        console.error("Error logging in:", error);
        alert("Something went wrong. Please check the console for details.");
      }
    } else {
      console.log("Form data incomplete:", formData); // Debugging: Log incomplete form data
      alert("Please fill in both fields.");
    }
  };

  return (
    <div
      className="login-page"
      style={{ backgroundImage: `url(${backgroundImg})` }}
    >
      <div className="form-container">
        <h1 className="form-title">Login</h1>
        <form>
          <input
            type="text"
            name="identifier"
            placeholder="Email or Mobile Number"
            value={formData.identifier}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <button
            type="button"
            onClick={handleLogin}
            className="animated-btn login-btn"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
