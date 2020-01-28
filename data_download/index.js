exports.handler = function (event, context, callback) {
    // Dependencies
    const fs = require("fs");
    const converter = require("/opt/odv_converter");
    const rsa = require("node-rsa");
    const encryption = require("/opt/encryption");

    //read consumer-key, -secret and application secret
    const access_rawdata = fs.readFileSync("/opt/access.json");
    const access = JSON.parse(access_rawdata);

    var AWS = require("aws-sdk");
    AWS.config.update({region: "eu-central-1"});
    var ddb = new AWS.DynamoDB({apiVersion: "2012-08-10"}); //initialize database

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

    //parameters to read password hash and user access token from database
    var params = {
        TableName: "UserData",
        Key: {
            "Mail": {
                S: mail
            }
        }
    };

    //read password hash and user access token from database
    ddb.getItem(params, function (err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            if (data.Item.PWHash.S === pwhash) {

                var params;

                if (data.Item.UserID) {
                    const userId = data.Item.UserID.S;

                    params = {
                        TableName: "FitnessData",
                        FilterExpression: "UserID = :key",
                        ExpressionAttributeValues: {
                            ":key": {"S": userId}
                        }
                    };
                } else {
                    const uat = data.Item.UAT.S;

                    //parameters for searching the database for all fitness-data entries with the users user access token
                    params = {
                        TableName: "FitnessData",
                        FilterExpression: "UAT = :key",
                        ExpressionAttributeValues: {
                            ":key": {"S": uat}
                        }
                    };
                }


                //read all entries for the given uat
                ddb.scan(params, function (err, data) {
                    if (err) {
                        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                    } else {
                        const userData = data.Items;
                        var fileData = "{\"title\": \"ODV JSON export\", \"data\":["; //TODO

                        if (userData) { //convert all entries to the OpenDataVault-format and append them to the fileData
                            userData.forEach(function (item) {
                                let entries = converter.odvConverter(JSON.parse(encryption.encryption(item.data.S, access.dataEncPW, true)), item.sumType.S); //decrypt the fitness data and give it to the odv_converter
                                entries.forEach(function (entry) {
                                    fileData += JSON.stringify((entry.Item.vaultEntry)) + ",";
                                });
                            });

                            //cut off last ","
                            fileData = fileData.substring(0, fileData.length - 1);
                            fileData += "]}";

                            //initialize rsa and import the public key from access.json
                            let key = new rsa();
                            key.importKey(access.pubKey, "pkcs1-public");
                            //encrypt the data to be sent to the website
                            let encrypted = key.encrypt(fileData, "base64");

                            const res = {
                                "statusCode": 200,
                                "headers": {
                                    "Content-Type": "text/plain",
                                },
                                "body": encrypted
                            };

                            //send response
                            callback(null, res);
                        }
                    }
                });

            } else {
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
            }
        }
    });
};