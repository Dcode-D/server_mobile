const express = require("express");
const { WalletController } = require("../../controllers/wallet_controller");
const router = express.Router();

router.get("/:user_id", WalletController.getWallets);
router.get("/get_user_by_wallet/:wallet_id", WalletController.getUserByWallet);
router.post("/:user_id", WalletController.createWallet)

module.exports = router;
