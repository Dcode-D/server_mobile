const express = require('express')
const router = express.Router()
const {verifyJWT} = require("./auth/auth_strategy");
const{vnp_controller_transfer, vnp_controller_return,test_create_vnpay, vnp_create_token, vnp_create_token_cancel} = require("../controllers/vnp_controller");

router.get("/vnp_test", (req, res) => {
    res.send("HELLO");
    });
router.get('/vnp_create_token_return', vnp_controller_return);
router.get("/vnp_create_token_return_cancel", vnp_create_token_cancel);
router.get("/vnp_return", vnp_controller_return);
router.post("/vnp_create_token", verifyJWT, vnp_create_token);
router.post("/vnp_payment",verifyJWT,test_create_vnpay);

module.exports = router;