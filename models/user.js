const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  hash: {
    type: String,
    required: true,
  },
  firstname: {
    type: String,
  },
  lastname: {
    type: String,
  },
  phonenumber: {
    type: String,
  },
  email: {
    type: String,
  },
  salt: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
});

mongoose.model("User", UserSchema);
