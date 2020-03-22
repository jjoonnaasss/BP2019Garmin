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
    const request = require("request");
    const OAuth = require("oauth-1.0a");
    const crypto = require("crypto");
    const qs = require("querystring");
    const fs = require("fs");

    const AWS = require("aws-sdk");
    AWS.config.update({region: "eu-central-1"});
    const ddb = new AWS.DynamoDB({apiVersion: "2012-08-10"}); //initialize database

    //read consumer-key, -secret and application secret
    const accessRawdata = fs.readFileSync("/opt/access.json");
    const access = JSON.parse(accessRawdata);

    //initial values to be replaced with the actual parameters
    var mail = "empty";
    var pwHash = "empty";
    var secret = "empty";

    if (event.body) {   //save the given mail-address and given password

        var postData = event.body.split("*");

        if (postData.length === 7) { //read values entered by the user to create a new account in the database and start connection with garmin
            mail = postData[1];
            pwHash = postData[3];
            secret = postData[5];

            var parameters = {
                TableName: "UserData",
                Key: {
                    "Mail": {
                        S: postData[1]
                    }
                }
            };

            ddb.getItem(parameters, function (err, data) { //check, if mail is already registered
                if (!err && data.Item) {
                    let res = {
                        "statusCode": 401,
                        "headers": {
                            "Content-Type": "text/plain",
                        },
                        "body": "mail already registered"
                    };
                    callback(null, res); //return error
                    console.log("already registered");
                } else {
                    contact_garmin(OAuth, request, crypto, qs, ddb, callback, access, mail, pwHash, secret, "");
                }
            });
        }

        if (postData.length >= 8) { //read current password hash from database to reconnect existing account with garmin
            mail = postData[1];
            pwHash = postData[3];
            secret = postData[5];
            var params = {
                TableName: "UserData",
                Key: {
                    "Mail": {
                        S: mail
                    }
                }
            };

            //read password hash from database
            ddb.getItem(params, function (err, data) {
                if (err || !data.Item ||(data.Item.PWHash.S !== pwHash)) {
                    let res = {
                        "statusCode": 401,
                        "headers": {
                            "Content-Type": "text/plain",
                        },
                        "body": "error with login"
                    };
                    callback(null, res); //return error
                    console.log("Error", err);
                } else {
                    if(data.Item.UAT){
                        let parameters = {
                            TableName: "UserAccessTokens",
                            Key: {
                                "UAT": {S: data.Item.UAT.S}
                            }
                        };

                        ddb.deleteItem(parameters, function (err) { //delete old user access token
                            if (err) {
                                console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
                            }
                        });
                    }

                    let uid = "";
                    if (data.Item.UserID) {
                        uid = data.Item.UserID.S;
                    }
                    contact_garmin(OAuth, request, crypto, qs, ddb, callback, access, mail, pwHash, secret, uid);
                }
            });
        }
    }
};

//function to contact the garmin api, receive a request-token and let user confirm connection
var contact_garmin = function (OAuth, request, crypto, qs, ddb, callback, access, mail, pwHash, secret, UserID) {

    if (secret !== access.app_secret) { //check secret-value
        console.log("wrong secret");
        return;
    }

    const res = { //create response-object
        statusCode: 200,
        headers: {
            "Content-Type": "text/plain",
            "Access-Control-Allow-Origin": "*" //Access-Control-Allow-Origin enables access to the response-object
        }
    };

    // initialize OAuth
    const oauth = OAuth({
        consumer: access,
        signature_method: "HMAC-SHA1",
        hash_function(base_string, key) {
            return crypto
                .createHmac("sha1", key)
                .update(base_string)
                .digest("base64");
        },
    });

    const request_data = {
        url: "https://connectapi.garmin.com/oauth-service/oauth/request_token",
        method: "POST",
    };

    //HTTPS-Request, to ask for a request-token with a request-token secret
    request(
        {
            url: request_data.url,
            method: request_data.method,
            form: oauth.authorize(request_data),
        },
        function (error, response, body) {
            const req_data = qs.parse(body);

            //parameters to store token
            var params = {
                TableName: "RequestToken",
                Item: {
                    "Token": {
                        S: req_data.oauth_token
                    },
                    "Secret": {
                        S: req_data.oauth_token_secret
                    },
                    "Mail": {
                        S: mail
                    }
                }
            };

            //store token into dynamoDB
            ddb.putItem(params, function (err) {
                if (err) {
                    console.log("Error at storing token", err);
                }
            });

            if (mail !== "empty" && pwHash !== "empty") {
                if (UserID === "") {
                    //parameters to store mail with password
                    params = {
                        TableName: "UserData",
                        Item: {
                            "Mail": {
                                S: mail
                            },
                            "PWHash": {
                                S: pwHash
                            }
                        }
                    };
                } else {
                    //parameters to store mail with password
                    params = {
                        TableName: "UserData",
                        Item: {
                            "Mail": {
                                S: mail
                            },
                            "PWHash": {
                                S: pwHash
                            },
                            "UserID": {
                                S: UserID
                            }
                        }
                    };
                }

                //store mail with password
                ddb.putItem(params, function (err) {
                    if (err) {
                        console.log("Error at storing mail and pw", err);
                    }
                });
            }

            //redirect user to the verification URL
            res.body = "https://connect.garmin.com/oauthConfirm" +
                "?" + qs.stringify({oauth_token: req_data.oauth_token});
            callback(null, res);
        }
    );
};