import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SignupPage.css";
import backgroundImg from "../images/img1.webp";

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
    otp: "",
    vehicleNumber1: "",
    vehicleNumber2: "",
    vehicleNumber3: "",
  });
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    console.log(`Updated field ${name} with value: ${value}`);
  };

  const handleSendOtp = async () => {
    if (!formData.email) {
      alert("Please provide a valid email.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, name: formData.name }),
      });
      const data = await response.json();
      setLoading(false);
      if (response.ok) {
        alert(data.message);
        setOtpSent(true);
      } else {
        alert(data.error || "Failed to send OTP");
      }
    } catch (error) {
      setLoading(false);
      console.error("Error sending OTP:", error);
      alert("An error occurred. Please try again later.");
    }
  };

  const handleSubmitOtp = async () => {
    if (!formData.otp) {
      alert("Please enter the OTP.");
      return;
    }
    setLoading(true);
    try {
      const otpResponse = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp: formData.otp }),
      });
      const otpData = await otpResponse.json();
      if (!otpResponse.ok) {
        setLoading(false);
        alert(otpData.error || "Failed to verify OTP");
        return;
      }

      // OTP Verified, now save user details
      console.log("Form Data before sending to backend:", formData);
      const signupResponse = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const signupData = await signupResponse.json();
      setLoading(false);
      if (signupResponse.ok) {
        alert(signupData.message || "Signup successful!");
        navigate("/login"); // Redirect to login page after successful signup
      } else {
        alert(signupData.error || "Failed to register user.");
      }
    } catch (error) {
      setLoading(false);
      console.error("Error during signup process:", error);
      alert("An error occurred. Please try again later.");
    }
  };

  return (
    <div className="signup-page" style={{ backgroundImage: `url(${backgroundImg})` }}>
      <div className="form-container">
        <h1 className="form-title">Signup</h1>
        <form>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email ID"
            value={formData.email}
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
          <input
            type="tel"
            name="mobile"
            placeholder="Mobile Number"
            value={formData.mobile}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="vehicleNumber1"
            placeholder="Vehicle Number 1 (Mandatory)"
            value={formData.vehicleNumber1}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="vehicleNumber2"
            placeholder="Vehicle Number 2 (Optional)"
            value={formData.vehicleNumber2}
            onChange={handleChange}
          />
          <input
            type="text"
            name="vehicleNumber3"
            placeholder="Vehicle Number 3 (Optional)"
            value={formData.vehicleNumber3}
            onChange={handleChange}
          />
          <div className="button-container">
            <button
              type="button"
              onClick={handleSendOtp}
              className="animated-btn send-otp-btn"
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </div>
          {otpSent && (
            <div className="otp-section">
              <input
                type="text"
                name="otp"
                placeholder="Enter OTP"
                value={formData.otp}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={handleSubmitOtp}
                className="animated-btn submit-otp-btn"
                disabled={loading}
              >
                {loading ? "Verifying OTP..." : "Submit OTP"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
