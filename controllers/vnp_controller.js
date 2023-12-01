const crypto = require("crypto");
const querystring = require('qs');
const { format } = require('date-fns');
const vnpVariables = require('../variables/vnp_variable');
const ip = require('ip');
const moment = require('moment');

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
const vnp_controller_return = function (req, res, next) {
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
                        //Kiem tra du lieu co hop le khong, cap nhat trang thai don hang va gui ket qua cho VNPAY theo dinh dang duoi
                        res.status(200).json({RspCode: '00', Message: 'success'})
                } else {
                        res.status(200).json({RspCode: '97', Message: 'Fail checksum'})
                }
        }
        catch (e) {
                res.status(200).json({RspCode: '99', Message: 'Fail transaction'})
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

const test_create_vnpay = function (req, res, next) {

        process.env.TZ = 'Asia/Ho_Chi_Minh';

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
        let orderId = moment(date).format('DDHHmmss');
        let amount = req.body.amount;
        let bankCode = req.body.bankCode;

        let locale = req.body.language;
        if (locale === null || locale === '') {
                locale = 'vn';
        }
        let currCode = 'VND';
        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = locale;
        vnp_Params['vnp_CurrCode'] = currCode;
        vnp_Params['vnp_TxnRef'] = orderId;
        vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD:' + orderId;
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



module.exports = {vnp_controller_transfer,vnp_controller_return, test_create_vnpay}