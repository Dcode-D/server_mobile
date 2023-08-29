const express = require('express');
const router = express.Router();;
const { UserController } = require('../../controllers/user_controller');
const { UserRepository } = require('../../repository/user_repository');

router.post('/login', async (req, res) => {
    const user = req.body.phone_number;
    if (!user) {
        return res.status(401).send('Tên người dùng không tồn tại!');
    }
})

router.post('/register', UserController.register);
router.post('/changepassword/:phone_number', UserController.changePassword);
module.exports = router;