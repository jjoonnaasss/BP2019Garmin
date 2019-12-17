exports.handler = function (event, context, callback) {

    const request = require("request");
    const OAuth = require("oauth-1.0a");
    const crypto = require("crypto");
    const qs = require("querystring");
    const fs = require("fs");

    //read consumer-key and -secret
    const access_rawdata = fs.readFileSync("access.json");
    const access = JSON.parse(access_rawdata);

    var AWS = require("aws-sdk");
    AWS.config.update({region: "eu-central-1"});
    var ddb = new AWS.DynamoDB({apiVersion: "2012-08-10"}); //initialize database

    //read data from ping-notification
    var jsonBody = JSON.parse(event.body);

    var key = Object.keys(jsonBody)[0];

    var uat = jsonBody[key][0].userAccessToken;
    var startTime = jsonBody[key][0].uploadStartTimeInSeconds;
    var endTime = jsonBody[key][0].uploadEndTimeInSeconds;
    var url = jsonBody[key][0].callbackURL;
    console.log("\n uat: " + uat + "\n startTime: " + startTime + "\n endTime: " + endTime + "\n url:" + url);

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
            console.log("Success", data);
            uat_secret = data.Item.Secret.S;
            console.log("UAT: " + uat + ", " + uat_secret);

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

            //create authorization-header
            var auth_header = {
                "Authorization": "OAuth oauth_consumer_key=\"" + access.key + "\", oauth_token=\"" + uat + "\", oauth_signature_method=\"HMAC-SHA1\"" + "\", oauth_signature=\"" + oauth.percentEncode(sig) + "\", oauth_timestamp=\"" + timestamp + "\", oauth_nonce=\"" + nonce + "\", oauth_version=\"1.0\""
            };

            console.log(auth_header);

            //HTTPS-request, to receive the fitness data
            request(
                {
                    headers: auth_header,
                    uri: url,
                    method: "GET"
                },
                function (error, response, body) {
                    console.log("===RESPONSE===");
                    console.log(body);

                    var userData;

                    //parameters, to read all entries for the given uat from the database
                    var params = {
                        TableName: "FitnessData",
                        KeyConditionExpression: "UAT = :key",
                        ExpressionAttributeValues: {
                            ":key": {"S": uat}
                        }
                    };

                    //read all entries for the given uat
                    ddb.query(params, function (err, data) {
                        if (err) {
                            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                        } else {
                            console.log("Query succeeded.");
                            userData = data;

                            JSON.parse(body).forEach(function(item){
                                var stored;
                                if(userData){
                                    userData.Items.forEach(function(entry){
                                        console.log("comparing: " + item.summaryId + ", " + entry.ID.S);
                                        if(item.summaryId == entry.ID.S){
                                            stored = true; //the item is already stored in the database
                                        }
                                    });
                                }

                                if(!stored) {
                                    //parameters, to store the new entry
                                    var parameters = {
                                        Item: {
                                            "UAT": {
                                                S: uat
                                            },
                                            "ID": {
                                                S: item.summaryId
                                            },
                                            "startTime": {
                                                N: item.startTimeInSeconds.toString()
                                            },
                                            "duration": {
                                                N: item.durationInSeconds.toString()
                                            },
                                            "type": {
                                                S: key
                                            },
                                            "data": {
                                                S: qs.stringify(item) //maybe qs.stringify
                                            }
                                        },
                                        TableName: "FitnessData"
                                    };

                                    //store the new entry
                                    ddb.putItem(parameters, function (err, data) {
                                        if (err) console.log("error at storing entry: " + err, err.stack);
                                        else console.log("Successfully stored the entry " + data);
                                    });
                                }
                            });
                        }
                    });
                }
            );
        }
    });
};