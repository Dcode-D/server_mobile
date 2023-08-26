const express = require('express');
const router = require('router');

router.post('/login', async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).send('Tên người dùng không tồn tại!');
    }
})

router.post('/register', async (req, res) => {

})

module.exports = router;