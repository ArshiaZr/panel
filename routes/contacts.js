const router = require("express").Router();
const path = require("path");

// Error messages
const {
  createRequirementErrorMessage,
  createInvalidErrorMessage,
  createLengthErrorMessage,
} = require("../lib/utils");

// Import Email template
const { contactMessage } = require(path.join(__dirname, "../EmailTemplates"));

// Validations
const { validateRequests } = require(path.join(
  __dirname,
  "../components/validation"
));

// Send email to support email
router.post("/", async (req, res, next) => {
  const { detail, phonenumber, email, name } = req.body;

  const validationOptions = [
    {
      title: "name",
      type: "text",
      required: {
        value: true,
        error: createRequirementErrorMessage("name"),
      },
      error: createInvalidErrorMessage("name"),
    },
    {
      title: "phonenumber",
      type: "phonenumber",
      required: {
        value: true,
        error: createRequirementErrorMessage("phone number"),
      },
      error: createInvalidErrorMessage("phone number"),
    },
    {
      title: "email",
      type: "email",
      required: {
        value: true,
        error: createRequirementErrorMessage("email"),
      },
      error: createInvalidErrorMessage("email"),
    },
    {
      title: "detail",
      type: "text",
      required: {
        value: true,
        error: createRequirementErrorMessage("message"),
      },
      length: {
        value: [8, 300],
        error: createLengthErrorMessage("message", 8, 300),
      },
      error: createLengthErrorMessage("message", 8, 300),
    },
  ];
  let { isValid, errors } = validateRequests(req.body, validationOptions);
  if (!isValid) {
    return res.status(400).json({ success: false, errors });
  }

  EmailHandler.sendEmail(
    "contact us",
    EmailHandler.getFrom(),
    "contact",
    detail,
    contactMessage({ name, email, phonenumber, detail })
  );
  return res
    .status(200)
    .json({ success: true, msg: "your message is sent successfuly" });
});

module.exports = router;
