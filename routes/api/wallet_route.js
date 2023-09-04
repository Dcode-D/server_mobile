const express = require("express");
const { WalletController } = require("../../controllers/wallet_controller");
const router = express.Router();

router.get("/:id", WalletController.getWallets);

router.post("/:id", WalletController.createWallet)

module.exports = router;
