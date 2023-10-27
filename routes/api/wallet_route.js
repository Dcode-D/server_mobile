const express = require("express");
const { WalletController } = require("../../controllers/wallet_controller");
const router = express.Router();

router.get("/:user_id", WalletController.getWallets);
router.get("/user_wallet/:wallet_id", WalletController.getUserWallet);
router.post("/:user_id", WalletController.createWallet)

module.exports = router;
