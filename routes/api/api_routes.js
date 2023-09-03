const express = require('express')
const router = express.Router()
const {verifyJWT} = require("../auth/auth_strategy");

router.use(verifyJWT);

router.use('/transaction', require('./transaction_route'));
router.use("/user", require("./user_route"));
router.use("/promotion", require("./promotion_route"));
router.use("/wallet", require("./wallet_route"));

module.exports = router;