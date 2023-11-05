const express = require("express");
const { NFCController } = require("../../controllers/nfc_controller");
const router = express.Router();

router.post("/nfc_transaction", NFCController.createTransaction);

module.exports = router;
