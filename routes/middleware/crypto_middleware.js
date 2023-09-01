const crypto = require("crypto");
const algorithm = "aes-256-cbc";
const cipher = crypto.createCipheriv(
  algorithm,
  Buffer.from(process.env.CRYPTO_KEY, "hex"),
  Buffer.from(process.env.INIT_VECTOR, "hex")
);
const decipher = crypto.createDecipheriv(
  algorithm,
  Buffer.from(process.env.CRYPTO_KEY, "hex"),
  Buffer.from(process.env.INIT_VECTOR, "hex")
);

exports.encryptMiddleware = (plainData) => {
  let encryptedData = cipher.update(plainData, "utf-8", "hex");
  encryptedData += cipher.final("hex");
  console.log(encryptedData);
  return encryptedData;
};

exports.decryptMiddleware = (encryptedData) => {
  let decryptedData = decipher.update(encryptedData, "hex", "utf-8");
  decryptedData += decipher.final("utf8");
  console.log("Decrypted message: " + decryptedData);
};
