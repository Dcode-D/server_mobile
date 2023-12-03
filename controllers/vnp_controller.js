import {Wallet} from "../model/wallet";

const crypto = require("crypto");
const querystring = require('qs');
const { format } = require('date-fns');
const vnpVariables = require('../variables/vnp_variable');
const ip = require('ip');
const moment = require('moment');
const {WalletRepository} = require("../repository/wallet_repository");
const {UserRepository} = require("../repository/user_repository");
const {TransactionRepository} = require("../repository/transaction_repository");
import {AppDataSource} from "../config/database";

//{ var amount = req.body.amount;
// var bankCode = req.body.bankCode;
// var orderInfo = req.body.orderDescription;
// var orderType = req.body.orderType;
// var locale = req.body.language;
// var orderType = req.body.orderType;}
//at route vnp_payment
const  vnp_controller_transfer = async (req, res,next) => {
        try {

                var ipAddr = req.headers['x-forwarded-for'] ||
                    req.connection.remoteAddress ||
                    req.socket.remoteAddress ||
                    req.connection.socket.remoteAddress;

                var tmnCode = vnpVariables.vnp_TmnCode;
                var secretKey = vnpVariables.vnp_HashSecret;
                var vnpUrl = vnpVariables.vnp_Url;
                var returnUrl = formatNgrokUrl();

                var date = new Date();

                var createDate = format(date, 'yyyyMMddHHmmss');
                var orderId = format(date, 'ddHHmmss');
                var amount = req.body.amount;
                var bankCode = req.body.bankCode;
                var orderInfo = req.body.orderDescription;
                var orderType = req.body.orderType;
                var locale = req.body.language;
                if (locale === null || locale === '') {
                        locale = 'vn';
                }
                var currCode = 'VND';
                var vnp_Params = {};
                vnp_Params['vnp_Version'] = '2.1.0';
                vnp_Params['vnp_Command'] = 'pay';
                vnp_Params['vnp_TmnCode'] = tmnCode;
                // vnp_Params['vnp_Merchant'] = ''
                vnp_Params['vnp_Locale'] = locale;
                vnp_Params['vnp_CurrCode'] = currCode;
                vnp_Params['vnp_TxnRef'] = orderId;
                vnp_Params['vnp_OrderInfo'] = orderInfo;
                vnp_Params['vnp_OrderType'] = orderType;
                vnp_Params['vnp_Amount'] = amount * 100;
                vnp_Params['vnp_ReturnUrl'] = returnUrl;
                vnp_Params['vnp_IpAddr'] = ipAddr;
                vnp_Params['vnp_CreateDate'] = createDate;
                if (bankCode !== null && bankCode !== '') {
                        vnp_Params['vnp_BankCode'] = bankCode;
                }

                vnp_Params = sortObject(vnp_Params);
                var signData = querystring.stringify(vnp_Params, {encode: false});

                var hmac = crypto.createHmac("sha512", secretKey);
                let signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");
                vnp_Params['vnp_SecureHash'] = signed;
                vnpUrl += '?' + querystring.stringify(vnp_Params, {encode: false});

                res.status(200).json({url: vnpUrl});
        }catch (e) {
                res.status(500).json({error: e.message});
        }
}
//at route vnp_return
const vnp_controller_return = async function (req, res, next) {
        try {
                var vnp_Params = req.query;
                var secureHash = vnp_Params['vnp_SecureHash'];

                delete vnp_Params['vnp_SecureHash'];
                delete vnp_Params['vnp_SecureHashType'];

                vnp_Params = sortObject(vnp_Params);
                var secretKey = vnpVariables.vnp_HashSecret;

                var signData = querystring.stringify(vnp_Params, {encode: false});
                var hmac = crypto.createHmac("sha512", secretKey);
                var signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");
                console.log(vnp_Params)

                if (secureHash === signed) {
                        var orderId = vnp_Params['vnp_TxnRef'];
                        var rspCode = vnp_Params['vnp_ResponseCode'];
                        if(rspCode === '00'){
                                //TODO: redirect client to success page
                                const transaction = await TransactionRepository.findOne({
                                        where: {id: orderId}
                                });

                                if(transaction){
                                        //here we must use transaction to update database to ensure data consistency
                                        //create query runner to execute transaction
                                        const queryRunner = AppDataSource.createQueryRunner();
                                        await queryRunner.connect();
                                        // lets now open a new transaction:
                                        await queryRunner.startTransaction();
                                        try {
                                                //update user's wallet and transaction
                                                transaction.status = 'SUCCESS';
                                                const wallet = await queryRunner.manager.find(Wallet, {
                                                        where: {id: transaction.to_Wallet}
                                                });
                                                wallet.balance = wallet.balance + transaction.amount;
                                                await queryRunner.manager.save(wallet);
                                                await queryRunner.manager.save(transaction);
                                                // commit transaction now:
                                                await queryRunner.commitTransaction()

                                        }catch (e) {
                                                // since we have errors lets rollback changes we made
                                                await queryRunner.rollbackTransaction();
                                                return res.status(501).json({'message': 'Fail transaction'})
                                        }
                                        finally {
                                                // you need to release query runner which is manually created:
                                                await queryRunner.release();
                                        }
                                        res.status(200).json({RspCode: '00', Message: 'success', 'transaction': transaction});
                                }
                                else {
                                        res.status(404).json({'message': 'Transaction not found'})
                                }

                        }
                        else {
                                res.status(501).json({RspCode: rspCode, Message: 'Fail transaction'})
                        }
                } else {
                        res.status(501).json({RspCode: '97', Message: 'Fail checksum'})
                }
        }
        catch (e) {
                res.status(403).json({RspCode: '99', Message: 'Fail transaction'})
        }
}

function sortObject(obj) {
        let sorted = {};
        let str = [];
        let key;
        for (key in obj){
                if (obj.hasOwnProperty(key)) {
                        str.push(encodeURIComponent(key));
                }
        }
        str.sort();
        for (key = 0; key < str.length; key++) {
                sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
        }
        return sorted;
}
//must run a ngrok server on port of this app first to get the ngrok url, the ngrok subdomain then must be updated in .env file
function formatNgrokUrl() {
        const ngrokSubdomain = process.env.NGROK_SUBDOMAIN || 'randomstring';
        const ngrokBaseUrl = `http://${ngrokSubdomain}.ngrok-free.app/vnp_return`;

        return ngrokBaseUrl;

}

const test_create_vnpay = async function (req, res, next) {

        try {
                process.env.TZ = 'Asia/Ho_Chi_Minh';
                let amount = req.body.amount;
                let bankCode = req.body.bankCode;
                let message = req.body.message;

                let locale = req.body.language;
                if (locale === null || locale === '') {
                        locale = 'vn';
                }
                let currCode = 'VND';
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
                const savedTransaction = await TransactionRepository.save(transaction);

                let date = new Date();
                let createDate = moment(date).format('YYYYMMDDHHmmss');

                let ipAddr = req.headers['x-forwarded-for'] ||
                    req.connection.remoteAddress ||
                    req.socket.remoteAddress ||
                    req.connection.socket.remoteAddress;

                let tmnCode = vnpVariables.vnp_TmnCode;
                let secretKey = vnpVariables.vnp_HashSecret;
                let vnpUrl = vnpVariables.vnp_Url;
                let returnUrl = formatNgrokUrl();
                let orderId = savedTransaction.id;

                let vnp_Params = {};
                vnp_Params['vnp_Version'] = '2.1.0';
                vnp_Params['vnp_Command'] = 'pay';
                vnp_Params['vnp_TmnCode'] = tmnCode;
                vnp_Params['vnp_Locale'] = locale;
                vnp_Params['vnp_CurrCode'] = currCode;
                vnp_Params['vnp_TxnRef'] = orderId;
                vnp_Params['vnp_OrderInfo'] = message;
                vnp_Params['vnp_OrderType'] = 'other';
                vnp_Params['vnp_Amount'] = amount * 100;
                vnp_Params['vnp_ReturnUrl'] = returnUrl;
                vnp_Params['vnp_IpAddr'] = ipAddr;
                vnp_Params['vnp_CreateDate'] = createDate;
                if (bankCode !== null && bankCode !== ''&& bankCode !== undefined) {
                        vnp_Params['vnp_BankCode'] = bankCode;
                }

                vnp_Params = sortObject(vnp_Params);

                let querystring = require('qs');
                let signData = querystring.stringify(vnp_Params, {encode: false});
                let crypto = require("crypto");
                let hmac = crypto.createHmac("sha512", secretKey);
                let signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");
                vnp_Params['vnp_SecureHash'] = signed;
                vnpUrl += '?' + querystring.stringify(vnp_Params, {encode: false});

                res.json({code: '00', data: vnpUrl});
        }
        catch (e) {
                res.status(500).json({error: e.message});
        }

}



module.exports = {vnp_controller_transfer,vnp_controller_return, test_create_vnpay}