const crypto = require("crypto");

exports.hash = async (password) => {
  const salt = crypto.randomBytes(32).toString("hex");
  const genHash = await crypto.pbkdf2(
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
  return {
    salt: salt,
    passwordHash: genHash,
  };
};

exports.hashSync = (password) => {
  const salt = crypto.randomBytes(32).toString("hex");
  const genHash = crypto.pbkdf2Sync(
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
  return {
    salt: salt,
    passwordHash: genHash,
  };
};

exports.verifyPassword = async (old_password, salt, password_hash, callback) => {
    exports.hashSync(old_password, salt, (err, result) => {
    if (err) {
      return callback(err);
    }
    if (password_hash !== result.toString("base64")) {
      return callback(null, false);
    } else return callback(null, true);
  });
};
