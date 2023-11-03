const express = require("express");
const { UserController } = require("../../controllers/user_controller");
const router = express.Router();

router.get("/:id", UserController.getUser);
router.get("/get_user_by_phone_number/:phone_number", UserController.getUserByPhoneNumber);

router.get("/get_full_user/:id", UserController.getFullUser);
router.post("/change_password/:id", UserController.changePassword);

router.put("/:id", UserController.updateUser);

module.exports = router;
