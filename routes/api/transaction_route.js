const express = require('express');
const { TransactionController } = require('../../controllers/transaction_controller');
const router = express.Router();

router.post('/:phone_number', TransactionController.createHistory);
router.get('/:phone_number', TransactionController.getHistory);

module.exports = router;