const express = require('express')
const router = express.Router()
const {VerifyAdminJWT} = require("../Utils/VerifyAdminJWT");
const {UserController} = require("../controllers/user_controller");
const {TransactionController} = require("../controllers/transaction_controller");

router.get("/get_all_users/:page", VerifyAdminJWT, UserController.getAllUsers);
router.get ("/get_user/:id",VerifyAdminJWT,UserController.getFullUser);
router.get("/get_user_transactions/:user_id",VerifyAdminJWT,TransactionController.getTransactions)
router.post("/set_user_status/:id",VerifyAdminJWT,UserController.setUserStatusUser)

module.exports = router;