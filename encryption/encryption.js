module.exports.encryption = function (text, password, decryptBool) {

    if (!decryptBool) {
        return encrypt(text, password);
    } else {
        return decrypt(text, password);
    }
};

const crypto = require("crypto");
const algorithm = "aes-256-ctr";
const buffer = require("buffer");

function encrypt(text, password) {
    let iv = buffer.Buffer.from(crypto.randomBytes(16));

    const cipher = crypto.createCipheriv(algorithm, password, iv);
    let crypted = cipher.update(text, "utf8", "hex");
    crypted += cipher.final("hex");

    return `${iv.toString("hex")}:${crypted.toString()}`;
}

function decrypt(text, password) {
    const splitValues = text.split(":");
    let iv = buffer.Buffer.from(splitValues.shift(), "hex");
    let crypted = buffer.Buffer.from(splitValues.join(":"), "hex");

    const decipher = crypto.createDecipheriv(algorithm, password, iv);
    let decrypted = decipher.update(crypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}
