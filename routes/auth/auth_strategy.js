const passport = require('passport');

exports.localStrategy = new LocalStrategy(
    {
        usernameField: 'username',
        passwordField: 'password',
    }, async function verify(username, password, callback){
        
    }
)
