const crypto = require("crypto");
const jsonwebtoken = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Admin = mongoose.model("Admin");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");

// Keys
const pathToKey = path.join(__dirname, "..", "id_rsa_priv.pem");
const pathToPubKey = path.join(__dirname, "..", "id_rsa_pub.pem");
const PRIV_KEY = fs.readFileSync(pathToKey, "utf8");
const PUB_KEY = fs.readFileSync(pathToPubKey, "utf8");

// Constants
const { hierarchy } = require("../constants");

// Email Setup
const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = "https://developers.google.com/oauthplayground";
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL;
const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

/**
 *
 * @param {*} password - The plain text password
 * @param {*} hash - The hash stored in the database
 * @param {*} salt - The salt stored in the database
 *
 * This function uses the crypto library to decrypt the hash using the salt and then compares
 * the decrypted hash/salt with the password that the user provided at login
 */
function validPassword(password, hash, salt) {
  var hashVerify = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return hash === hashVerify;
}

/**
 *
 * @param {*} password - The password string that the user inputs to the password field in the register form
 *
 * This function takes a plain text password and creates a salt and hash out of it.  Instead of storing the plaintext
 * password in the database, the salt and hash are stored for security
 *
 * ALTERNATIVE: It would also be acceptable to just use a hashing algorithm to make a hash of the plain text password.
 * You would then store the hashed password in the database and then re-hash it to verify later (similar to what we do here)
 */
function genPassword(password) {
  var salt = crypto.randomBytes(32).toString("hex");
  var genHash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");

  return {
    salt: salt,
    hash: genHash,
  };
}

/**
 * @param {*} user - The user object.  We need this to set the JWT `sub` payload property to the MongoDB user ID
 */
function issueJWT(user) {
  const _id = user._id;

  const expiresIn = "1d";

  let payload = {
    sub: _id,
    iat: Date.now(),
  };

  if (user.role) {
    payload.role = user.role;
  }
  const signedToken = jsonwebtoken.sign(payload, PRIV_KEY, {
    expiresIn: expiresIn,
    algorithm: "RS256",
  });

  return {
    token: "Bearer " + signedToken,
    expires: expiresIn,
  };
}



/**
 * This is an authentication middleware function
 */
function authMiddleware(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(401).json({
      success: false,
      msg: "You are not authorized to visit this route",
    });
  }
  const tokenParts = req.headers.authorization.split(" ");
  if (
    tokenParts.length > 0 &&
    tokenParts[0] === "Bearer" &&
    tokenParts[1].match(/\S+\.\S+\.\S+/) !== null
  ) {
    try {
      const verification = jsonwebtoken.verify(tokenParts[1], PUB_KEY, {
        algorithms: ["RS256"],
      });
      req.jwt = verification;
      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        msg: "You are not authorized to visit this route",
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      msg: "You are not authorized to visit this route",
    });
  }
}

/**
 *
 * @param {*} admin_id - The admin Object ID
 * @param {*} role - The role which is in JWT token
 * @param {*} atributeArray - All required attributes that admin needs to have
 *
 * This function uses the admin id and role and an array off atributes
 */
async function checkAdminRoleById(admin_id, role, atributeArray) {
  return await Admin.findById(admin_id)
    .then((admin) => {
      if (!admin) return false;
      if (admin.role !== role) return false;
      for (let i = 0; i < atributeArray.length; i++) {
        if (!admin[atributeArray[i]]) {
          return false;
        }
      }
      return true;
    })
    .catch((err) => {
      return false;
    });
}

/**
 *
 * @param {*} admin_id - The admin Object ID
 * @param {*} role - The role which is in JWT token
 * @param {*} action - The action that would be checked to find if the admin is eligible
 *
 * This function uses the admin id and role to find if the admin is eligible
 */
async function checkCredibility(admin_id, role, action, atributeArray = []) {
  let isRoleAvailable = Object.keys(hierarchy).includes(role);
  let isActionAvailable = hierarchy[role].includes(action);
  let isAdminAndRoleMatch = await checkAdminRoleById(
    admin_id,
    role,
    atributeArray
  );
  return isAdminAndRoleMatch && isRoleAvailable && isActionAvailable;
}


/**
 * This function converts a vaild date text to milliseconds
 */
function textDateToMillisec(text) {
  let miltiplier = 1;
  switch (text.slice(-1)) {
    case "s":
      miltiplier = 1000;
      break;
    case "m":
      miltiplier = 1000 * 60;
      break;
    case "h":
      miltiplier = 1000 * 60 * 60;
      break;
    case "d":
      miltiplier = 1000 * 60 * 60 * 24;
      break;
    case "w":
      miltiplier = 1000 * 60 * 60 * 24 * 7;
      break;
    case "M":
      miltiplier = 1000 * 60 * 60 * 24 * 30;
      break;
    case "y":
      miltiplier = 1000 * 60 * 60 * 24 * 365;
      break;
    default:
      miltiplier = 0;
  }
  return miltiplier * parseInt(text.slice(0, -1));
}

/**
 *
 * @param {*} toEmail - Receiver email
 * @param {*} subject - Subject of the email
 * @param {*} mailBody - The html mail template
 * @param {*} fromEmail - From email
 *
 * This function takes 4 parameters and send email via google api mail
 */

async function sendMail(toEmail, subject, mailBody, fromEmail = SUPPORT_EMAIL) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.SUPPORT_EMAIL,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });
    const mailOptions = {
      from: `Support <${fromEmail}>`,
      to: toEmail,
      subject: subject,
      text: "boo",
      html: mailBody,
    };
    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (err) {
    return err;
  }
}

/**
 * This is an upload middleware function
 */

function uploadMiddleware(req, res, next) {
  const tempPath = req.file.path;
  const filename = req.filename;
  if (
    [".png", ".jpg", ".jpeg", ".webp", "mp4"].includes(
      path.extname(req.file.originalname).toLowerCase()
    )
  ) {
    const targetPath = path.join(
      __dirname,
      `../uploads/${filename}${path
        .extname(req.file.originalname)
        .toLowerCase()}`
    );
    fs.rename(tempPath, targetPath, (err) => {
      if (err) return res.status(400).json({ success: false, err });
    });
    if (req.objectToPass) {
      return res.status(200).json(req.objectToPass);
    }
    return res.status(200).json({});
  } else {
    fs.unlink(tempPath, (err) => {
      if (err) return res.status(400).json({ success: false, err });
    });
    return res
      .status(403)
      .json("You're only alowed upload webp, jpg, jpeg, png, PNG, mp4");
  }
}

module.exports.validPassword = validPassword;
module.exports.genPassword = genPassword;
module.exports.issueJWT = issueJWT;
module.exports.authMiddleware = authMiddleware;
module.exports.checkAdminRoleById = checkAdminRoleById;
module.exports.checkCredibility = checkCredibility;
module.exports.textDateToMillisec = textDateToMillisec;
module.exports.sendMail = sendMail;
module.exports.uploadMiddleware = uploadMiddleware;
