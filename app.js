const express = require("express");
const cors = require("cors");
const path = require("path");

/**
 * -------------- GENERAL SETUP ----------------
 */

require("dotenv").config();

var app = express();

require(path.join(__dirname, "./config/database"));

// Load the models
require(path.join(__dirname, "./models/user"));
require(path.join(__dirname, "./models/admin"));
require(path.join(__dirname, "./models/order"));
require(path.join(__dirname, "./models/expense"));
require(path.join(__dirname, "./models/revenue"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

// Imports all of the routes from ./routes/index.js
app.use(require(path.join(__dirname, "./routes")));

/**
 * -------------- SERVER ----------------
 */

const port = process.env.PORT || 3000;
// Server listens on http://localhost:3000
app.listen(port, () => {
  console.log(`Application listens on port ${port}`);
});
