const express = require("express");
const { UserController } = require("../../controllers/user_controller");
const router = express.Router();

router.get("/", function (req, res) {
  res.send("Welcome");
});

router.get("/:id", UserController.getUser)
router.post("/changepassword/:id", UserController.changePassword);

module.exports = router;
