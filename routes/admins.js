const mongoose = require("mongoose");
const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const jsonwebtoken = require("jsonwebtoken");

// Models
const Admin = mongoose.model("Admin");
const User = mongoose.model("User");

// helper functions
const utils = require(path.join(__dirname, "../lib/utils"));

// Error messages
const {
  createRequirementErrorMessage,
  createInvalidErrorMessage,
  createLengthErrorMessage,
} = require("../lib/utils");

// Constants
const {
  hierarchy,
  employerEmployee,
  CHNG_ROLE,
  ENBL_ADMIN,
  DEL_EMP,
  CUSTOMER_MANAGEMENT,
  EMPLOYEES,
  ADD_ADMIN,
  DEL_ADMIN,
  VERIFIED,
  ENABLED,
  errorMessages,
  successMessages,
} = require(path.join(__dirname, "../constants"));

// Verification Templates
const {
  adminVerificationLink,
  adminAccountDelete,
  adminRoleChange,
  userAccountDelete,
  adminAccountVerified,
} = require("../EmailTemplates");

// Keys
const pathToKey = path.join(__dirname, "..", "id_rsa_priv.pem");
const pathToPubKey = path.join(__dirname, "..", "id_rsa_pub.pem");
const PRIV_KEY = fs.readFileSync(pathToKey, "utf8");
const PUB_KEY = fs.readFileSync(pathToPubKey, "utf8");

// Validations
const { validateRequests } = require(path.join(
  __dirname,
  "../components/validation"
));

// Validations
const {
  textLength,
  validatePassword,
  isValidOption,
  validatePhonenumber,
  validateEmail,
} = require("../validations/validations");
const { isEmpty } = require("../validations/common");

// Upload
const { upload } = require(path.join(__dirname, "../constants"));

// Validate an existing user and issue a JWT
router.post("/login", async (req, res, next) => {
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
  Admin.findOne({ username: req.body.username.toString().toLowerCase() })
    .then((admin) => {
      if (!admin) {
        return res
          .status(401)
          .json({ success: false, msg: errorMessages.authFailed });
      }

      const isValid = utils.validPassword(
        req.body.password,
        admin.hash,
        admin.salt
      );

      if (isValid) {
        const tokenObject = utils.issueJWT(admin);

        res.status(200).json({
          success: true,
          token: tokenObject.token,
          expiresIn: tokenObject.expires,
        });
      } else {
        res
          .status(401)
          .json({ success: false, msg: errorMessages.wrongUserPass });
      }
    })
    .catch((err) => {
      next(err);
    });
});

// Register administrator
router.post("/register-admin", async (req, res, next) => {
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

  Admin.findOne().then((admin) => {
    if (!isEmpty(admin)) {
      return res.status(401).json({
        success: false,
        msg: errorMessages.accessDenied,
      });
    }

    const saltHash = utils.genPassword(req.body.password);

    const salt = saltHash.salt;
    const hash = saltHash.hash;

    const newAdmin = new Admin({
      username: req.body.username.toLowerCase(),
      hash: hash,
      salt: salt,
      role: "administrator",
      verified: true,
      enabled: true,
    });

    try {
      newAdmin.save().then((admin) => {
        return res.status(200).json({ success: true, user: admin });
      });
    } catch (err) {
      return res.status(400).json({ success: false, msg: err });
    }
  });
});

// Register a new user
router.post("/register", utils.authMiddleware, async (req, res, next) => {
  if (
    !req.jwt.role ||
    !(await utils.checkCredibility(req.jwt.sub, req.jwt.role, ADD_ADMIN, [
      ENABLED,
      VERIFIED,
    ]))
  ) {
    return res
      .status(401)
      .json({ success: false, msg: errorMessages.accessDenied });
  }

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
    {
      title: "role",
      type: "options",
      required: {
        value: true,
        error: createRequirementErrorMessage("role"),
      },
      validOptions: {
        value: Object.keys(hierarchy),
      },
      error: createInvalidErrorMessage("role"),
    },
  ];
  let { isValid, errors } = validateRequests(req.body, validationOptions);
  if (!isValid) {
    return res.status(400).json({ success: false, errors });
  }
  req.body.username = req.body.username.toLowerCase();
  req.body.role = req.body.role.toLowerCase();

  if (req.body.role == "administrator") {
    return res
      .status(401)
      .json({ success: false, msg: errorMessages.accessDenied });
  }
  Admin.findOne({ username: req.body.username }).then((admin) => {
    if (admin) {
      return res
        .status(409)
        .json({ success: false, msg: errorMessages.accountExists });
    }
    const saltHash = utils.genPassword(req.body.password);

    const salt = saltHash.salt;
    const hash = saltHash.hash;

    const newAdmin = new Admin({
      username: req.body.username,
      hash: hash,
      salt: salt,
      role: req.body.role,
    });

    try {
      newAdmin.save().then((admin) => {
        return res.status(200).json({ success: true, user: admin });
      });
    } catch (err) {
      return res.status(400).json({ success: false, msg: err });
    }
  });
});

// change an admin role
router.post(
  "/change-role/:id",
  utils.authMiddleware,
  async (req, res, next) => {
    if (
      !req.jwt.role ||
      !(await utils.checkCredibility(req.jwt.sub, req.jwt.role, CHNG_ROLE, [
        ENABLED,
        VERIFIED,
      ]))
    ) {
      return res
        .status(401)
        .json({ success: false, msg: errorMessages.accessDenied });
    }
    let role = req.body.role;
    const validationOptions = [
      {
        title: "role",
        type: "options",
        required: {
          value: true,
          error: createRequirementErrorMessage("role"),
        },
        validOptions: {
          value: Object.keys(hierarchy),
        },
        error: createInvalidErrorMessage("role"),
      },
    ];
    let { isValid, errors } = validateRequests(req.body, validationOptions);
    if (!isValid) {
      return res.status(400).json({ success: false, errors });
    }
    role = role.toLowerCase();
    Admin.findById(req.params.id)
      .then(async (admin) => {
        // TODO: define the job
        if (role === "administrator") {
          return res
            .status(401)
            .json({ success: false, msg: errorMessages.accessDenied });
        }
        admin
          .save()
          .then(async (ret) => {
            if (admin.email) {
              await utils.sendMail(
                admin.email,
                "Your role has changed",
                adminRoleChange(admin)
              );
            }
            return res.status(200).json({ success: true, admin: ret });
          })
          .catch((err) => {
            return res.status(400).json({ success: false, msg: err });
          });
      })
      .catch((err) => {
        return res.status(400).json({ success: false, err });
      });
  }
);

// delete an admin
router.delete("/:id", utils.authMiddleware, async (req, res, next) => {
  if (
    !req.jwt.role ||
    !(await utils.checkCredibility(req.jwt.sub, req.jwt.role, DEL_ADMIN, [
      ENABLED,
      VERIFIED,
    ]))
  ) {
    return res.status(401).json({ msg: errorMessages.accessDenied });
  }
  Admin.findByIdAndDelete(req.params.id, async (err, deleted) => {
    if (err || isEmpty(deleted)) {
      return res
        .status(400)
        .json({ success: false, msg: errorMessages.accountDoesNotExist });
    } else {
      if (deleted.email) {
        await utils.sendMail(
          deleted.email,
          "Your Account has deleted",
          adminAccountDelete(deleted)
        );
      }
      if (deleted.image) {
        if (fs.existsSync("uploads/" + deleted.image))
          fs.unlink("uploads/" + deleted.image, (err) => {
            if (err) return res.status(400).json({ success: false, err });
          });
      }
      return res.status(200).json({ success: true, msg: deleted });
    }
  });
});

// toggle enable and disable an admin
router.patch("/:id", utils.authMiddleware, async (req, res, next) => {
  if (
    !req.jwt.role ||
    !(await utils.checkCredibility(req.jwt.sub, req.jwt.role, ENBL_ADMIN, [
      ENABLED,
      VERIFIED,
    ]))
  ) {
    return res.status(401).json({ msg: errorMessages.accessDenied });
  }
  Admin.findById(req.params.id)
    .then((admin) => {
      if (!admin) {
        return res.status(404).json({ msg: errorMessages.accountDoesNotExist });
      }
      admin.enabled = !admin.enabled;
      admin
        .save()
        .then((ret) => {
          return res.status(200).json({ success: true, admin: ret });
        })
        .catch((err) => {
          return res.status(400).json({ success: false, msg: err });
        });
    })
    .catch((err) => {
      return res
        .status(400)
        .json({ success: false, msg: errorMessages.accountDoesNotExist });
    });
});

// complete admin account
router.post(
  "/complete",
  utils.authMiddleware,
  upload.single("file"),
  async (req, res, next) => {
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
    if (!req.file) {
      errors = { ...errors, image: createRequirementErrorMessage("image") };
    }
    if (!isValid) {
      return res.status(400).json({ success: false, errors });
    }
    if (!isEmpty(errors)) {
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) return res.status(400).json({ success: false, err });
        });
      }
      return res.status(400).json({ success: false, errors });
    }
    Admin.findById(req.jwt.sub).then(async (admin) => {
      if (!admin) {
        if (req.file) {
          fs.unlink(req.file.path, (err) => {
            if (err) return res.status(400).json({ success: false, err });
          });
        }
        return res
          .status(404)
          .json({ success: false, msg: errorMessages.accountDoesNotExist });
      }
      if (admin.verified) {
        if (req.file) {
          fs.unlink(req.file.path, (err) => {
            if (err) return res.status(400).json({ success: false, err });
          });
        }
        return res.status(409).json({
          success: false,
          msg: errorMessages.accountAlreadyComplete,
        });
      }
      admin.firstname = firstname.toLowerCase();
      admin.lastname = lastname.toLowerCase();
      admin.phonenumber = phonenumber;
      admin.email = email.toLowerCase();
      admin.image = "admin-prof-" + admin._id.toString();
      await admin
        .save()
        .then(async (ret) => {
          const signedToken = jsonwebtoken.sign(
            {
              sub: admin._id,
            },
            PRIV_KEY,
            {
              expiresIn: "10m",
              algorithm: "RS256",
            }
          );
          EmailHandler.sendEmail(
            "Admin",
            admin.email,
            "Verify your account",
            "Verification",
            adminVerificationLink(admin, signedToken)
          );
          req.objectToPass = {
            success: true,
            msg: successMessages.accountCompleted,
          };

          req.filename = admin.image;

          return next();
        })
        .catch((err) => {
          if (req.file) {
            fs.unlink(req.file.path, (err) => {
              if (err) return res.status(400).json({ success: false, err });
            });
          }
          return res.status(400).json({ success: false, msg: err });
        });
    });
  },
  utils.uploadMiddleware
);

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
    if (verification && verification.sub) {
      Admin.findById(verification["sub"])
        .then(async (admin) => {
          if (!admin) {
            return res.status(404).json({
              success: false,
              msg: errorMessages.verificationNotMatch,
            });
          }
          if (admin.verified) {
            return res.status(400).json({
              success: false,
              msg: errorMessages.accountAlreadyVerified,
            });
          }

          admin.verified = true;
          admin.save().then(async (ret) => {
            await utils.sendMail(
              admin.email,
              "Your account is now verified",
              adminAccountVerified(admin)
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

// Get all employees
router.get("/employees", utils.authMiddleware, async (req, res, next) => {
  if (
    !req.jwt.role ||
    !(await utils.checkCredibility(req.jwt.sub, req.jwt.role, EMPLOYEES, [
      ENABLED,
      VERIFIED,
    ]))
  ) {
    return res
      .status(401)
      .json({ success: false, msg: errorMessages.accessDenied });
  }

  if (!Object.keys(employerEmployee).includes(req.jwt.role)) {
    return res
      .status(400)
      .json({ success: false, msg: errorMessages.accessDenied });
  }
  Admin.find({ role: { $in: employerEmployee[req.jwt.role] } })
    .then((admins) => {
      if (isEmpty(admins)) {
        return res
          .status(404)
          .json({ success: false, msg: errorMessages.accountDoesNotExist });
      }
      admins = admins.map((admin) => {
        return {
          id: admin._id,
          email: admin.email,
          username: admin.username,
          firstname: admin.firstname,
          lastname: admin.lastname,
          role: admin.role,
        };
      });
      return res.status(200).json(admins);
    })
    .catch((err) => {
      return res.status(400).json({ success: false, msg: err });
    });
});

// Delete Employees
router.delete(
  "/employees/:id",
  utils.authMiddleware,
  async (req, res, next) => {
    if (
      !req.jwt.role ||
      !(await utils.checkCredibility(req.jwt.sub, req.jwt.role, DEL_EMP, [
        ENABLED,
        VERIFIED,
      ]))
    ) {
      return res
        .status(401)
        .json({ success: false, msg: errorMessages.accessDenied });
    }
    await Admin.findById(req.params.id)
      .then(async (admin) => {
        if (!admin) {
          return res
            .status(404)
            .json({ success: false, msg: errorMessages.accountDoesNotExist });
        }

        if (
          Object.keys(employerEmployee).includes(req.jwt.role) &&
          employerEmployee[req.jwt.role].includes(admin.role)
        ) {
          await admin.delete().then(async (ret) => {
            await utils.sendMail(
              admin.email,
              "Your account deleted",
              adminAccountDelete(admin)
            );
            if (admin.image) {
              if (fs.existsSync("uploads/" + admin.image))
                fs.unlink("uploads/" + admin.image, (err) => {
                  if (err) return res.status(400).json({ success: false, err });
                });
            }
            return res.status(200).json({ success: true, msg: ret });
          });
        } else {
          return res
            .status(401)
            .json({ success: false, msg: errorMessages.accessDenied });
        }
      })
      .catch((err) => {
        return res.status(400).json({ success: false, msg: err });
      });
  }
);

// Get all customers
router.get("/customers", utils.authMiddleware, async (req, res, next) => {
  if (
    !req.jwt.role ||
    !(await utils.checkCredibility(
      req.jwt.sub,
      req.jwt.role,
      CUSTOMER_MANAGEMENT,
      [ENABLED, VERIFIED]
    ))
  ) {
    return res
      .status(401)
      .json({ success: false, msg: errorMessages.accessDenied });
  }
  User.find()
    .then((users) => {
      if (isEmpty(users)) {
        return res
          .status(404)
          .json({ success: false, msg: errorMessages.accountDoesNotExist });
      }
      users = users.map((user) => {
        return {
          id: user._id,
          firstname: user.firstname,
          lastname: user.lastname,
          phonenumber: user.phonenumber,
          email: user.email,
          username: user.username,
        };
      });
      return res.status(200).json({ success: true, users });
    })
    .catch((err) => {
      return res.status(400).json({ success: false, msg: err });
    });
});

// get customer by id
router.get("/customers/:id", utils.authMiddleware, async (req, res, next) => {
  if (
    !req.jwt.role ||
    !(await utils.checkCredibility(
      req.jwt.sub,
      req.jwt.role,
      CUSTOMER_MANAGEMENT,
      [ENABLED, VERIFIED]
    ))
  ) {
    return res
      .status(401)
      .json({ success: false, msg: errorMessages.accessDenied });
  }
  User.findById(req.params.id)
    .then((user) => {
      if (!user) {
        return res
          .status(404)
          .json({ success: false, msg: errorMessages.accountDoesNotExist });
      }
      user = {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        phonenumber: user.phonenumber,
        email: user.email,
        username: user.username,
      };
      return res.status(200).json({ success: true, user });
    })
    .catch((err) => {
      return res.status(404).json({ success: false, msg: err });
    });
});

// delete customer
router.delete(
  "/customers/:id",
  utils.authMiddleware,
  async (req, res, next) => {
    if (
      !req.jwt.role ||
      !(await utils.checkCredibility(
        req.jwt.sub,
        req.jwt.role,
        CUSTOMER_MANAGEMENT,
        [ENABLED, VERIFIED]
      ))
    ) {
      return res
        .status(401)
        .json({ success: false, msg: errorMessages.accessDenied });
    }
    await User.findByIdAndDelete(req.params.id, async (err, deleted) => {
      if (err || isEmpty(deleted)) {
        return res
          .status(404)
          .json({ success: false, msg: errorMessages.accountDoesNotExist });
      } else {
        await utils.sendMail(
          deleted.email,
          "Your account deleted by our support team",
          userAccountDelete(deleted)
        );
        return res.status(200).json({ success: true, deleted });
      }
    });
  }
);

// TODO: Add forgot password

// TODO: Change information

// TODO: Define each admin under which department
module.exports = router;
