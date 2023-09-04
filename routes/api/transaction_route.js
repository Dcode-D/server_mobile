const express = require('express');
const { TransactionController } = require('../../controllers/transaction_controller');
const router = express.Router();

router.post('/transfer', TransactionController.createTransferTransaction);
router.get('/:id', TransactionController.getTransaction);

module.exports = router;