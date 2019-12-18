exports.handler = function (event, context, callback) {
    // Test. Ignore
    // Dependencies
    const request = require("request");
    const OAuth = require("oauth-1.0a");
    const crypto = require("crypto");
    const qs = require("querystring");
    const fs = require("fs");

    var AWS = require("aws-sdk");
    AWS.config.update({region: "eu-central-1"});
    var ddb = new AWS.DynamoDB({apiVersion: "2012-08-10"}); //initialize database

    //read consumer-key and -secret
    const access_rawdata = fs.readFileSync("/opt/access.json");
    const access = JSON.parse(access_rawdata);


    //initial values to be replaced with the actual parameters
    var mail = "empty";
    var pwhash = "empty";

    if (event.body) {  //read and save the given parameters
        var postData = event.body.split("*");
        if (postData.length >= 3) {
            mail = postData[1];
            pwhash = postData[3];
        }
    }

    //Access-Control-Allow-Origin enables access to the response-object
    const res = {
        statusCode: 200,
        headers: {
            "Content-Type": "text/plain",
            "Access-Control-Allow-Origin": "*"
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

    //HTTPS-Request, to ask for a request-token with a secret
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

            //store token
            ddb.putItem(params, function (err, data) {
                if (err) {
                    console.log("Error at storing token", err);
                } else {
                    console.log("token stored", data);
                }
            });

            if (mail != "empty" && pwhash != "empty") {
                //parameters to store mail with password
                params = {
                    TableName: "UserData",
                    Item: {
                        "Mail": {
                            S: mail
                        },
                        "PWHash": {
                            S: pwhash
                        }
                    }
                };

                //store mail with password
                ddb.putItem(params, function (err, data) {
                    if (err) {
                        console.log("Error at storing mail and pw", err);
                    } else {
                        console.log("mail and pw stored", data);
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