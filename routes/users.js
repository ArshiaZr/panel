const mongoose = require("mongoose");
const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const jsonwebtoken = require("jsonwebtoken");

// Models
const User = mongoose.model("User");

// helper functions
const utils = require(path.join(__dirname, "../lib/utils"));
const {
  userVerificationLink,
  userAccountVerified,
} = require("../EmailTemplates");

// Error messages
const {
  createRequirementErrorMessage,
  createInvalidErrorMessage,
  createLengthErrorMessage,
} = require("../lib/utils");

// Keys
const pathToKey = path.join(__dirname, "..", "id_rsa_priv.pem");
const pathToPubKey = path.join(__dirname, "..", "id_rsa_pub.pem");
const PRIV_KEY = fs.readFileSync(pathToKey, "utf8");
const PUB_KEY = fs.readFileSync(pathToPubKey, "utf8");

// validations
const { validateRequests } = require(path.join(
  __dirname,
  "../components/validation"
));
const { isEmpty } = require("../validations/common");

// Constants
const {
  CUSTOMER_MANAGEMENT,
  VERIFIED,
  ENABLED,
  errorMessages,
  successMessages,
} = require(path.join(__dirname, "../constants"));

// Login an existing user
router.post("/login", (req, res, next) => {
  const validationOptions = [
    {
      title: "username",
      type: "text",
      required: {
        value: true,
        error: createRequirementErrorMessage("username"),
      },
      error: createInvalidErrorMessage("username"),
    },
    {
      title: "password",
      type: "text",
      required: {
        value: true,
        error: createRequirementErrorMessage("password"),
      },
      error: createInvalidErrorMessage("password"),
    },
  ];
  let { isValid, errors } = validateRequests(req.body, validationOptions);
  if (!isValid) {
    return res.status(400).json({ success: false, errors });
  }
  req.body.username = req.body.username.toString().toLowerCase();
  User.findOne({ username: req.body.username })
    .then((user) => {
      if (!user) {
        return res
          .status(401)
          .json({ success: false, msg: errorMessages.accountDoesNotExist });
      }

      const isValid = utils.validPassword(
        req.body.password,
        user.hash,
        user.salt
      );

      if (isValid) {
        const tokenObject = utils.issueJWT(user);

        return res.status(200).json({
          success: true,
          token: tokenObject.token,
          expiresIn: tokenObject.expires,
        });
      } else {
        return res
          .status(401)
          .json({ success: false, msg: errorMessages.wrongUserPass });
      }
    })
    .catch((err) => {
      return res.status(400).json({ success: false, err });
    });
});

// Register a new user
router.post("/register", (req, res, next) => {
  const validationOptions = [
    {
      title: "username",
      type: "text",
      required: {
        value: true,
        error: createRequirementErrorMessage("username"),
      },
      length: {
        value: [3, 20],
        error: createLengthErrorMessage("username", 3, 20),
      },
      error: createInvalidErrorMessage("username"),
    },
    {
      title: "password",
      type: "password",
      required: {
        value: true,
        error: createRequirementErrorMessage("password"),
      },
      length: {
        value: [8, 30],
      },
    },
  ];
  let { isValid, errors } = validateRequests(req.body, validationOptions);
  if (!isValid) {
    return res.status(400).json({ success: false, errors });
  }
  req.body.username = req.body.username.toString().toLowerCase();
  User.findOne({ username: req.body.username }).then((user) => {
    if (user) {
      return res
        .status(409)
        .json({ success: false, msg: errorMessages.accountExists });
    }

    const saltHash = utils.genPassword(req.body.password);

    const salt = saltHash.salt;
    const hash = saltHash.hash;

    const newUser = new User({
      username: req.body.username,
      hash: hash,
      salt: salt,
    });

    try {
      newUser.save().then((user) => {
        return res.status(200).json({ success: true, user: user });
      });
    } catch (err) {
      return res.status(400).json({ success: false, msg: err });
    }
  });
});

// Toggle, disable, enable an account
router.patch("/:id", utils.authMiddleware, async (req, res, next) => {
  if (
    !req.jwt.role ||
    !(await utils.checkCredibility(
      req.jwt.sub,
      req.jwt.role,
      CUSTOMER_MANAGEMENT,
      [ENABLED, VERIFIED]
    ))
  ) {
    return res.status(401).json({ msg: errorMessages.accessDenied });
  }
  User.findById(req.params.id)
    .then((user) => {
      if (!user) {
        return res
          .status(404)
          .json({ success: false, msg: errorMessages.accountDoesNotExist });
      }
      user.enabled = !user.enabled;
      user
        .save()
        .then((ret) => {
          return res.status(200).json({ success: true, user: ret });
        })
        .catch((err) => {
          return res.status(400).json({ success: false, msg: err });
        });
    })
    .catch((err) => {
      return res.status(400).json({ success: false, err });
    });
});

// compelete account
router.post("/compelete", utils.authMiddleware, async (req, res, next) => {
  const { firstname, lastname, phonenumber, email } = req.body;
  const validationOptions = [
    {
      title: "firstname",
      type: "text",
      required: {
        value: true,
        error: createRequirementErrorMessage("firstname"),
      },
      error: createInvalidErrorMessage("firstname"),
    },
    {
      title: "lastname",
      type: "text",
      required: {
        value: true,
        error: createRequirementErrorMessage("lastname"),
      },
      error: createInvalidErrorMessage("firstname"),
    },
    {
      title: "phonenumber",
      type: "phonenumber",
      required: {
        value: true,
        error: createRequirementErrorMessage("phonenumber"),
      },
      error: createInvalidErrorMessage("phonenumber"),
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
  ];
  let { isValid, errors } = validateRequests(req.body, validationOptions);
  if (!isValid) {
    return res.status(400).json({ success: false, errors });
  }

  User.findById(req.jwt.sub).then(async (user) => {
    if (!user) {
      return res
        .status(404)
        .json({ success: false, msg: errorMessages.accountDoesNotExist });
    }
    if (user.verified) {
      return res.status(409).json({
        success: false,
        msg: errorMessages.accountAlreadyComplete,
      });
    }
    user.firstname = firstname.toLowerCase();
    user.lastname = lastname.toLowerCase();
    user.phonenumber = phonenumber;
    user.email = email.toLowerCase();
    user
      .save()
      .then(async (ret) => {
        const signedToken = jsonwebtoken.sign(
          {
            sub: user._id,
          },
          PRIV_KEY,
          {
            expiresIn: "10m",
            algorithm: "RS256",
          }
        );
        EmailHandler.sendEmail(
          "Users",
          user.email,
          "Verify your account",
          "Verification",
          userVerificationLink(user, signedToken)
        );
        return res.status(200).json({
          success: true,
          msg: successMessages.accountCompleted,
        });
      })
      .catch((err) => {
        return res.status(400).json({ success: false, err });
      });
  });
});

// activate account
router.get("/activate/:token", async (req, res, next) => {
  const token = req.params.token;
  if (token) {
    const verification = jsonwebtoken.verify(
      token,
      PUB_KEY,
      {
        algorithms: ["RS256"],
      },
      (err, decoded) => {
        if (err) {
          return false;
        }
        return decoded;
      }
    );
    if (verification.sub) {
      User.findById(verification["sub"])
        .then(async (user) => {
          if (!user) {
            return res.status(404).json({
              success: false,
              msg: errorMessages.other,
            });
          }
          if (user.verified) {
            return res.status(400).json({
              success: false,
              msg: errorMessages.accountAlreadyVerified,
            });
          }

          user.verified = true;
          user.save().then(async (ret) => {
            await utils.sendMail(
              user.email,
              "Your account is now verified",
              userAccountVerified(user)
            );
            return res.status(200).json({
              success: true,
              msg: successMessages.verifiedSuccessfully,
            });
          });
        })
        .catch((err) => {
          return res.status(400).json({ success: false, msg: err });
        });
    } else {
      return res.status(400).json({ success: false, msg: errorMessages.other });
    }
  } else {
    return res.status(400).json({ success: false, msg: errorMessages.other });
  }
});

module.exports = router;
