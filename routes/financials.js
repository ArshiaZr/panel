const mongoose = require("mongoose");
const path = require("path");
const router = require("express").Router();

// Models
const Revenue = mongoose.model("Revenue");
const Expense = mongoose.model("Expense");

// helper functions
const utils = require(path.join(__dirname, "../lib/utils"));

// validations
const {
  pastDateValidation,
  validateCurrency,
} = require("../validations/validations");
const { isEmpty } = require("../validations/common");

// Constants
const { FINANCIAL, VERIFIED, ENABLED } = require(path.join(
  __dirname,
  "../constants"
));

// Get all transactions and balance with filter
// if there is no filter get all transactions and balance
// accesibility just admins
router.get("/", utils.authMiddleware, async (req, res, next) => {
  if (
    !req.jwt.role ||
    !(await utils.checkCredibility(req.jwt.sub, req.jwt.role, FINANCIAL, [
      ENABLED,
      VERIFIED,
    ]))
  ) {
    return res
      .status(401)
      .json({ success: false, msg: "Not Authorized for this action" });
  }
  let { filter } = req.body;
  var now = new Date();
  let date = null;
  if (pastDateValidation(filter)) {
    date = new Date(now.getTime() - utils.textDateToMillisec(filter));
  }
  if (date === null) {
    let revenuesSum = 0;
    let expensesSum = 0;
    let revenuesResults = await Revenue.find()
      .then((revenues) => {
        if (!revenues) {
          return [false, "Not found", 404];
        }
        return [true, revenues, 200];
      })
      .catch((err) => {
        return [false, err, 400];
      });
    if (!revenuesResults[0]) {
      return res
        .status(revenuesResults[2])
        .json({ success: false, msg: revenuesResults[1] });
    }

    let expensesResults = await Expense.find()
      .then((expenses) => {
        if (!expenses) {
          return [false, "Not found", 404];
        }
        return [true, expenses, 200];
      })
      .catch((err) => {
        return [false, err, 400];
      });

    if (!expensesResults[0]) {
      return res
        .status(revenuesResults[2])
        .json({ success: false, msg: revenuesResults[1] });
    }
    revenuesSum = revenuesResults[1].reduce((accumulator, object) => {
      let amount = object.cost.toString();
      if (amount.substring(0, 1) === "$") {
        amount = amount.slice(1);
      }
      return accumulator + parseFloat(amount);
    }, 0);
    expensesSum = expensesResults[1].reduce((accumulator, object) => {
      let amount = object.cost.toString();
      if (amount.substring(0, 1) === "$") {
        amount = amount.slice(1);
      }
      return accumulator + parseFloat(amount);
    }, 0);
    return res.status(200).json({
      success: true,
      transactions: revenuesResults[1].concat(expensesResults[1]),
      balance: revenuesSum - expensesSum,
    });
  } else {
    let revenuesSum = 0;
    let expensesSum = 0;
    let revenuesResults = await Revenue.find({
      date: { $gte: date, $lt: new Date(Date.now()) },
    })
      .then((revenues) => {
        if (!revenues) {
          return [false, "Not found", 404];
        }
        return [true, revenues, 200];
      })
      .catch((err) => {
        return [false, err, 400];
      });
    if (!revenuesResults[0]) {
      return res
        .status(revenuesResults[2])
        .json({ success: false, msg: revenuesResults[1] });
    }

    let expensesResults = await Expense.find({
      date: { $gte: date, $lt: new Date(Date.now()) },
    })
      .then((expenses) => {
        if (!expenses) {
          return [false, "Not found", 404];
        }
        return [true, expenses, 200];
      })
      .catch((err) => {
        return [false, err, 400];
      });

    if (!expensesResults[0]) {
      return res
        .status(revenuesResults[2])
        .json({ success: false, msg: revenuesResults[1] });
    }
    revenuesSum = revenuesResults[1].reduce((accumulator, object) => {
      let amount = object.cost.toString();
      if (amount.substring(0, 1) === "$") {
        amount = amount.slice(1);
      }
      return accumulator + parseFloat(amount);
    }, 0);
    expensesSum = expensesResults[1].reduce((accumulator, object) => {
      let amount = object.cost.toString();
      if (amount.substring(0, 1) === "$") {
        amount = amount.slice(1);
      }
      return accumulator + parseFloat(amount);
    }, 0);
    return res.status(200).json({
      success: true,
      transactions: revenuesResults[1].concat(expensesResults[1]),
      balance: revenuesSum - expensesSum,
    });
  }
});

// Get all revenues with filter
// if there is no filter get all revenues
// accesibility just admins
router.get("/revenues", utils.authMiddleware, async (req, res, next) => {
  if (
    !req.jwt.role ||
    !(await utils.checkCredibility(req.jwt.sub, req.jwt.role, FINANCIAL, [
      ENABLED,
      VERIFIED,
    ]))
  ) {
    return res
      .status(401)
      .json({ success: false, msg: "Not Authorized for this action" });
  }
  let { filter } = req.body;
  var now = new Date();
  let date = null;
  if (pastDateValidation(filter)) {
    date = new Date(now.getTime() - utils.textDateToMillisec(filter));
  }
  if (date == null) {
    let revenuesSum = 0;
    let revenuesResults = await Revenue.find()
      .then((revenues) => {
        if (!revenues) {
          return [false, "Not found", 404];
        }
        return [true, revenues, 200];
      })
      .catch((err) => {
        return [false, err, 400];
      });
    if (!revenuesResults[0]) {
      return res
        .status(revenuesResults[2])
        .json({ success: false, msg: revenuesResults[1] });
    }
    revenuesSum = revenuesResults[1].reduce((accumulator, object) => {
      let amount = object.cost.toString();
      if (amount.substring(0, 1) === "$") {
        amount = amount.slice(1);
      }
      return accumulator + parseFloat(amount);
    }, 0);
    return res.status(200).json({
      success: true,
      transactions: revenuesResults[1],
    });
  } else {
    let revenuesSum = 0;
    let revenuesResults = await Revenue.find({
      date: { $gte: date, $lt: new Date(Date.now()) },
    })
      .then((revenues) => {
        if (!revenues) {
          return [false, "Not found", 404];
        }
        return [true, revenues, 200];
      })
      .catch((err) => {
        return [false, err, 400];
      });
    if (!revenuesResults[0]) {
      return res
        .status(revenuesResults[2])
        .json({ success: false, msg: revenuesResults[1] });
    }
    revenuesSum = revenuesResults[1].reduce((accumulator, object) => {
      let amount = object.cost.toString();
      if (amount.substring(0, 1) === "$") {
        amount = amount.slice(1);
      }
      return accumulator + parseFloat(amount);
    }, 0);
    return res.status(200).json({
      success: true,
      transactions: revenuesResults[1],
    });
  }
});

// Get all revenues with filter
// if there is no filter get all revenues
// accesibility just admins
router.get("/expenses", utils.authMiddleware, async (req, res, next) => {
  if (
    !req.jwt.role ||
    !(await utils.checkCredibility(req.jwt.sub, req.jwt.role, FINANCIAL, [
      ENABLED,
      VERIFIED,
    ]))
  ) {
    return res
      .status(401)
      .json({ success: false, msg: "Not Authorized for this action" });
  }
  let { filter } = req.body;
  var now = new Date();
  let date = null;
  if (pastDateValidation(filter)) {
    date = new Date(now.getTime() - utils.textDateToMillisec(filter));
  }
  if (date == null) {
    let expensesSum = 0;
    let expensesResults = await Expense.find()
      .then((expenses) => {
        if (!expenses) {
          return [false, "Not found", 404];
        }
        return [true, expenses, 200];
      })
      .catch((err) => {
        return [false, err, 400];
      });
    if (!expensesResults[0]) {
      return res
        .status(expensesResults[2])
        .json({ success: false, msg: expensesResults[1] });
    }

    expensesSum = expensesResults[1].reduce((accumulator, object) => {
      let amount = object.cost.toString();
      if (amount.substring(0, 1) === "$") {
        amount = amount.slice(1);
      }
      return accumulator + parseFloat(amount);
    }, 0);
    return res.status(200).json({
      success: true,
      transactions: expensesResults[1],
    });
  } else {
    let expensesSum = 0;
    let expensesResults = await Expense.find({
      date: { $gte: date, $lt: new Date(Date.now()) },
    })
      .then((expenses) => {
        if (!expenses) {
          return [false, "Not found", 404];
        }
        return [true, expenses, 200];
      })
      .catch((err) => {
        return [false, err, 400];
      });
    if (!expensesResults[0]) {
      return res
        .status(expensesResults[2])
        .json({ success: false, msg: expensesResults[1] });
    }
    expensesSum = expensesResults[1].reduce((accumulator, object) => {
      let amount = object.cost.toString();
      if (amount.substring(0, 1) === "$") {
        amount = amount.slice(1);
      }
      return accumulator + parseFloat(amount);
    }, 0);
    return res.status(200).json({
      success: true,
      transactions: expensesResults[1],
    });
  }
});

// Add revenue
// accesibility just admins
router.post("/revenues", utils.authMiddleware, async (req, res, next) => {
  if (
    !req.jwt.role ||
    !(await utils.checkCredibility(req.jwt.sub, req.jwt.role, FINANCIAL, [
      ENABLED,
      VERIFIED,
    ]))
  ) {
    return res
      .status(401)
      .json({ success: false, msg: "Not Authorized for this action" });
  }
  let { title, cost, detail } = req.body;
  let errors = {};
  if (isEmpty(title)) errors = { ...errors, title: "Title is required" };
  if (validateCurrency(cost, "amount") !== null)
    errors = { ...errors, ...validateCurrency(cost, "amount") };
  if (isEmpty(detail)) errors = { ...errors, detail: "Detail is required" };
  if (!isEmpty(errors)) {
    return res.status(400).json({ success: false, errors });
  }
  const newRevenue = new Revenue({
    title,
    cost: cost.toString(),
    detail,
  });
  newRevenue
    .save()
    .then((ret) => {
      return res
        .status(200)
        .json({ success: true, msg: "revenue added sucessfully" });
    })
    .catch((err) => {
      return res.status(400).json({ success: false, err });
    });
});

// Add expense
// accesibility just admins
router.post("/expenses", utils.authMiddleware, async (req, res, next) => {
  if (
    !req.jwt.role ||
    !(await utils.checkCredibility(req.jwt.sub, req.jwt.role, FINANCIAL, [
      ENABLED,
      VERIFIED,
    ]))
  ) {
    return res
      .status(401)
      .json({ success: false, msg: "Not Authorized for this action" });
  }
  let { title, cost, detail } = req.body;
  let errors = {};
  if (isEmpty(title)) errors = { ...errors, title: "Title is required" };
  if (validateCurrency(cost, "cost") !== null)
    errors = { ...errors, ...validateCurrency(cost, "cost") };
  if (isEmpty(detail)) errors = { ...errors, detail: "Detail is required" };
  if (!isEmpty(errors)) {
    return res.status(400).json({ success: false, errors });
  }
  const newExpense = new Expense({
    title,
    cost: cost.toString(),
    detail,
  });
  newExpense
    .save()
    .then((ret) => {
      return res
        .status(200)
        .json({ success: true, msg: "expense added sucessfully" });
    })
    .catch((err) => {
      return res.status(400).json({ success: false, err });
    });
});

module.exports = router;
