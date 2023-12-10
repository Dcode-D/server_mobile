const express = require('express')
const router = express.Router()
const {verifyJWT} = require("./auth/auth_strategy");
const paypal_controller = require("../controllers/paypal_controller");

router.get("/paypal_success", paypal_controller.paypalSuccess);
router.get("/paypal_cancel", paypal_controller.paypalCancel);
router.post("/paypal_deposit", verifyJWT, paypal_controller.paypalDeposit);
router.post("/paypal_withdraw", verifyJWT, paypal_controller.paypalPayout);

module.exports = router;