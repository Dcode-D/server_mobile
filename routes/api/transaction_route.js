const express = require('express');
const { TransactionController } = require('../../controllers/transaction_controller');
const router = express.Router();

router.post('/create_transfer', TransactionController.createTransferTransaction);
router.post('/create_transaction', TransactionController.createTransaction);
router.get('/:id', TransactionController.getTransactions);

module.exports = router;