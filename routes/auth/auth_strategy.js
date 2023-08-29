const passport = require('passport');
const { UserRepository } = require('../../repository/user_repository');
const {verifyPassword} = require('./auth_method')
const LocalStrategy = require('passport-local');
const JWTStrategy = require('passport-jwt');
exports.localStrategy = new LocalStrategy(
    {
        usernameField: 'username',
        passwordField: 'password',
    }, async function verify(username, password, callback){
        const phone_number = Number(username);
        const user = await UserRepository.findOne({
          where: { phone_number: phone_number },
        });

        if(!user){
            return callback(null, false, {message: 'Incorrect phone number or password'});
        }
        await verifyPassword(password, user.salt, user.password_hash, (err, result)=>{
           if (err) {
             return callback(err);
           }
           if (result) {
             return callback(null, user);
           }
           return callback(null, false); 
        })
    }
)

exports.JWTStrategy = new JWTStrategy(

)

const verify = (strategy) => {
    return (req, res, next) => {
      passport.authenticate(
        strategy,
        { session: false },
        function (err, user, info, status) {
          if (err) {
            return next(err);
          }
          if (!user) {
            next(null, false)
          }
          req.user = user;
          next();
        }
      )(req, res, next);
    };
}

exports.verifyLocalStrategy = verify('local');
exports.verifyJWT = verify('jwt');
