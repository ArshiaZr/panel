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

// Keys
const pathToKey = path.join(__dirname, "..", "id_rsa_priv.pem");
const pathToPubKey = path.join(__dirname, "..", "id_rsa_pub.pem");
const PRIV_KEY = fs.readFileSync(pathToKey, "utf8");
const PUB_KEY = fs.readFileSync(pathToPubKey, "utf8");

// validations
const {
  textLength,
  validatePassword,
  validatePhonenumber,
  validateEmail,
} = require("../validations/validations");
const { isEmpty } = require("../validations/common");

// Constants
const { CUSTOMER_MANAGEMENT, VERIFIED, ENABLED } = require(path.join(
  __dirname,
  "../constants"
));

// Login an existing user
router.post("/login", (req, res, next) => {
  let errors = {};
  if (textLength(req.body.username, 3, 20, "username") !== null)
    errors = { ...errors, ...textLength(req.body.username, 3, 20, "username") };
  if (validatePassword(req.body.password) !== null)
    errors = { ...errors, ...validatePassword(req.body.password) };
  if (!isEmpty(errors)) {
    return res.status(400).json({ success: false, errors });
  }
  eq.body.username = req.body.username.toString().toLowerCase();
  User.findOne({ username: req.body.username })
    .then((user) => {
      if (!user) {
        return res
          .status(401)
          .json({ success: false, msg: "could not find user" });
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
          .json({ success: false, msg: "Wrong username/password" });
      }
    })
    .catch((err) => {
      return res.status(400).json({ success: false, err });
    });
});

// Register a new user
router.post("/register", (req, res, next) => {
  let errors = {};
  if (textLength(req.body.username, 3, 20, "username") !== null)
    errors = { ...errors, ...textLength(req.body.username, 3, 20, "username") };
  if (validatePassword(req.body.password) !== null)
    errors = { ...errors, ...validatePassword(req.body.password) };
  if (!isEmpty(errors)) {
    return res.status(400).json({ success: false, errors });
  }
  req.body.username = req.body.username.toString().toLowerCase();
  User.findOne({ username: req.body.username }).then(
    (user) => {
      if (user) {
        return res
          .status(409)
          .json({ success: false, msg: "The username already registered" });
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
    }
  );
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
    return res.status(401).json({ msg: "Not Authorized for this action" });
  }
  User.findById(req.params.id)
    .then((user) => {
      if (!user) {
        return res.status(404).json({ success: false, msg: "Not found" });
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
  let errors = {};
  if (textLength(firstname, 3, 20, "firstname") !== null)
    errors = { ...errors, ...textLength(firstname, 3, 20, "firstname") };
  if (textLength(lastname, 3, 20, "lastname") !== null)
    errors = { ...errors, ...textLength(lastname, 3, 20, "lastname") };
  if (validatePhonenumber(phonenumber) !== null)
    errors = { ...errors, ...validatePhonenumber(phonenumber) };
  if (validateEmail(email) !== null)
    errors = { ...errors, ...validateEmail(email) };
  if (!isEmpty(errors)) {
    return res.status(400).json({ success: false, errors });
  }
  User.findById(req.jwt.sub).then(async (user) => {
    if (!user) {
      return res
        .status(404)
        .json({ success: false, msg: "The user not found" });
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
        await utils.sendMail(
          user.email,
          "Verify your account",
          userVerificationLink(user, signedToken)
        );
        return res.status(200).json({
          success: true,
          msg: "Your account is complete now. We just sent you an email with verification url.",
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
              msg: "There is no account match with this verification code",
            });
          }
          if (user.verified) {
            return res.status(400).json({
              success: false,
              msg: "The account is already verified",
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
              msg: "Your account verified successfully",
            });
          });
        })
        .catch((err) => {
          return res.status(400).json({ success: false, msg: err });
        });
    } else {
      return res
        .status(400)
        .json({ success: false, msg: "something went wrong" });
    }
  } else {
    return res
      .status(400)
      .json({ success: false, msg: "something went wrong" });
  }
});

module.exports = router;
