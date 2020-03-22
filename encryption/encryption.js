// Copyright 2019, 2020 Jens Wolf, Timon Böhler, Kyu Hwan Yoo, Jonas Wombacher
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

module.exports.encryption = function (text, password, decryptBool) {

    //boolean to decide, if you want to encrypt or decrypt
    if (decryptBool) {
        return decrypt(text, password);
    } else {
        return encrypt(text, password);
    }
};

//dependencies
const crypto = require("crypto");
const algorithm = "aes-256-ctr";
const buffer = require("buffer");

//encryption function
function encrypt(text, password) {
    //create random initialization vector for the encryption
    const iv = buffer.Buffer.from(crypto.randomBytes(16));

    //encrypt the given text with the given password, using aes-256-ctr, utf8 input and hex output
    const cipher = crypto.createCipheriv(algorithm, password, iv);
    let crypted = cipher.update(text, "utf8", "hex");
    crypted += cipher.final("hex");

    //return string containing the initialization vector and the encrypted text, separated by a :
    return `${iv.toString("hex")}:${crypted.toString()}`;
}

//decryption function
function decrypt(text, password) {
    //split the given string into initialization vector and encrypted text
    const splitValues = text.split(":");
    const iv = buffer.Buffer.from(splitValues.shift(), "hex");
    const crypted = buffer.Buffer.from(splitValues.join(":"), "hex");

    //decrypt the given text with the given password, using aes-256-ctr, hex input and utf8 output
    const decipher = crypto.createDecipheriv(algorithm, password, iv);
    let decrypted = decipher.update(crypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    //return the decrypted text
    return decrypted;
}
