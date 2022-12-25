const mongoose = require("mongoose");

const RevenueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  cost: {
    type: String,
    required: true,
  },
  detail: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
  type: {
    type: String,
    default: "revenue",
  },
});

mongoose.model("Revenue", RevenueSchema);
