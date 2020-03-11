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
    const converter = require("/opt/odv_converter");
    const rsa = require("node-rsa");
    const encryption = require("/opt/encryption");
    const crypto = require("crypto");
    const buffer = require("buffer");

    //read consumer-key, -secret and application secret
    const access_rawdata = fs.readFileSync("/opt/access.json");
    const access = JSON.parse(access_rawdata);

    var AWS = require("aws-sdk");
    AWS.config.update({region: "eu-central-1"});
    var ddb = new AWS.DynamoDB({apiVersion: "2012-08-10"}); //initialize database

    //This function filters the redundant data of a JSON file.
    function duplicateFilter(odvData) {
        //This function helps to avoid redundant code.
        function check(vaultType, var1, var2, iorj) {
            if ((odvData.data[var1].type === vaultType) && (odvData.data[var2].type) === vaultType) { //data has to be the same type to be redundant
                if (odvData.data[var1].epoch === odvData.data[var2].epoch) {
                    if (odvData.data[var1].value !== odvData.data[var2].value) {
                        if (odvData.data[var1].value > odvData.data[var2].value) { //Keep the data with the longer duration.
                            odvData.data.splice(var2, 1); //data.splice(index, number of deleting data)
                            iorj = "j";
                        } else {
                            odvData.data.splice(var1, 1);
                            iorj = "i";
                        }
                    } else {
                        if (odvData.data[var2].origin === "unknown") { //Delete the data which has no given device.
                            odvData.data.splice(var2, 1);
                            iorj = "j";
                        } else {
                            odvData.data.splice(var1, 1);
                            iorj = "i";
                        }
                    }
                }
            }
            return iorj;
        }

        for (var i = 0; i < odvData.data.length; i++) {
            for (var j = i + 1; j < odvData.data.length; j++) {
                if ((odvData.data[i].type === "HEART_RATE") && (odvData.data[j].type === "HEART_RATE")) {
                    if (odvData.data[i].epoch === odvData.data[j].epoch) {
                        if (odvData.data[j].origin === "unknown") { //Delete the data which has no given device.
                            odvData.data.splice(j, 1);
                            j -= 1;
                        } else {
                            odvData.data.splice(i, 1);
                            i -= 1;
                        }
                    }
                } else if ((odvData.data[i].type === "WEIGHT") && (odvData.data[j].type === "WEIGHT")) {
                    if (odvData.data[i].epoch === odvData.data[j].epoch) {
                        if (odvData.data[j].origin === "unknown") { //Delete the data which has no given device.
                            odvData.data.splice(j, 1);
                            j -= 1;
                        } else {
                            odvData.data.splice(i, 1);
                            i -= i;
                        }
                    }
                } else if ((odvData.data[i].type === "STRESS") && (odvData.data[j].type === "STRESS")) {
                    if (odvData.data[i].epoch === odvData.data[j].epoch) {
                        if (odvData.data[j].origin === "unknown") { //Delete the data which has no given device.
                            odvData.data.splice(j, 1);
                            j -= 1;
                        } else {
                            odvData.data.splice(i, 1);
                            i -= i;
                        }
                    }
                } else {
                    var minus = "none";
                    minus = check("EXERCISE_MANUAL", i, j, minus);
                    minus = check("EXERCISE_LOW", i, j, minus);
                    minus = check("EXERCISE_MID", i, j, minus);
                    minus = check("EXERCISE_HIGH", i, j, minus);
                    minus = check("SLEEP_LIGHT", i, j, minus);
                    minus = check("SLEEP_REM", i, j, minus);
                    minus = check("SLEEP_DEEP", i, j, minus);
                    if (minus === "i") {
                        i -= 1;
                    } else if (minus === "j") {
                        j -= 1;
                    }
                }
            }
        }
        return odvData;
    }

    //initial values to be replaced with the actual parameters
    var mail = "empty";
    var pwhash = "empty";

    if (event.body) {  //check, if data was received at all
        var postData = event.body.split("*");
        if (postData.length >= 5) { //check, if there are enough parameters given, read parameters, check secret-value
            mail = postData[1];
            pwhash = postData[3];
            if (postData[5] !== access.app_secret) { //check secret-value
                console.log("wrong secret");
                return;
            }
        }
    }

    //parameters to read password hash and userID from database
    var params = {
        TableName: "UserData",
        Key: {
            "Mail": {
                S: mail
            }
        }
    };

    var userID;
    //read password hash and user access token from database
    ddb.getItem(params, function (err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            if (!data.Item || data.Item.PWHash.S !== pwhash) {
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

                var params;

                if (data.Item.UserID) {//check if the user already has an userID to query for data
                    const userId = data.Item.UserID.S;
                    userID = userId;

                    params = {
                        TableName: "FitnessData",
                        FilterExpression: "UserID = :key",
                        ExpressionAttributeValues: {
                            ":key": {"S": userId}
                        }
                    };
                    ddb.scan(params, onQuery);
                } else {
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
                }
            }
        }
    });

    let userData = [];

    function onQuery(err, data) {
        params = {
            TableName: "FitnessData",
            FilterExpression: "UserID = :key",
            ExpressionAttributeValues: {
                ":key": {"S": userID}
            }
        };

        if (err) {
            console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Scan succeeded.");
            if (data && data.Items) {
                userData.push(data.Items);
            }

            // continue scanning if we have more items
            if (data && data.LastEvaluatedKey) {
                if (typeof data.LastEvaluatedKey != "undefined") {
                    console.log("Scanning for more...");
                    params.ExclusiveStartKey = data.LastEvaluatedKey;
                    ddb.scan(params, onQuery);
                }
            } else {
                let fileData = "{\"title\":\"DiaConvert ODV JSON export\",\"exportDate\":\"" + new Date(Date.now()).toLocaleString("de-DE", {
                    hour12: false,
                    timeZone: "Europe/Berlin"
                }).replace(",", "") + "\",\"data\":[";

                if (userData) { //convert all entries to the OpenDataVault-format and append them to the fileData
                    userData.forEach(function (records) {
                        for(var i = 0; i < records.length; i++) {
                            let item = records[i];
                            if (item && item.sumType.S && item.data.S) {
                                let entries = converter.odvConverter(JSON.parse(encryption.encryption(item.data.S, access.dataEncPW, true)), item.sumType.S); //decrypt the fitness data and give it to the odv_converter
                                let buffer = "";
                                entries.forEach(function (entry) {
                                    if (entry && entry.Item) {
                                        buffer += JSON.stringify((entry.Item)) + ",";
                                    }
                                });
                                fileData += buffer;
                            }
                        }
                    });

                    //cut off last ","
                    fileData = fileData.substring(0, fileData.length - 1);
                    fileData += "]}";

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
                        //delete all redundant data
                        var fileBuffer = JSON.parse(fileData);
                        fileData = JSON.stringify(duplicateFilter(fileBuffer));

                        //create random key for the symmetric encryption
                        let symKey = buffer.Buffer.from(crypto.randomBytes(32));

                        //encrypt fileData symmetrically using the symkey
                        let encrypted = encryption.encryption(fileData, symKey, false);

                        //initialize rsa and import the public key from access.json
                        let key = new rsa();
                        key.importKey(access.pubKey, "pkcs1-public");
                        //use rsa to encrypt the key used to encrypt the fileData
                        let encryptedKey = key.encrypt(symKey, "base64");

                        //append the encrypted key and the encrypted data, divided by "===***==="
                        let response = encryptedKey + "===***===" + encrypted;

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
            }
        }
    }
};