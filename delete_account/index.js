exports.handler = function (event, context, callback) {
    // Dependencies
    const fs = require("fs");

    //read consumer-key, -secret and application secret
    const accessRawdata = fs.readFileSync("/opt/access.json");
    const access = JSON.parse(accessRawdata);

    const AWS = require("aws-sdk");
    AWS.config.update({region: "eu-central-1"});
    const ddb = new AWS.DynamoDB({apiVersion: "2012-08-10"}); //initialize database

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

    let params = {
        TableName: "UserData",
        Key: {
            "Mail": {
                S: mail
            }
        }
    };

    let userId;
    let uat;
    let googleArray = [];
    let fitnessArray = [];

    // We use the database "UserData" to get the UAT and the userID of the user.
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
                if(data.Item.UAT) {
                    uat = data.Item.UAT;

                    params = {
                        TableName: "UserAccessTokens",
                        Key: {
                            "UAT": {
                                S: uat
                            }
                        }
                    };
                    // Delete the "UserAccessTokens" database.
                    ddb.deleteItem(params, function(err, data) {
                        if(err) {
                            console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
                        } else {
                            console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
                        }
                    });
                }

                // Check if the user has a userID already. If the user has no userID than the user has no fitness data on the database "FitnessData".
                if (data.Item.UserID) {
                    userId = data.Item.UserID.S;
                    params = {
                        TableName: "FitnessData",
                        KeyConditionExpression: "UserID = :key",
                        ExpressionAttributeValues: {
                            ":key": {"S": userId}
                        }
                    };
                    // Delete every fitness data on the database "FitnessData".
                    ddb.query(params, onQueryFitness);
                }

                params = {
                    TableName: "GoogleData",
                    KeyConditionExpression: "Mail = :key",
                    ExpressionAttributeValues: {
                        ":key": {"S": mail}
                    }
                };
                // Delete every google fitness data on the database "GoogleData".
                ddb.query(params, onQueryGoogle);

                params = {
                    TableName: "UserData",
                    Key: {
                        "Mail": {
                            S: mail
                        }
                    }
                };

                // Delete every data of the user on the database "UserData".
                ddb.deleteItem(params, function(err, data) {
                    if(err) {
                        console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
                    } else {
                        console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
                    }
                });
            }
        } else {
            console.log("Error", err);
        }
    });

    // This function iterates through the whole "FitnessData" database and deletes every data of the given user.
    function onQueryFitness(err, data) {
        params = {
            TableName: "FitnessData",
            KeyConditionExpression: "UserID = :key",
            ExpressionAttributeValues: {
                ":key": {"S": userId}
            }
        };

        if (!err) {
            console.log("Scan succeeded.");
            if (data && data.Items) {
                fitnessArray.push(data.Items);
            }

            // continue scanning if we have more items
            if (data && data.LastEvaluatedKey) {
                if (typeof data.LastEvaluatedKey != "undefined") {
                    console.log("Scanning for more...");
                    params.ExclusiveStartKey = data.LastEvaluatedKey;
                    ddb.query(params, onQueryFitness);
                }
            } else {    // We found every data of the user and now we delete all of them.
                for(var a = 0; a < fitnessArray[0].length; a ++) {
                    if(fitnessArray[0][a].SummaryID !== undefined) {
                        params = {
                            TableName: "FitnessData",
                            Key: {
                                "UserID": { S: userId },
                                "SummaryID": { S: fitnessArray[0][a].SummaryID.S }
                            }
                        };
                        ddb.deleteItem(params, function(err, data) {
                            if(err) {
                                console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
                            } else {
                                console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
                            }
                        });
                    }
                }
            }
        }else {
            console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
        }
    }

    // This function iterates through the whole "GoogleData" database and deletes every data of the given user.
    function onQueryGoogle(err, data) {
        params = {
            TableName: "GoogleData",
            KeyConditionExpression: "Mail = :key",
            ExpressionAttributeValues: {
                ":key": {"S": mail}
            }
        };

        if (!err) {
            console.log("Scan succeeded.");
            if (data && data.Items) {
                googleArray.push(data.Items);
            }

            // continue scanning if we have more items
            if (data && data.LastEvaluatedKey) {
                if (typeof data.LastEvaluatedKey != "undefined") {
                    console.log("Scanning for more...");
                    params.ExclusiveStartKey = data.LastEvaluatedKey;
                    ddb.query(params, onQueryGoogle);
                }
            } else {    // We found every data of the user and now we delete all of them.
                for(var b = 0; b < googleArray[0].length; b ++) {
                    params = {
                        TableName: "GoogleData",
                        Key: {
                            "Mail": { S: mail },
                            "ExportTime": { S: googleArray[0][b].ExportTime.S }
                        }
                    };
                    ddb.deleteItem(params, function(err, data) { // jshint ignore:line
                        if(err) {
                            console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
                        } else {
                            console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
                        }
                    });
                }
            }
        }else {
            console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
        }
    }
};