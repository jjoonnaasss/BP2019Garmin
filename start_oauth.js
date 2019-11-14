exports.handler = function(event, context, callback) {

    // Dependencies
    const request = require('request');
    const OAuth = require('oauth-1.0a');
    const crypto = require('crypto');
    const qs = require('querystring');
    const fs = require('fs');

    const access_rawdata = fs.readFileSync('access.json');
    const access = JSON.parse(access_rawdata);
    const res = {
        "statusCode": 200,
        "headers": {
            "Content-Type": "text/plain",
            "Access-Control-Allow-Origin" : "*"
        }
    };

    // Load the AWS SDK for Node.js
    var AWS = require('aws-sdk');
    // Set the region
    AWS.config.update({region: 'us-east-2'});
    // Create the DynamoDB service object
    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});


    // Initialize
    const oauth = OAuth({
        consumer: access,
        signature_method: 'HMAC-SHA1',
        hash_function(base_string, key) {
            return crypto
                .createHmac('sha1', key)
                .update(base_string)
                .digest('base64');
        },
    });

    const request_data = {
        url: 'https://connectapi.garmin.com/oauth-service/oauth/request_token',
        method: 'POST',
    };

    request(
        {
            url: request_data.url,
            method: request_data.method,
            form: oauth.authorize(request_data),
        },
        function(error, response, body) {
            const req_data = qs.parse(body);

            var params = {
                TableName: 'RequestToken',
                Item: {
                    "Token": {
                        S: req_data.oauth_token
                    },
                    "Secret": {
                        S: req_data.oauth_token_secret
                    }
                }
            };

            // Call DynamoDB to add the item to the table
            ddb.putItem(params, function(err, data) {
                if (err) {
                    console.log("Error", err);
                } else {
                    console.log("Success", data);
                }
            });

            res.body = 'https://connect.garmin.com/oauthConfirm' +
                '?' + qs.stringify({oauth_token: req_data.oauth_token});
            callback(null, res);
        }
    );
};