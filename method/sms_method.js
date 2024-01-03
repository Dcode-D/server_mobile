const { OTPRepository } = require("../repository/otp_repository");
const axios = require("axios");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const speedSMS_token = process.env.SPEED_TOKEN;
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
    if(phone_number===undefined||phone_number===null||phone_number===""){
        //set default phone number
        //must be removed in production
        phone_number = "919386768"
    }
    else{
        if(phone_number.charAt(0) === '0')
            phone_number = phone_number.substring(1);
    }
    // twilio_method(otpCode, phone_number)
    // speedSMS_method(otpCode, phone_number)
    twilio_method_whatsapp(otpCode, phone_number)
  }

  const twilio_method = (otpCode, phone_number) => {

      client.messages
          .create({
              body: otpCode,
              from: "+18179694239▲",
              to: "+84" + phone_number,
          })
          .then((message) => console.log(message.sid))
          .catch((error) => console.log(error));
  }

  twilio_method_whatsapp = (otpCode, phone_number) => {
        client.messages
            .create({
                body: otpCode,
                from: "whatsapp:+14155238886",
                to: "whatsapp:+84" + phone_number,
            })
            .then((message) => console.log(message.sid))
            .catch((error) => console.log(error));
  }

  speedSMS_method = (otpCode, phone_number) => {
      const apiUrl = 'https://api.speedsms.vn/index.php/sms/send';

      const requestData = {
          to: ["84"+phone_number],
          content: otpCode,
          sms_type: 2,
          sender: "84919386768"
      };

      const headers = {
          'Content-Type': 'application/json'
      };

      const config = {
          auth: {
              username: speedSMS_token,
              password: ''
          }
      };

      axios.post(apiUrl, requestData, { headers, ...config })
          .then(response => {
              console.log('API response:', response.data);
          })
          .catch(error => {
              console.error('Error making API call:', error.message);
          });

  }

