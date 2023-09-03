const crypto = require("crypto");
const jsonwebtoken = require("jsonwebtoken");
exports.hash = async (password, salt, callback) => {
  crypto.pbkdf2(password, salt, 200000, 64, "sha256", callback);
};

exports.hashSync = (password, salt) => {
  return genHash = crypto.pbkdf2Sync(
    password,
    salt,
    200000,
    64,
    "sha256",
    (err) => {
      if (err) {
        return {
          error: err,
        };
      }
    }
  );
};

exports.verifyPassword = async (password, salt, password_hash, callback) => {
  await exports.hash(password, salt, (err, result) => {
    if (err) {
      return callback(err);
    }
    if (password_hash !== result.toString('hex')) {
      return callback(null, false);
    } else return callback(null, true);
  });
};

exports.generateToken = async (payload, secretKey)=>{
  try{
    const signedToken = jsonwebtoken.sign(
      payload,
      secretKey,
      {
        algorithm: 'RS256',
        expiresIn: '3h'
      }
    );
    return {
      token: 'Bearer ' + signedToken,
      expires: '3h'
    }
  }catch (err){
    console.log('Error in generating token:', err.message);
    return null;
  }
}