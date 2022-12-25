const path = require("path");
const router = require("express").Router();

// Test Api
router.get("/api/v1/status", async (req, res, next) => {
  return res.status(200).json({ success: true, msg: "API is up" });
});

router.use("/images", require(path.join(__dirname, "./images")));
router.use("/api/v1/users", require(path.join(__dirname, "./users")));
router.use("/api/v1/admins", require(path.join(__dirname, "./admins")));
router.use("/api/v1/orders", require(path.join(__dirname, "./orders")));
router.use("/api/v1/financials", require(path.join(__dirname, "./financials")));
router.use("/api/v1/contacts", require(path.join(__dirname, "./contacts")));

module.exports = router;
