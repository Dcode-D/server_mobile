const express = require("express");
const passport = require("passport");
const {
  localStrategy,
  verifyLocalStrategy,
  verifyJWT,
  JWTStrategy,
} = require("../auth/auth_strategy");
const router = express.Router();
const { UserController } = require("../../controllers/user_controller");
const { OTPController } = require("../../controllers/otp_controller");
const {
  encryptMiddleware,
  decryptMiddleware,
} = require("../middleware/crypto_middleware");
const { generateToken } = require("./auth_method");
const { UserRepository } = require("../../repository/user_repository");
const { WalletRepository } = require("../../repository/wallet_repository");

passport.use("local", localStrategy);
passport.use("jwt", JWTStrategy);

router.post("/login", verifyLocalStrategy, async (req, res) => {
  const user = req.user;
  const device = req.body.device;
  const deviceToken = req.body.deviceToken;
  if (!user) {
    return res.status(401).send("Incorrect username or password");
  }
  const payload = {
    sub: user.id,
    iat: Math.floor(Date.now() / 1000),
  };
  const accessToken = await generateToken(payload, process.env.SECRET_KEY);
  if (!accessToken) {
    return res.status(500).send("Can't login right now, try again later");
  }

  user.device = device;
  user.device_token = deviceToken;

  await UserRepository.save(user);

  const json = {
    user,
    AUTHENTICATION_STATUS: true,
    accessToken,
  };
  return res.json(json);
});

router.post("/admin_login", async (req, res) => {
  try{
    const {username, password} = req.body;
    if(username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD){
      return res.status(401).send("Incorrect username or password");
    }
    else {
      const payload = {
        sub: 0,
        iat: Math.floor(Date.now() / 1000),
        admin: true
      }
      const accessToken = await generateToken(payload, process.env.SECRET_KEY);
      if (!accessToken) {
        return res.status(500).send("Can't login right now, try again later");
      }
      else {
        return res.json({
          AUTHENTICATION_STATUS: true,
          accessToken,
        });
      }
    }
  }
    catch(err){
        console.log(err);
        return res.status(500).send("Can't login right now, try again later");
    }
});

router.post("/register", UserController.register);

router.post("/verify_otp",verifyJWT, OTPController.verifyOTPRequest);

router.get("/verify", verifyJWT, (req, res) => {
  res.status(200).json({
    msg: "Verify successful",
    AUTHENTICATION_STATUS: true,
    user: req.user,
  });
});

module.exports = router;
