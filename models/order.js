const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  customer: {
    type: String,
    required: true,
  },
  process: {
    // placed, approved,
    type: String,
    default: "placed",
  },
  type: {
    // service, product
    type: String,
  },
  detail: {
    type: String,
    required: true,
  },
  dateOrdered: {
    type: Date,
    default: Date.now(),
  },
  dateModified: {
    type: Date,
  },
  comment: {
    type: String,
  },
});

mongoose.model("Order", OrderSchema);
