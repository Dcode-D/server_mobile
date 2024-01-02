const passport = require("passport");
const { UserRepository } = require("../../repository/user_repository");
const { verifyPassword } = require("./auth_method");
const LocalStrategy = require("passport-local");
const JWTStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.PUBLIC_KEY,
};

exports.localStrategy = new LocalStrategy(
  {
    usernameField: "username",
    passwordField: "password",
  },
  async function verify(username, password, callback) {
    const phone_number = username;
    const user = await UserRepository.findOne({
      where: { phone_number: phone_number, active: true },
      relations: {
        wallets: true,
      },
    });

    if (!user) {
      return callback(null, false, {
        message: "Incorrect phone number",
      });
    }
    await verifyPassword(
      password,
      user.salt,
      user.password_hash,
      (err, result) => {
        if (err) {
          return callback(err);
        }
        if (result) {
          return callback(null, user,
              {

                message: "Incorrect password ",
              });
        }
        return callback(null, false);
      }
    );
  }
);

exports.JWTStrategy = new JWTStrategy(jwtOptions, async function (
  payload,
  done
) {
  const user = await UserRepository.findOne({
    where: { id: payload.sub },
  });
  if (user) {
    return done(null, user);
  } else return done(null, false);
});

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
          return res.status(401).json({
            AUTHENTICATION_STATUS: false,
          });
        }
        req.user = user;
        next();
      }
    )(req, res, next);
  };
};

exports.verifyLocalStrategy = verify("local");
exports.verifyJWT = verify("jwt");
