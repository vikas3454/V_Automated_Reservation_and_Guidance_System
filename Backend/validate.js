const nodemailer = require("nodemailer");
const crypto = require("crypto");

async function sendVerificationEmail() {
  const otp = crypto.randomInt(100000, 999999); // Generate a 6-digit OTP

  // Set up transporter with your original email credentials
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "vemulavikas679@gmail.com", // Your original email
      pass: "vjzw boca bnlr kjuu", // Your original email password
    },
  });

  const mailOptions = {
    from: "vemulavikas679@gmail.com", // Sender's email
    to: "vemulavikas468@gmail.com", // Verification email
    subject: "Email Verification - Your OTP Code",
    text: `Your OTP for verification is: ${otp}. It is valid for 5 minutes.`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Verification email sent: ", info.response);
    console.log("Generated OTP: ", otp);
    return { success: true, otp };
  } catch (error) {
    console.error("Error sending verification email:", error);
    return { success: false, error };
  }
}

// Call the function
sendVerificationEmail().then((result) => {
  if (result.success) {
    console.log("Email sent successfully with OTP:", result.otp);
  } else {
    console.error("Failed to send email:", result.error);
  }
});
