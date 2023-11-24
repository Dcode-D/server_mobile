const { OTPRepository } = require("../repository/otp_repository");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

exports.verifyOTP = async (otpCode, phone_number) => {
    const result = await OTPRepository.findOne({
        where: { otp: otpCode },
        relations:{user:true, transaction: true}
    })
    return result ? result : null;
}


exports.otpGenerator = () => {
    let otp = "";

    for (let i = 0; i < 6; i++) {
      otp += Math.floor(Math.random() * 10);
    }

    return otp;
  };

exports.sendSMS = (otpCode, phone_number) =>{
    phone_number = phone_number.substring(1);
    client.messages
      .create({
        body: "Đây là mã OTP: " + otpCode,
        from: "+19036183400",
        to: "+84" + phone_number,
      })
      .then((message) => console.log(message.sid))
      .catch((error) => console.log(error));
  }

