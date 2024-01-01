import {WalletRepository} from "../repository/wallet_repository";
import {UserRepository} from "../repository/user_repository";
import {TransactionRepository} from "../repository/transaction_repository";
import {AppDataSource} from "../config/database";
import {Wallet} from "../model/wallet";
import {Transaction} from "../model/transaction";
import {verifyOTP} from "../method/sms_method";
import {OtpType} from "../model/otp";

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
            type: "DEPOSIT",
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
                return res.status(501).json({ error: 'No redirect URL found' });
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error });
    }
}

const paypalSuccess = async (req, res) => {
    try{
        const paymentId = req.query.paymentId;
        const payerId = { "payer_id": req.query.PayerID };
        await paypalSdk.payment.execute(paymentId, payerId, async function (error, paypalPayment) {
            if (error) {
                console.error(error);
                res.redirect(`payment-info/return?status=fail&transactionId=Unknown&message=Fail`)
                throw error;
            } else {
                if(!paypalPayment) return res.redirect(`payment-info/return?status=fail&transactionId=Unknown&message=Fail`)
                const paypalTransaction = paypalPayment.transactions;
                if(!paypalTransaction) return res.redirect(`payment-info/return?status=fail&transactionId=Unknown&message=Fail`)
                const transactionId = paypalTransaction[0].item_list.items[0].name;
                const transaction = await TransactionRepository.findOne({
                    where: { id: transactionId },
                })
                if(!transaction) return res.redirect(`payment-info/return?status=fail&transactionId=Unknown&message=Fail`)
                let msg = encodeURIComponent("Invalid transaction!")
                if(transaction.status !== 'Pending') return res.redirect(`payment-info/return?status=fail&transactionId=${transaction.id}&message=${msg}`)
                const to_Wallet = await WalletRepository.findOne({
                    where: { id: transaction.to_Wallet },
                    relations: { user: true },
                });
                if (!to_Wallet) return res.status(404);
                const queryRunner = AppDataSource.createQueryRunner();
                await queryRunner.connect();
                // lets now open a new transaction:
                await queryRunner.startTransaction();
                //handle transaction on wallets
                try {
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

                }catch (e) {
                    await queryRunner.rollbackTransaction();
                    transaction.status = 'Fail';
                    await queryRunner.manager.save(transaction);
                    res.redirect(`payment-info/return?status=fail&transactionId=${transaction.id}&message=Fail`)
                }
                finally {
                    await queryRunner.release();
                }
                // return res.status(200).json({message: 'Success',wallet: to_Wallet});
                res.redirect(`payment-info/return?status=success&transactionId=${transaction.id}&message=Success`)
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
    const paymentId = req.query.paymentId;
    const payerId = { "payer_id": req.query.PayerID };
    await paypalSdk.payment.execute(paymentId, payerId, async function (error, paypalPayment) {
        if (error) {
            console.error(error);
            res.redirect(`payment-info/return?status=fail&transactionId=Unknown&message=Fail`)
            throw error;
        } else {
            if (!paypalPayment) return res.redirect(`payment-info/return?status=fail&transactionId=Unknown&message=Fail`)
            const paypalTransaction = paypalPayment.transactions;
            if (!paypalTransaction) return res.redirect(`payment-info/return?status=fail&transactionId=Unknown&message=Fail`)
            const transactionId = paypalTransaction[0].item_list.items[0].name;
            const transaction = await TransactionRepository.findOne({
                where: {id: transactionId},
            })
            if(!transaction) return res.redirect(`payment-info/return?status=fail&transactionId=Unknown&message=Fail`)
            transaction.status = 'Cancel';
            await TransactionRepository.save(transaction);
            res.redirect(`payment-info/return?status=fail&transactionId=${transaction.id}&message=Cancel`)
        }
    });
}

const paypalPayout = async (req, res) => {
    try {

        const otp = req.body.otp;
        const phone_number = req.body.phone_number;
        const email = req.body.email;

        const result = await verifyOTP(otp, phone_number);
        if (!result) {
            return res.status(404).json("OTP is not valid!");
        }
        if (result.otp_type == OtpType.TRANSACTION) {
            const wallet = result.transaction.to_Wallet ? result.transaction.to_Wallet : result.transaction.from_Wallet;
            const transaction = result.transaction;
            if (!transaction||transaction.status!=='Pending') return res.status(404).json("Invalid transaction !");
            if (!wallet) return res.status(404).json("Invalid wallet !");
            const withWallet = await WalletRepository.findOne({where: {id: wallet}});
            if (withWallet.balance < transaction.amount){
                transaction.status = 'Fail';
                await TransactionRepository.save(transaction);
                return res.status(404).json("Not enough money !");
            }
            const rate = 24000;
            const usdamt = (Math.round(transaction.amount / rate * 100) / 100).toFixed(2);
            var sender_batch_id = Math.random().toString(36).substring(9);
            var create_payout_json = {
                "sender_batch_header": {
                    "sender_batch_id": sender_batch_id,
                    "email_subject": "You have a payment"
                },
                "items": [
                    {
                        "recipient_type": "EMAIL",
                        "amount": {
                            "value": usdamt,
                            "currency": "USD"
                        },
                        "receiver": email,
                        "note": transaction.message,
                        "sender_item_id": "item_3"
                    }
                ]
            };
            paypalSdk.payout.create(create_payout_json, 'false', async function (error, payout) {
                if (error) {
                    return res.status(404).json(error);
                } else {
                    if(payout.httpStatusCode!==201) return res.status(404).json("Fail transaction");
                    paypalSdk.payout.get(payout.batch_header.payout_batch_id, async function (error, payout) {
                       if(error){
                           transaction.status = 'Fail';
                            await TransactionRepository.save(transaction);
                            return res.status(503).json(error);
                       }
                       else {
                           const queryRunner = AppDataSource.createQueryRunner();
                           await queryRunner.connect();
                           // lets now open a new transaction:
                           await queryRunner.startTransaction();
                           //handle transaction on wallets
                           try {
                               withWallet.balance = withWallet.balance - transaction.amount;
                               transaction.status = 'Success';
                               await queryRunner.manager.save(withWallet);
                               await queryRunner.manager.save(transaction);
                               await queryRunner.commitTransaction();
                               return res.status(200).json({message: 'Success',wallet: withWallet, payout: payout});
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
            });
        } else {
            return res.status(404).json("OTP is not valid!");
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error });
    }

}

module.exports = { paypalDeposit, paypalSuccess, paypalCancel, paypalPayout };

