const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/auth");  // Import auth routes
const loginRoute = require("./routes/login"); // Import login route
const ParkingRoute = require("./routes/ParkingRoutes");
const slots = require("./routes/slots");
const reservationsRoute = require("./routes/reserve");
const BookingHistoryPage = require("./routes/bookingHistory");
const payment = require("./routes/payment");
const activebooking = require("./routes/activebooking");
const extend = require("./routes/extend");



const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

require("./data"); 
// Use the auth routes
app.use("/api/auth", authRoutes);

// Use the login route
app.use("/routes", loginRoute);  // Add the new login route here

app.use("/routes", ParkingRoute);

app.use("/routes", slots);

app.use("/api/reservations", reservationsRoute);

app.use("/routes", BookingHistoryPage);

app.use("/routes", payment);

app.use("/", activebooking);


app.use("/api/reservations", extend);

//app.use("/api/reservations/cancel",cancel);


console.log("🚀 Registered Routes:");
console.log(app._router.stack
  .filter(r => r.route)
  .map(r => r.route.path)
);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
