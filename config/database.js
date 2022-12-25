const mongoose = require("mongoose");

require("dotenv").config();

const devConnection = process.env.DB_STRING;
const prodConnection = process.env.DB_STRING_PROD;

// Connect to the correct environment database
if (process.env.NODE_ENV === "production") {
  mongoose.connect(prodConnection, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  mongoose.connection.on("connected", () => {
    console.log("Database connected");
  });

  mongoose.connection.on('error', err => {
    console.log(err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('Mongoose connection is disconnected...');
  });
} else {
  mongoose.connect(devConnection, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  mongoose.connection.on("connected", () => {
    console.log("Database connected");
  });

  mongoose.connection.on('error', err => {
    console.log(err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('Mongoose connection is disconnected...');
  });
}
