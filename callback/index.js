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

    var AWS = require("aws-sdk");
    AWS.config.update({region: "eu-central-1"});
    var ddb = new AWS.DynamoDB({apiVersion: "2012-08-10"}); //initialize database object

    //initial values to be replaced with the actual parameters
    var ver = "no verifier received";
    var oauth_t = "no oauth_token received";

    //read and save the verifier and the authentication token
    if (event.queryStringParameters && event.queryStringParameters.oauth_verifier) {
        ver = event.queryStringParameters.oauth_verifier;
    }
    if (event.queryStringParameters && event.queryStringParameters.oauth_token) {
        oauth_t = event.queryStringParameters.oauth_token;
    }

    //read consumer-key, -secret and application secret
    const access_rawdata = fs.readFileSync("/opt/access.json");
    const access = JSON.parse(access_rawdata);

    //create response object for the callback
    const res = {
        "statusCode": 200,
        "headers": {
            "Content-Type": "text/html",
        }
    };

    //check, if a token was received
    if (oauth_t !== "no oauth_token received") {

        //parameters for the database access
        var params = {
            TableName: "RequestToken",
            Key: {
                "Token": {
                    S: oauth_t
                }
            }
        };

        //set response body with automatic redirection to applications callback website
        res.body = "<meta http-equiv=\"refresh\" content=\"0; URL=http://192.168.178.5/callback.php\">";

        //callback to the user
        callback(null, res);

        //read secret matching with the available token from dynamodb table
        ddb.getItem(params, function (err, data) {
            if (err) {
                console.log("Error", err);
            } else {
                var oauth_t_secret = data.Item.Secret.S;
                var mail = data.Item.Mail.S;

                // initialize oauth for the nonce and timestamp
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

                //define URL and method for the HTTPS call
                const request_data = {
                    url: "https://connectapi.garmin.com/oauth-service/oauth/access_token",
                    method: "POST",
                };

                const nonce = oauth.getNonce();
                const timestamp = oauth.getTimeStamp();

                //create base-string-parameters for the oauth-signature
                var base_string_params = {
                    oauth_consumer_key: access.key,
                    oauth_nonce: nonce,
                    oauth_signature_method: "HMAC-SHA1",
                    oauth_timestamp: timestamp,
                    oauth_version: "1.0",
                    oauth_verifier: ver,
                    oauth_token: oauth_t
                };

                //create signature
                var sig = oauth.getSignature(request_data, oauth_t_secret, base_string_params);

                //HTTPS-Request to acquire a user-access-token
                request({
                    headers: {
                        "Authorization": "OAuth oauth_consumer_key=\"" + access.key + "\", oauth_nonce=\"" + nonce + "\", oauth_signature=\"" + oauth.percentEncode(sig) + "\", oauth_signature_method=\"HMAC-SHA1\", oauth_timestamp=\"" + timestamp + "\", oauth_token=\"" + oauth_t + "\", oauth_verifier=\"" + ver + "\", oauth_version=\"1.0\"",
                        "Content-Length": 0
                    },
                    uri: request_data.url,
                    method: "POST"
                }, function (error, response, body) {

                    //remove the request-token from the table
                    var params = {
                        TableName: "RequestToken",
                        Key: {
                            "Token": {S: oauth_t}
                        }
                    };

                    ddb.deleteItem(params, function (err) {
                        if (err) {
                            console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
                        }
                    });

                    //store user access token in the table
                    params = {
                        TableName: "UserAccessTokens",
                        Item: {
                            "UAT": {
                                S: body.split("&")[0].split("=")[1] //extract token from string containing token and secret
                            },
                            "Secret": {
                                S: encryption.encryption(body.split("&")[1].split("=")[1], access.encPW, false) //extract secret from string containing token and secret and encrypt it
                            },
                            "Mail": {
                                S: mail
                            }
                        }
                    };


                    ddb.putItem(params, function (err) {
                        if (err) {
                            console.log("Error with storing UAT", err);
                        }
                    });

                    //add user access token to the entry with the fitting mail address in the UserData table
                    params = {
                        TableName: "UserData",
                        Key: {
                            "Mail": {
                                S: mail
                            }
                        },
                        ExpressionAttributeNames: {
                            "#UAT": "UAT",
                        },
                        ExpressionAttributeValues: {
                            ":uat": {
                                S: body.split("&")[0].split("=")[1] //extract token from string containing token and secret
                            },
                        },
                        UpdateExpression: "SET #UAT = :uat"
                    };

                    ddb.updateItem(params, function (err) {
                        if (err) {
                            console.log(err, err.stack); // an error occurred
                        }
                    });

                    const newResponse = {
                        statusCode: 200,
                        body: JSON.stringify(body)
                    };
                    return newResponse;
                });
            }
        });
    } else {
        //set response body
        res.body = oauth_t;

        //callback to the user
        callback(null, res);
    }
};