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
    // Test. Ignore
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
    var random = "empty";

    var timestamp = Date.now() / 1000; //current timestamp
    var res; //variable for the different possible responses to the website

    if (event.body) {  //check, if data was received at all
        var postData = event.body.split("*");
        if (postData.length === 7 && postData[5] === access.app_secret) { //check, if it is a request to start the password-reset, or to end the reset by changing the password
            mail = postData[1];
            random = postData[3];

            //parameters to add the timestamp and random value to the users database entry
            var params = {
                TableName: "UserData",
                Key: {
                    "Mail": {
                        S: mail
                    }
                },
                ExpressionAttributeNames: {
                    "#TS": "TimeStamp",
                    "#R": "RandomValue"
                },
                ExpressionAttributeValues: {
                    ":ts": {
                        N: timestamp.toString()
                    },
                    ":r": {
                        S: random
                    }
                },
                ConditionExpression: "attribute_exists(Mail)",
                UpdateExpression: "SET #TS = :ts, #R = :r"
            };
            //add the timestamp and random value to the users database entry
            ddb.updateItem(params, function (err) {
                if (err) {
                    console.log(err, err.stack); // an error occurred
                    //define response to website
                    res = {
                        "statusCode": 200,
                        "headers": {
                            "Content-Type": "text/plain",
                            "Access-Control-Allow-Origin": "*"
                        },
                        "body": "error"
                    };


                } else {// successful response from database
                    //define response to website
                    res = {
                        "statusCode": 200,
                        "headers": {
                            "Content-Type": "text/plain",
                            "Access-Control-Allow-Origin": "*"
                        },
                        "body": "success"
                    };
                }

                //send response
                callback(null, res);
            });

        } else if (postData.length === 9 && postData[7] === access.app_secret) { //check, if it is a request to end the reset by changing the password
            mail = postData[1];
            random = postData[3];
            pwHash = postData[5];

            //parameters for the database access
            var parameters = {
                TableName: "UserData",
                Key: {
                    "Mail": {
                        S: mail
                    }
                }
            };

            //read secret matching with the available token from dynamodb table
            ddb.getItem(parameters, function (err, data) {
                if (err) {
                    console.log("Error", err);
                    //define response to website
                    res = {
                        "statusCode": 200,
                        "headers": {
                            "Content-Type": "text/plain",
                            "Access-Control-Allow-Origin": "*"
                        },
                        "body": "error"
                    };
                    //send response to website
                    callback(null, res);
                } else {
                    var oldTStamp, randVal;
                    if (data.Item.TimeStamp && data.Item.RandomValue) {
                        //read values received from the database
                        oldTStamp = data.Item.TimeStamp.N;
                        randVal = data.Item.RandomValue.S;
                    } else {
                        res = {
                            "statusCode": 200,
                            "headers": {
                                "Content-Type": "text/plain",
                                "Access-Control-Allow-Origin": "*"
                            },
                            "body": "request already used"
                        };
                        //send response to website
                        callback(null, res);
                    }

                    if (timestamp - oldTStamp < 86400) { //check, if request to reset password is older than 24 hours
                        if (random === randVal) { //check, if the random value is correct, to make sure, that the user is the correct one
                            //parameters to update the password
                            params = {
                                TableName: "UserData",
                                Key: {
                                    "Mail": {
                                        S: mail
                                    }
                                },
                                ExpressionAttributeValues: {
                                    ":hash": {
                                        S: pwHash
                                    },
                                },
                                ExpressionAttributeNames: {
                                    "#TS": "TimeStamp",
                                },
                                UpdateExpression: "SET PWHash = :hash REMOVE RandomValue, #TS"
                            };
                            //update the password
                            ddb.updateItem(params, function (err) {
                                if (err) {
                                    console.log("Error", err);
                                } else {
                                    //define response to website
                                    res = {
                                        "statusCode": 200,
                                        "headers": {
                                            "Content-Type": "text/plain",
                                            "Access-Control-Allow-Origin": "*"
                                        },
                                        "body": "success"
                                    };
                                    //send response to website
                                    callback(null, res);
                                }
                            });
                        } else {
                            //define response to website
                            res = {
                                "statusCode": 200,
                                "headers": {
                                    "Content-Type": "text/plain",
                                    "Access-Control-Allow-Origin": "*"
                                },
                                "body": "error"
                            };
                            //send response to website
                            callback(null, res);
                        }
                    } else {
                        //define response to website
                        res = {
                            "statusCode": 200,
                            "headers": {
                                "Content-Type": "text/plain",
                                "Access-Control-Allow-Origin": "*"
                            },
                            "body": "request already used"
                        };
                        //send response to website
                        callback(null, res);
                    }
                }
            });
        } else {
            //define response to website
            res = {
                "statusCode": 200,
                "headers": {
                    "Content-Type": "text/plain",
                    "Access-Control-Allow-Origin": "*"
                },
                "body": "error"
            };
            //send response to website
            callback(null, res);
        }
    }
};