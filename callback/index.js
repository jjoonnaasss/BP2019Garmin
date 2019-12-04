exports.handler = function (event) {

    const request = require("request");
    const OAuth = require("oauth-1.0a");
    const crypto = require("crypto");
    const fs = require("fs");

    var AWS = require("aws-sdk");
    AWS.config.update({region: "us-east-2"});
    var ddb = new AWS.DynamoDB({apiVersion: "2012-08-10"}); //initialize database object

    //initial values to be replaced with the actual parameters
    var ver = "no verifier received";
    var oauth_t = "no oauth_token received";

    //read and save the given parameters
    if (event.queryStringParameters && event.queryStringParameters.oauth_verifier) {
        ver = event.queryStringParameters.oauth_verifier;
    }
    if (event.queryStringParameters && event.queryStringParameters.oauth_token) {
        oauth_t = event.queryStringParameters.oauth_token;
    }

    //read consumer-key and -secret
    const access_rawdata = fs.readFileSync("access.json");
    const access = JSON.parse(access_rawdata);

    //check, if a token was received
    if (oauth_t != "no oauth_token received") {

        //parameters for the database access
        var params = {
            TableName: "RequestToken",
            Key: {
                "Token": {
                    S: oauth_t
                }
            }
        };

        //read secret matching with the available token from dynamodb table
        ddb.getItem(params, function (err, data) {
            if (err) {
                console.log("Error", err);
            } else {
                console.log("Success", data);
                var oauth_t_secret = data.Item.Secret.S;

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
                const tstamp = oauth.getTimeStamp();

                //create base-string-parameters for the oauth-signature
                var base_string_params = {
                    oauth_consumer_key: access.key,
                    oauth_nonce: nonce,
                    oauth_signature_method: oauth.signature_method,
                    oauth_timestamp: tstamp,
                    oauth_version: oauth.version,
                    oauth_verifier: ver,
                    oauth_token: oauth_t
                };

                //create signature
                var sig = oauth.getSignature(request_data, oauth_t_secret, base_string_params);

                //HTTPS-Request to acquire a user-access-token
                request({
                    headers: {
                        "Authorization": "OAuth oauth_consumer_key=\"" + access.key + "\", oauth_nonce=\"" + nonce + "\", oauth_signature=\"" + oauth.percentEncode(sig) + "\", oauth_signature_method=\"HMAC-SHA1\", oauth_timestamp=\"" + tstamp + "\", oauth_token=\"" + oauth_t + "\", oauth_verifier=\"" + ver + "\", oauth_version=\"1.0\"",
                        "Content-Length": 0
                    },
                    uri: request_data.url,
                    method: "POST"
                }, function (error, response, body) {
                    console.log("===RESPONSE===");
                    console.log(body);
                    const newResponse = {
                        statusCode: 200,
                        body: JSON.stringify(body)
                    };
                    return newResponse;
                });
            }
        });
    }
};