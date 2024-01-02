require("reflect-metadata");
require("dotenv").config();
const admin = require("firebase-admin");
const express = require("express");
const passport = require("passport");
const vnpRoute = require("./routes/vnp");

const RunApp = async () => {
  //Initialize server
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(
    passport.initialize({
      session: false,
    })
  );
  //#region ORM DBA
  const AppDataSource = require("./config/database").AppDataSource;
  await AppDataSource.initialize();
  //#endregion

  //#region Routes
  app.get("/", (req, res) => {
    res.send("HELLO");
  });

  const authRoute = require("./routes/auth/auth");
  const apitRoute = require("./routes/api/api_routes");
  const nfcRoute = require("./routes/api/nfc_routes");
  const vnpRoute = require("./routes/vnp");
  const paypalRoute = require("./routes/paypal");
  const adminRoute = require("./routes/admin");
  app.get('/test_sms', (req, res) => {
    const {sendSMS} = require('./method/sms_method');
    sendSMS('123456',"0919386768");
    res.status(200).json({message: 'ok'});
  })
  app.use(authRoute);
  app.use('/admin',adminRoute);
  app.use(nfcRoute);
  app.use(vnpRoute);
  app.use(paypalRoute);
  app.use(apitRoute);
  app.use(( req, res, next) => {
    // Handle the error here or send an error response to the client
    res.status(404).json({ error: 'Not found' });
  });
  //#endregion
  const PORT = parseInt(process.env.PORT) || 3000;
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
};

RunApp().then(() => {
  console.log("server is running");
});
