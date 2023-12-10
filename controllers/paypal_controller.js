import {WalletRepository} from "../repository/wallet_repository";
import {UserRepository} from "../repository/user_repository";
import {TransactionRepository} from "../repository/transaction_repository";
import {AppDataSource} from "../config/database";
import {Wallet} from "../model/wallet";
import {Transaction} from "../model/transaction";

const paypalSdk = require('paypal-rest-sdk');
const paypalVariable = require('../variables/paypal_variable');
const  {formatNgrokUrl} = require('../Utils/NgrokFormat');

//configure paypal
paypalSdk.configure({
    'mode': paypalVariable.paypal_Mode,
    'client_id': paypalVariable.paypal_ClientID,
    'client_secret': paypalVariable.paypal_SecretKey
});

const paypalDeposit = async (req, res) => {
    try {
        //getting data from request body
        const amount = req.body.amount;
        const message = req.body.message;
        const rate = 24000;
        //create transaction
        const to = req.user.id;
        if(!to) return res.status(401).json({message: 'Unauthorized'});

        const to_Wallet = await WalletRepository.findOne({
            where: { id: to },
            relations: { user: true },
        });

        const to_User = await UserRepository.findOne({
            where: { id: to_Wallet.user.id },
        });

        if (!to_Wallet) return res.status(404);

        const transaction = TransactionRepository.create({
            type: "Deposit",
            from_User: to,
            to_User: to,
            from_Wallet: to_Wallet.id,
            to_Wallet: to_Wallet.id,
            amount: amount,
            message: message,
            time: new Date(),
            status: "Pending",
            user: to_User,
        });
        await TransactionRepository.save(transaction);

        const successUrl = formatNgrokUrl('paypal_success');
        const cancelUrl = formatNgrokUrl('paypal_cancel');
        const usdamt = (Math.round(amount / rate * 100) / 100).toFixed(2);
        //handle paypal payment
        // create payment object
        var create_payment_json = {
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": successUrl,
                "cancel_url": cancelUrl
            },
            "transactions": [{
                "item_list": {
                    "items": [{
                        "name": transaction.id,
                        "sku": "item",
                        "price": usdamt,
                        "currency": "USD",
                        "quantity": 1
                    }]
                },
                "amount": {
                    "currency": "USD",
                    "total": usdamt
                },
                "description": message?message:'Deposit'
            }]
        };
        paypalSdk.payment.create(create_payment_json, function (error, payment) {
            if (error) {
                console.log(error);
                return res.status(501).json({ error: error });
            } else {
                for (let i = 0; i < payment.links.length; i++) {
                    if (payment.links[i].rel === 'approval_url') {
                        // res.redirect(payment.links[i].href);
                        return res.status(200).json({url: payment.links[i].href});
                    }
                }
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error });
    }
}

const paypalSuccess = async (req, res) => {
    try{
        //TODO: Handle success on client side
        const paymentId = req.query.paymentId;
        const payerId = { "payer_id": req.query.PayerID };
        await paypalSdk.payment.execute(paymentId, payerId, async function (error, paypalPayment) {
            if (error) {
                console.error(error);
                res.send(error);
                throw error;
            } else {
                if(!paypalPayment) return res.status(500).json({error: 'Payment not found'});
                const paypalTransaction = paypalPayment.transactions;
                if(!paypalTransaction) return res.status(500).json({error: 'Transaction not found'});
                const transactionId = paypalTransaction[0].item_list.items[0].name;
                const transaction = await TransactionRepository.findOne({
                    where: { id: transactionId },
                })
                if(!transaction) return res.status(500).json({error: 'Transaction not found'});
                if(transaction.status !== 'Pending') return res.status(500).json({error: 'Transaction is not pending'});
                const queryRunner = AppDataSource.createQueryRunner();
                await queryRunner.connect();
                // lets now open a new transaction:
                await queryRunner.startTransaction();
                //handle transaction on wallets
                try {
                    const to_Wallet = await WalletRepository.findOne({
                        where: { id: transaction.to_Wallet },
                        relations: { user: true },
                    });
                    if (!to_Wallet) return res.status(404);
                    const to_User = await UserRepository.findOne({
                        where: { id: to_Wallet.user.id },
                    });
                    if (!to_User) return res.status(404);
                    const amount = transaction.amount;
                    to_Wallet.balance = to_Wallet.balance + amount;
                    transaction.status = 'Success';
                    await queryRunner.manager.save(to_Wallet);
                    await queryRunner.manager.save(transaction);
                    await queryRunner.commitTransaction();
                    return res.status(200).json({message: 'Success',wallet: to_Wallet});
                }catch (e) {
                    await queryRunner.rollbackTransaction();
                    return res.status(501).json({'message': 'Fail transaction'})
                }
                finally {
                    await queryRunner.release();
                }
            }
        });

    }
    catch (e) {
        console.log(e);
        res.status(500).json({ error: e });
    }

}

const paypalCancel = async (req, res) => {
    //TODO: Handle cancel on client side
    res.send('Cancelled');
}

module.exports = { paypalDeposit, paypalSuccess, paypalCancel };

