const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema({
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
    default: "expense",
  },
});

mongoose.model("Expense", ExpenseSchema);
