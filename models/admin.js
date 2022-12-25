const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  firstname: {
    type: String,
    required: false,
  },
  lastname: {
    type: String,
    required: false,
  },
  phonenumber: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: false,
  },
  hash: {
    type: String,
    required: true,
  },
  salt: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  enabled: {
    type: Boolean,
    default: false,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
  image: {
    type: String,
  },
});

mongoose.model("Admin", AdminSchema);
