const express = require("express");
const { NFCController } = require("../../controllers/nfc_controller");
const router = express.Router();
const {verifyJWT} = require("../auth/auth_strategy");

router.post("/nfc_transaction",verifyJWT, NFCController.createTransaction);

module.exports = router;
