const express = require('express');
const passport = require('passport');
const {localStrategy, verifyLocalStrategy} = require('../auth/auth_strategy');
const router = express.Router();;
const { UserController } = require('../../controllers/user_controller');
const { UserRepository } = require('../../repository/user_repository');

passport.use('local', localStrategy);

router.post('/login', verifyLocalStrategy, async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).send('Incorrect username or password');
    }
    
    return res.json(user)
})

router.post('/register', UserController.register);
router.post('/changepassword/:phone_number?', UserController.changePassword);
module.exports = router;