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
    const accessRawdata = fs.readFileSync("/opt/access.json");
    const access = JSON.parse(accessRawdata);

    const AWS = require("aws-sdk");
    AWS.config.update({region: "eu-central-1"});
    const ddb = new AWS.DynamoDB({apiVersion: "2012-08-10"}); //initialize database

    //This function filters the redundant data of a JSON file.
    function duplicateFilter(odvData) {
        //This function helps to avoid redundant code.
        function check(vaultType, var1, var2, IorJ) {
            if ((odvData.data[var1].type === vaultType) && (odvData.data[var2].type) === vaultType) { //data has to be the same type to be redundant
                if (odvData.data[var1].epoch === odvData.data[var2].epoch) {
                    if (odvData.data[var1].value !== odvData.data[var2].value) {
                        if (odvData.data[var1].value > odvData.data[var2].value) { //Keep the data with the longer duration.
                            odvData.data.splice(var2, 1); //data.splice(index, number of deleting data)
                            IorJ = "j";
                        } else {
                            odvData.data.splice(var1, 1);
                            IorJ = "i";
                        }
                    } else {
                        if (odvData.data[var2].origin === "unknown") { //Delete the data which has no given device.
                            odvData.data.splice(var2, 1);
                            IorJ = "j";
                        } else {
                            odvData.data.splice(var1, 1);
                            IorJ = "i";
                        }
                    }
                }
            }
            return IorJ;
        }

        for (var i = 0; i < odvData.data.length; i++) {
            for (var j = i + 1; j < odvData.data.length; j++) {
                //delete redundant "HEART_RATE" data
                if ((odvData.data[i].type === "HEART_RATE") && (odvData.data[j].type === "HEART_RATE")) {
                    if (odvData.data[i].epoch === odvData.data[j].epoch) {
                        if (odvData.data[j].origin === "unknown") { //Delete the data which has no given device.
                            odvData.data.splice(j, 1);
                            if(j > 0) {
                                j -= 1;
                            }
                        } else {
                            odvData.data.splice(i, 1);
                            if(i > 0) {
                                i -= 1;
                            }
                        }
                    }
                    //delete redundant "WEIGHT" data
                } else if ((odvData.data[i].type === "WEIGHT") && (odvData.data[j].type === "WEIGHT")) {
                    if (odvData.data[i].epoch === odvData.data[j].epoch) {
                        if (odvData.data[j].origin === "unknown") { //Delete the data which has no given device.
                            odvData.data.splice(j, 1);
                            if(j > 0) {
                                j -= 1;
                            }
                        } else {
                            odvData.data.splice(i, 1);
                            if(i > 0) {
                                i -= 1;
                            }
                        }
                    }
                    //delete redundant "STRESS" data
                } else if ((odvData.data[i].type === "STRESS") && (odvData.data[j].type === "STRESS")) {
                    if (odvData.data[i].epoch === odvData.data[j].epoch) {
                        if (odvData.data[j].origin === "unknown") { //Delete the data which has no given device.
                            odvData.data.splice(j, 1);
                            if(j > 0) {
                                j -= 1;
                            }
                        } else {
                            odvData.data.splice(i, 1);
                            if(i > 0) {
                                i -= 1;
                            }
                        }
                    }
                } else {
                    var minus = "none";
                    //delete redundant data of the specific type
                    minus = check("EXERCISE_MANUAL", i, j, minus);
                    minus = check("EXERCISE_LOW", i, j, minus);
                    minus = check("EXERCISE_MID", i, j, minus);
                    minus = check("EXERCISE_HIGH", i, j, minus);
                    minus = check("SLEEP_LIGHT", i, j, minus);
                    minus = check("SLEEP_REM", i, j, minus);
                    minus = check("SLEEP_DEEP", i, j, minus);
                    if (minus === "i") {
                        if(i > 0) {
                            i -= 1;
                        }
                    } else if (minus === "j") {
                        if(j > 0) {
                            j -= 1;
                        }
                    }
                }
            }
        }
        return odvData;
    }

    //initial values to be replaced with the actual parameters
    var mail = "empty";
    var pwHash = "empty";

    if (event.body) {  //check, if data was received at all
        var postData = event.body.split("*");
        if (postData.length >= 5) { //check, if there are enough parameters given, read parameters, check secret-value
            mail = postData[1];
            pwHash = postData[3];
            if (postData[5] !== access.app_secret) { //check secret-value
                console.log("wrong secret");
                return;
            }
        }
    } else {
        return;
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

                var params;

                if (data.Item.UserID) {//check if the user already has an userID to query for data
                    const userId = data.Item.UserID.S;
                    userID = userId;

                    //parameters for the database access
                    params = {
                        TableName: "FitnessData",
                        KeyConditionExpression: "UserID = :key",
                        ExpressionAttributeValues: {
                            ":key": {"S": userId}
                        }
                    };
                    ddb.query(params, onQuery);
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
        } else {
            console.log("Error", err);
        }
    });

    let userData = [];

    //function used when querying the database for the users data
    function onQuery(err, data) {
        //parameters for the database access
        params = {
            TableName: "FitnessData",
            KeyConditionExpression: "UserID = :key",
            ExpressionAttributeValues: {
                ":key": {"S": userID}
            }
        };

        //scan succeeded, collected data gets stored for later
        if (!err) {
            console.log("Scan succeeded.");
            if (data && data.Items) {
                userData.push(data.Items);
            }

            // continue scanning if we have more items
            if (data && data.LastEvaluatedKey) {
                if (typeof data.LastEvaluatedKey != "undefined") {
                    console.log("Scanning for more...");
                    params.ExclusiveStartKey = data.LastEvaluatedKey;
                    ddb.query(params, onQuery);
                }
            } else {
                let fileData = "{\"title\":\"DiaConvert ODV JSON export\",\"exportDate\":\"" + new Date(Date.now()).toLocaleString("de-DE", {
                    hour12: false,
                    timeZone: "Europe/Berlin"
                }).replace(",", "") + "\",\"data\":[";

                if (userData) { //convert all entries to the OpenDataVault-format and append them to the fileData
                    userData.forEach(function (records) {
                        for(var i = 0; i < records.length; i++) {
                            const item = records[i];
                            if (item && item.sumType.S && item.data.S) {
                                const entries = converter.odvConverter(JSON.parse(encryption.encryption(item.data.S, access.dataEncPW, true)), item.sumType.S); //decrypt the fitness data and give it to the odv_converter
                                entries.forEach(function (entry) {
                                    if (entry && entry.Item) {
                                        /* jshint ignore:start */
                                        fileData += JSON.stringify((entry.Item)) + ","; // eslint-disable-line no-use-before-define
                                        /* jshint ignore:end */
                                    }
                                });
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
                        const fileBuffer = JSON.parse(fileData);
                        fileData = JSON.stringify(duplicateFilter(fileBuffer));

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
                } else {
                    //create the response containing an error message
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
        } else {
            console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
        }
    }
};