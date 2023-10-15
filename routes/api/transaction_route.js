const express = require('express');
const { OTPController } = require('../../controllers/otp_controller');
const { TransactionController } = require('../../controllers/transaction_controller');
const router = express.Router();

router.post('/create_transfer', TransactionController.createTransferTransaction);
router.post('/create_transaction', TransactionController.createTransaction);
router.get('/:user_id', TransactionController.getTransactions);

module.exports = router;