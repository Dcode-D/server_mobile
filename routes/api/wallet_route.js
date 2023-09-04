const express = require("express");
const { WalletController } = require("../../controllers/wallet_controller");
const router = express.Router();

router.get("/:phone_number", WalletController.getWallets);

router.post("/:phone_number", WalletController.createWallet)

module.exports = router;
