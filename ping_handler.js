exports.handler = function(event, context, callback) {

    const request = require("request");
    const OAuth = require("oauth-1.0a");
    const crypto = require("crypto");
    const fs = require("fs");
    const oauthSignature = require("oauth-signature");

    var jsonBody = JSON.parse(event.body);
    var uat = jsonBody.epochs[0].userAccessToken;
    var startTime = jsonBody.epochs[0].uploadStartTimeInSeconds;
    var endTime = jsonBody.epochs[0].uploadEndTimeInSeconds;
    var url = jsonBody.epochs[0].callbackURL;
    console.log("\n uat: " + uat + "\n startTime: " + startTime + "\n endTime: " + endTime + "\n url:" + url);

    const res = {
        "statusCode": 200
    };

    callback(null, res);

    // Load the AWS SDK for Node.js
    var AWS = require("aws-sdk");
    // Set the region
    AWS.config.update({region: "us-east-2"});
    // Create the DynamoDB service object
    var ddb = new AWS.DynamoDB({apiVersion: "2012-08-10"});

    var uat_secret;


    var params = {
        TableName: "UserAccessTokens",
        Key: {
            "UAT": {
                S: uat
            }
        }
    };

    // Call DynamoDB to add the item to the table
    ddb.getItem(params, function(err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            console.log("Success", data);
            uat_secret = data.Item.Secret.S;
        }
    });

    console.log("UAT: " + uat + ", " + uat_secret);

    const access_rawdata = fs.readFileSync("access.json");
    const access = JSON.parse(access_rawdata);

    // Initialize
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

    var base_string_params = {
        oauth_consumer_key: access.key,
        oauth_token: uat,
        oauth_signature_method: "HMAC-SHA1",
        oauth_timestamp: oauth.getTimeStamp(),
        oauth_nonce: oauth.getNonce()
    };

    var url_arr = url.split("?");

    var sig = oauthSignature.generate("GET", url_arr[0], base_string_params, access.secret, uat_secret);

    var form = oauth.authorize({url: url, method: "GET"}, {oauth_token : uat, oauth_token_secret : uat_secret, secret: uat_secret});

    form.oauth_signature = sig;

    var auth_header = oauth.toHeader(form);
    auth_header.Authorization = auth_header.Authorization + ", oauth_token=" + "\"" + uat + "\"";

    console.log(auth_header);

    request(
        {
            url: url,
            method: "GET",
            headers: auth_header,
        },
        function(error, response, body) {
            console.log("===RESPONSE===");
            console.log(body);
        }
    );
};