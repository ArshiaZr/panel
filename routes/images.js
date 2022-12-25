const path = require("path");
const fs = require("fs");
const router = require("express").Router();

// Get image by name
router.get("/:image_name", (req, res) => {
  const filepath = path.join(__dirname, `../uploads/${req.params.image_name}`);
  try {
    if (fs.existsSync(filepath)) {
      return res.sendFile(filepath);
    } else {
      return res.status(404).json({ success: false, msg: "Not found" });
    }
  } catch (err) {
    return res.status(404).json({ success: false, err });
  }
});

module.exports = router;
