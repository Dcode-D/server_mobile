const express = require('express')
const router = express.Router()
const {verifyJWT} = require("./auth/auth_strategy");
const{vnp_controller_transfer, vnp_controller_return,test_create_vnpay} = require("../controllers/vnp_controller");

router.get("/vnp_test", (req, res) => {
    res.send("HELLO");
    });
router.get("/vnp_return", vnp_controller_return);
router.post("/vnp_payment", verifyJWT,test_create_vnpay);

module.exports = router;