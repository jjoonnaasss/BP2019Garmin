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
    const request = require("request");
    const OAuth = require("oauth-1.0a");
    const crypto = require("crypto");
    const fs = require("fs");
    const encryption = require("/opt/encryption");

    //read consumer-key, -secret and application secret
    const accessRawdata = fs.readFileSync("/opt/access.json");
    const access = JSON.parse(accessRawdata);

    const AWS = require("aws-sdk");
    AWS.config.update({region: "eu-central-1"});
    const ddb = new AWS.DynamoDB({apiVersion: "2012-08-10"}); //initialize database

    //read data from ping-notification
    var jsonBody = JSON.parse(event.body);

    var key = Object.keys(jsonBody)[0];

    var uat = jsonBody[key][0].userAccessToken;
    var startTime = jsonBody[key][0].uploadStartTimeInSeconds;
    var endTime = jsonBody[key][0].uploadEndTimeInSeconds;
    var url = jsonBody[key][0].callbackURL;
    var UserID = jsonBody[key][0].userId;

    var bodyVal = "";

    const res = {
        "statusCode": 200
    };
    //respond statuscode 200, to prevent Garmin from resending the ping
    callback(null, res);

    var uat_secret; //variable to store user access token secret

    //parameters to read uat-secret from database
    var params = {
        TableName: "UserAccessTokens",
        Key: {
            "UAT": {
                S: uat
            }
        }
    };

    //read uat-secret from database
    ddb.getItem(params, function (err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            uat_secret = encryption.encryption(data.Item.Secret.S, access.encPW, true);

            let params = {
                TableName: "UserData",
                Key: {
                    "Mail": {
                        S: data.Item.Mail.S
                    }
                },
                ExpressionAttributeNames: {
                    "#UID": "UserID",
                },
                ExpressionAttributeValues: {
                    ":uid": {
                        S: UserID
                    },
                },
                UpdateExpression: "SET #UID = :uid"
            };

            ddb.updateItem(params, function (err) { //update UserData table with the UserID
                if (err) {
                    console.log(err, err.stack); // an error occurred
                }
            });


            //initialize oauth
            const oauth = OAuth({
                consumer: access,
                signature_method: "HMAC-SHA1",
                hash_function(base_string, key) {
                    return crypto
                        .createHmac("sha1", key)
                        .update(base_string)
                        .digest("base64");
                }
            });

            const nonce = oauth.getNonce();
            const timestamp = oauth.getTimeStamp();

            //create base-string-parameters for the oauth-signature
            var base_string_params = {
                oauth_consumer_key: access.key,
                oauth_nonce: nonce,
                oauth_signature_method: "HMAC-SHA1",
                oauth_timestamp: timestamp,
                oauth_token: uat,
                oauth_version: "1.0",
                uploadEndTimeInSeconds: endTime,
                uploadStartTimeInSeconds: startTime
            };

            //split URL into two parts, in order to be able to access the URL without the upload-times
            var url_arr = url.split("?");

            //define URL and method for the HTTPS call
            const request_data = {
                url: url_arr[0],
                method: "GET",
            };

            //create signature
            var sig = oauth.getSignature(request_data, uat_secret, base_string_params);

            // Save in 2 string variables to avoid long lines of code.
            var auth_header1 = "OAuth oauth_consumer_key=\"" + access.key + "\", oauth_token=\"" + uat + "\", oauth_signature_method=\"HMAC-SHA1\"" + "\", oauth_signature=\"";
            var auth_header2 = oauth.percentEncode(sig) + "\", oauth_timestamp=\"" + timestamp + "\", oauth_nonce=\"" + nonce + "\", oauth_version=\"1.0\"";
            //create authorization-header
            var auth_header = {
                "Authorization": auth_header1 + auth_header2
            };

            //HTTPS-request, to receive the fitness data
            request(
                {
                    headers: auth_header,
                    uri: url,
                    method: "GET"
                },
                function (error, response, body) {

                    bodyVal = body;

                    //parameters, to read all entries for the given userID from the database
                    var params = {
                        TableName: "FitnessData",
                        KeyConditionExpression: "UserID = :key",
                        ExpressionAttributeValues: {
                            ":key": {"S": UserID}
                        }
                    };

                    //read all entries for the given userID
                    ddb.query(params, onQuery);
                }
            );
        }
    });

    let userData = [];
    function onQuery(err, data) {
        params = {
            TableName: "FitnessData",
            KeyConditionExpression: "UserID = :key",
            ExpressionAttributeValues: {
                ":key": {"S": UserID}
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
                    ddb.query(params, onQuery);
                }
            } else {
                userData = data;

                JSON.parse(bodyVal).forEach(function (item) {
                    //true = either new data is the one we need so we delete the other redundant data in the database or this data is unique
                    //false = redundant data with exact same or longer duration already exists in the database
                    var boolVal = true;
                    if (userData) {
                        userData.Items.every(function (entry) {
                            if (item.summaryId === entry.SummaryID.S && key !== entry.sumType.S) {//check if there already exists an entry with the same summary ID but a different type
                                item.summaryId = item.summaryId + "_" + key; //append type to the summary ID
                                return false;
                            }
                            var deleteItem;
                            var typeArray = ["dailies", "thirdParty", "activities", "manually", "actDetails", "epochs", "sleeps", "stressDetails"];
                            if (typeArray.includes(key)) {
                                if (item.startTimeInSeconds === entry.startTime.N) {
                                    if (item.durationInSeconds > entry.duration.N) { //delete the redundant data with the shorter duration
                                        deleteItem = { //parameters, to search for redundant data
                                            TableName: "FitnessData",
                                            UserID: entry.UserID.S,
                                            SummaryID: entry.summaryId.S,
                                            UAT: entry.uat.S,
                                            startTime: entry.startTimeInSeconds.toString(),
                                            duration: entry.durationInSeconds.toString()
                                        };
                                        ddb.delete(deleteItem, function (err) { //delete the redundant data
                                            if (err) {
                                                console.error("Unable to delete item, Error:", JSON.stringify(err, null, 2));
                                            }
                                        });
                                    } else {
                                        boolVal = false;
                                    }
                                }
                            } else if (key === "bodyComps") {
                                if (item.startTimeInSeconds === entry.startTime.N) { //bodyComps contains no duration data
                                    boolVal = false;
                                }
                            }
                        });
                    }

                    var parameters;

                    if (boolVal) {
                        if (item.startTimeInSeconds && item.durationInSeconds) { //check, which of the attributes exist and build the parameters according to that
                            //parameters, to store the new entry
                            parameters = {
                                Item: {
                                    "UserID": {
                                        S: UserID
                                    },
                                    "SummaryID": {
                                        S: item.summaryId
                                    },
                                    "UAT": {
                                        S: uat
                                    },
                                    "startTime": {
                                        N: item.startTimeInSeconds.toString()
                                    },
                                    "duration": {
                                        N: item.durationInSeconds.toString()
                                    },
                                    "sumType": {
                                        S: key
                                    },
                                    "data": {
                                        S: encryption.encryption(JSON.stringify(item), access.dataEncPW, false) //encrypt the actual data using a password from the access.json
                                    }
                                },
                                TableName: "FitnessData"
                            };
                        } else if (item.startTimeInSeconds) {
                            //parameters, to store the new entry
                            parameters = {
                                Item: {
                                    "UserID": {
                                        S: UserID
                                    },
                                    "SummaryID": {
                                        S: item.summaryId
                                    },
                                    "UAT": {
                                        S: uat
                                    },
                                    "startTime": {
                                        N: item.startTimeInSeconds.toString()
                                    },
                                    "sumType": {
                                        S: key
                                    },
                                    "data": {
                                        S: encryption.encryption(JSON.stringify(item), access.dataEncPW, false) //encrypt the actual data using a password from the access.json
                                    }
                                },
                                TableName: "FitnessData"
                            };
                        } else if (item.durationInSeconds) {
                            //parameters, to store the new entry
                            parameters = {
                                Item: {
                                    "UserID": {
                                        S: UserID
                                    },
                                    "SummaryID": {
                                        S: item.summaryId
                                    },
                                    "UAT": {
                                        S: uat
                                    },
                                    "duration": {
                                        N: item.durationInSeconds.toString()
                                    },
                                    "sumType": {
                                        S: key
                                    },
                                    "data": {
                                        S: encryption.encryption(JSON.stringify(item), access.dataEncPW, false) //encrypt the actual data using a password from the access.json
                                    }
                                },
                                TableName: "FitnessData"
                            };
                        } else {
                            //parameters, to store the new entry
                            parameters = {
                                Item: {
                                    "UserID": {
                                        S: UserID
                                    },
                                    "SummaryID": {
                                        S: item.summaryId
                                    },
                                    "UAT": {
                                        S: uat
                                    },
                                    "sumType": {
                                        S: key
                                    },
                                    "data": {
                                        S: encryption.encryption(JSON.stringify(item), access.dataEncPW, false) //encrypt the actual data using a password from the access.json
                                    }
                                },
                                TableName: "FitnessData"
                            };
                        }
                        //store the new entry
                        ddb.putItem(parameters, function (err) {
                            if (err) {
                                console.log("error at storing entry: " + err, err.stack);
                            }
                        });
                    }
                });
            }
        }
    }
};