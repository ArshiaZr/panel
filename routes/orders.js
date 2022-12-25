const mongoose = require("mongoose");
const path = require("path");
const router = require("express").Router();

// Models
const User = mongoose.model("User");
const Order = mongoose.model("Order");

// helper functions
const utils = require(path.join(__dirname, "../lib/utils"));

// Email Templates
const { orderPlaced, orderDetailChanged } = require("../EmailTemplates");

// validations
const {
  pastDateValidation,
  isValidOption,
  textLength,
} = require("../validations/validations");
const { isEmpty } = require("../validations/common");

// Constants
const { STORE, VERIFIED, ENABLED } = require(path.join(
  __dirname,
  "../constants"
));

// Get all orders with filter
// if there is no filter get all orders
// accesibility just admins
router.get("/", utils.authMiddleware, async (req, res, next) => {
  if (
    !req.jwt.role ||
    !(await utils.checkCredibility(req.jwt.sub, req.jwt.role, STORE, [
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
    Order.find()
      .then((orders) => {
        if (!orders) {
          return res.status(404).json({ success: false, msg: "Not found" });
        }
        return res.status(200).json({ success: true, orders });
      })
      .catch((err) => {
        return res.status(400).json({ success: false, msg: err });
      });
  } else {
    Order.find({
      dateOrdered: {
        $gte: date,
        $lt: new Date(Date.now()),
      },
    })
      .then((orders) => {
        if (!orders) {
          return res.status(404).json({ success: false, msg: "Not found" });
        }
        return res.status(200).json({ success: true, orders });
      })
      .catch((err) => {
        return res.status(400).json({ success: false, msg: err });
      });
  }
});

// Get all orders for a particular person with filter
// if there is no filter get all orders
// accesibility just admins
router.get("/:id", utils.authMiddleware, async (req, res, next) => {
  if (
    !req.jwt.role ||
    !(await utils.checkCredibility(req.jwt.sub, req.jwt.role, STORE, [
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
    Order.find({ customer: req.params.id })
      .then((order) => {
        if (!order) {
          return res.status(404).json({ success: false, msg: "Not found" });
        }
        return res.status(200).json({ success: true, order });
      })
      .catch((err) => {
        return res.status(400).json({ success: false, msg: err });
      });
  } else {
    Order.find({
      dateOrdered: {
        $gte: date,
        $lt: new Date(Date.now()),
      },
      customer: req.params.id,
    })
      .then((order) => {
        if (!order) {
          return res.status(404).json({ success: false, msg: "Not found" });
        }
        return res.status(200).json({ success: true, order });
      })
      .catch((err) => {
        return res.status(400).json({ success: false, msg: err });
      });
  }
});

// Place order
// accesibility admins with permition and users
router.post("/place", utils.authMiddleware, async (req, res, next) => {
  let userEmail = null;
  let { customer, detail } = req.body;
  let errors = {};

  if (req.jwt.role) {
    if (
      !(await utils.checkCredibility(req.jwt.sub, req.jwt.role, STORE, [
        ENABLED,
        VERIFIED,
      ]))
    ) {
      return res
        .status(401)
        .json({ success: false, msg: "Not Authorized for this action" });
    }
  } else {
    customer = req.jwt.sub;
    let isVerifiedAndEnabled = await User.findById(req.jwt.sub)
      .then((user) => {
        if (!user) {
          return [false, "Not found"];
        }
        if (!user.verified) {
          return [false, "You have to first verify your account"];
        }
        if (!user.enabled) {
          return [
            false,
            "Your account is disabled. Please contact support team",
            user.email,
          ];
        }
        return [true, ""];
      })
      .catch((err) => {
        return [false, err];
      });
    if (!isVerifiedAndEnabled[0]) {
      return res.status(401).json({
        success: false,
        msg: isVerifiedAndEnabled[1],
      });
    } else {
      userEmail = isVerifiedAndEnabled[2];
    }
  }
  if (textLength(detail, 6, 800, "detail") !== null)
    errors = { ...errors, ...textLength(detail, 6, 800, "detail") };
  if (isEmpty(customer)) {
    return res
      .status(400)
      .json({ success: false, customer: "You should specify the customer" });
  }
  if (
    !(await User.exists({ _id: customer }, (err) => {
      if (err) return false;
      return true;
    }))
  ) {
    return res
      .status(400)
      .json({ success: false, customer: "Customer id is not valid" });
  }

  if (!isEmpty(errors)) {
    return res.status(400).json({ success: false, errors });
  }
  let dateModified = Date.now();
  const newOrder = Order({
    customer,
    detail,
    dateModified,
  });
  newOrder
    .save()
    .then(async (order) => {
      if (userEmail) {
        await utils.sendMail(
          userEmail.email,
          "Your order has placed",
          orderPlaced(newOrder)
        );
      }
      return res.status(200).json({ success: true, msg: "Order placed" });
    })
    .catch((err) => {
      return res.status(400).json({ success: false, err });
    });
});

// change order detail
// accesibility just admins
router.post("/:id", utils.authMiddleware, async (req, res, next) => {
  if (
    !req.jwt.role ||
    !(await utils.checkCredibility(req.jwt.sub, req.jwt.role, STORE, [
      ENABLED,
      VERIFIED,
    ]))
  ) {
    return res
      .status(401)
      .json({ success: false, msg: "Not Authorized for this action" });
  }
  let { process, detail, comment, value } = req.body;
  let errors = {};
  if (isValidOption(process, ["placed", "approved"], "process") !== null)
    errors = {
      ...errors,
      ...isValidOption(process, ["placed", "approved"], "process"),
    };
  if (textLength(detail, 3, 800, "detail") !== null)
    errors = { ...errors, ...textLength(detail, 3, 800, "detail") };
  if (textLength(comment, 3, 800, "comment") !== null)
    errors = { ...errors, ...textLength(comment, 3, 800, "comment") };
  if (validateCurrency(value, "value") !== null)
    errors = { ...errors, ...validateCurrency(value, "value") };
  if (!isEmpty(errors)) {
    return res.status(400).json({ success: false, errors });
  }
  Order.findById(req.params.id)
    .then(async (order) => {
      if (!order) {
        return res.status(404).json({ success: false, msg: "Not found" });
      }
      let dateModified = Date.now();
      order.process = process;
      order.detail = detail;
      order.comment = comment;
      order.dateModified = dateModified;
      order.value = value;
      await order
        .save()
        .then(async (ret) => {
          await utils.sendMail(
            userEmail.email,
            "Your order detail has changed",
            orderDetailChanged(order)
          );
          return res
            .status(200)
            .json({ success: true, msg: "Order modified successfully" });
        })
        .catch((err) => {
          return res.status(400).json({ success: false, err });
        });
    })
    .catch((err) => {
      return res.status(400).json({ success: false, err });
    });
});

module.exports = router;
