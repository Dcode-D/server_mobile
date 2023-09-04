const express = require("express");
const { UserController } = require("../../controllers/user_controller");
const router = express.Router();

router.get("/", function (req, res) {
  res.send("Welcome");
});

router.get("/:phone_number", UserController.getUser)
router.post("/changepassword/:phone_number", UserController.changePassword);

module.exports = router;
