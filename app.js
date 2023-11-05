require("reflect-metadata");
require("dotenv").config();
const admin = require("firebase-admin");
const express = require("express");
const passport = require("passport");

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
  app.post("/", (req, res) => {
    res.send("HELLO");
  });

  const authRoute = require("./routes/auth/auth");
  const apitRoute = require("./routes/api/api_routes");
  const nfcRoute = require("./routes/api/nfc_routes");
  app.use(authRoute);
  app.use(nfcRoute);
  app.use(apitRoute);
  //#endregion
  const PORT = parseInt(process.env.PORT) || 3000;
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
};

RunApp().then(() => {
  console.log("server is running");
});
