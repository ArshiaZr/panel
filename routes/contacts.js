const router = require("express").Router();
const path = require("path");

// helper functions
const utils = require(path.join(__dirname, "../lib/utils"));

const { contactMessage } = require("../EmailTemplates");

// Validations
const {
  textLength,
  validatePhonenumber,
  validateEmail,
} = require("../validations/validations");
const { isEmpty } = require("../validations/common");

// Send email to support email
router.post("/", async (req, res, next) => {
  const { detail, phonenumber, email, name } = req.body;
  let errors = {};
  if (textLength(detail, 8, 300) !== null) {
    errors = { ...errors, ...textLength(detail, 8, 300, "detail") };
  }
  if (validatePhonenumber(phonenumber) !== null) {
    errors = { ...errors, ...validatePhonenumber(phonenumber) };
  }
  if (validateEmail(email) !== null) {
    errors = { ...errors, ...validateEmail(email) };
  }
  if (isEmpty(name)) {
    errors = { ...errors, name: "name is required" };
  }
  if (!isEmpty(errors)) {
    return res.status(400).json({ success: false, errors });
  }
  await utils.sendMail(
    email,
    "Contact",
    contactMessage({ name, email, phonenumber, detail })
  );
  return res
    .status(200)
    .json({ success: true, msg: "your message is sent successfuly" });
});

module.exports = router;
