const crypto = require("crypto");

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
