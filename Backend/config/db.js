const mysql = require("mysql");

const connection = mysql.createConnection({
  host: "localhost",
  user: "vemulavikaspc",
  password: "root",
  database: "arp",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    return;
  }
  console.log("Connected to the MySQL database.");
});

// Handle connection errors
connection.on("error", (err) => {
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    console.error("Database connection lost. Reconnecting...");
    connection.connect((retryErr) => {
      if (retryErr) console.error("Reconnection failed:", retryErr);
      else console.log("Reconnected to the MySQL database.");
    });
  } else {
    console.error("Database error:", err);
    throw err;
  }
});

module.exports = connection;
