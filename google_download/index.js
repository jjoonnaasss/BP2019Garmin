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

exports.handler = function (event, context, callback) {
    // Dependencies
    const fs = require("fs");
    const rsa = require("node-rsa");
    const encryption = require("/opt/encryption");
    const buffer = require("buffer");
    const crypto = require("crypto");
    const converter = require("/opt/google_odv_converter");

    //read consumer-key, -secret and application secret
    const accessRawdata = fs.readFileSync("/opt/access.json");
    const access = JSON.parse(accessRawdata);

    const AWS = require("aws-sdk");
    AWS.config.update({region: "eu-central-1"});
    const ddb = new AWS.DynamoDB({apiVersion: "2012-08-10"}); //initialize database

    if (event.body) {

        const postData = event.body.split("*");
        //create variables to store the parameters received from the website
        const mail = postData[1];
        const pwHash = postData[3];

        //check, if website sent the correct secret
        if (postData[5] !== access.app_secret) {
            console.log("wrong secret");
            return;
        }

        //parameters to read password hash and userID from database
        const params = {
            TableName: "UserData",
            Key: {
                "Mail": {
                    S: mail
                }
            }
        };

        //read user information from database
        ddb.getItem(params, function (err, data) {
            if (!err) {
                if (!data.Item || data.Item.PWHash.S !== pwHash) {
                    //create response, telling the user that the given password is incorrect
                    const res = {
                        "statusCode": 401,
                        "headers": {
                            "Content-Type": "text/plain",
                        },
                        "body": "error with login"
                    };
                    //send response
                    callback(null, res);
                } else {

                    const params = {
                        TableName: "GoogleData",
                        KeyConditionExpression: "Mail = :key",
                        ExpressionAttributeValues: {
                            ":key": {"S": mail}
                        }
                    };

                    //read all entries for the given userID
                    ddb.query(params, function (err, data) {
                        if (!err) {
                            var fileData = "{\"title\":\"DiaConvert ODV JSON export\",\"exportDate\":\"" + new Date(Date.now()).toLocaleString("de-DE", {
                                hour12: false,
                                timeZone: "Europe/Berlin"
                            }).replace(",", "") + "\",\"data\":[";


                            if (data.Items) { //convert all entries to the OpenDataVault-format and append them to the fileData
                                data.Items.forEach(function (item) {
                                    fileData += encryption.encryption(item.Data.S, access.dataEncPW, true) + ",";
                                });

                                //cut off last ","
                                fileData = fileData.substring(0, fileData.length - 1);
                                fileData += "]}";

                                var fileBuffer = JSON.parse(fileData);
                                fileData = converter.googleOdvConverter(fileBuffer);

                                if (fileData === "{\"title\": \"ODV JSON export\", \"data\":]}") {//check, if no fitness data was found
                                    //create response, telling the website that no data was found
                                    const res = {
                                        "statusCode": 401,
                                        "headers": {
                                            "Content-Type": "text/plain",
                                        },
                                        "body": "no data"
                                    };
                                    //send response
                                    callback(null, res);
                                } else {
                                    //create random key for the symmetric encryption
                                    const symKey = buffer.Buffer.from(crypto.randomBytes(32));

                                    //encrypt fileData symmetrically using the symkey
                                    const encrypted = encryption.encryption(fileData, symKey, false);

                                    //initialize rsa and import the public key from access.json
                                    const key = new rsa();
                                    key.importKey(access.pubKey, "pkcs1-public");
                                    //use rsa to encrypt the key used to encrypt the fileData
                                    const encryptedKey = key.encrypt(symKey, "base64");

                                    //append the encrypted key and the encrypted data, divided by "===***==="
                                    const response = encryptedKey + "===***===" + encrypted;

                                    //create the response containing the encrypted data
                                    const res = {
                                        "statusCode": 200,
                                        "headers": {
                                            "Content-Type": "text/plain",
                                        },
                                        "body": response
                                    };

                                    //send response
                                    callback(null, res);
                                }
                            }
                        } else {
                            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                        }
                    });
                }
            } else {
                console.log("Error", err);
            }
        });
    }
};