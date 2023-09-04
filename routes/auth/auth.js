const express = require('express');
const passport = require('passport');
const {localStrategy, verifyLocalStrategy, verifyJWT, JWTStrategy} = require('../auth/auth_strategy');
const router = express.Router();;
const { UserController } = require('../../controllers/user_controller');
const { UserRepository } = require('../../repository/user_repository');
const {encryptMiddleware, decryptMiddleware} = require("../middleware/crypto_middleware");
const { generateToken } = require('./auth_method');

passport.use('local', localStrategy);
passport.use('jwt', JWTStrategy)

router.post('/login', verifyLocalStrategy, async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).send('Incorrect username or password');
    }
    const payload = {
        sub: user.phone_number,
        iat: Math.floor(Date.now() / 1000),
    }
    const accessToken = await generateToken(payload, process.env.SECRET_KEY)
    if(!accessToken) {
        return res.status.send('Can\'t login right now, try again later');
    }
    const json = {
        user,
        AUTHENTICATION_STATUS: true,
        accessToken
    }
    return res.json(json)
})

router.post('/register', UserController.register);

router.get('/verify', verifyJWT, (req, res) => {
    res.json({
        msg:'Verify successful',
        AUTHENTICATION_STATUS: true,
        user: req.user,
    })
})

module.exports = router;