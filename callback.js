exports.handler = function(event, context, callback) {

    const request = require('request');
    const OAuth = require('oauth-1.0a');
    const crypto = require('crypto');
    const fs = require('fs');

    var ver = 'no verifier received';
    var oauth_t = 'no oauth_token received';

    //var oauth_t_secret;
    if (event.queryStringParameters && event.queryStringParameters.oauth_verifier) {
        ver = event.queryStringParameters.oauth_verifier;
    }
    if (event.queryStringParameters && event.queryStringParameters.oauth_token) {
        oauth_t = event.queryStringParameters.oauth_token;
    }

    const access_rawdata = fs.readFileSync('access.json');
    const access = JSON.parse(access_rawdata);

    // Load the AWS SDK for Node.js
    var AWS = require('aws-sdk');
    // Set the region
    AWS.config.update({region: 'us-east-2'});
    // Create the DynamoDB service object
    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

    var token = '';

    if(oauth_t != 'no oauth_token received'){

        var params = {
            TableName: 'RequestToken',
            Key: {
                "Token": {
                    S: oauth_t
                }
            }
        };

        // Call DynamoDB to add the item to the table
        ddb.getItem(params, function(err, data) {
            if (err) {
                console.log("Error", err);
            } else {
                console.log("Success", data);
                var oauth_t_secret = data.Item.Secret.S;

                token ={
                    oauth_token : oauth_t,
                    oauth_token_secret : oauth_t_secret
                };

                // Initialize
                const oauth = OAuth({
                    consumer: access,
                    signature_method: 'HMAC-SHA1',
                    hash_function(base_string, key) {
                        return crypto
                            .createHmac('sha1', key)
                            .update(base_string)
                            .digest('base64');
                    }
                });

                const request_data = {
                    url: 'https://connectapi.garmin.com/oauth-service/oauth/access_token',
                    method: 'POST',
                };
                var oauth_form = oauth.authorize(request_data, token);
                console.log(oauth_form);
                oauth_form.oauth_verifier = ver;
                oauth_form.oauth_token = oauth_t;
                console.log(oauth_form);


                request(
                    {
                        url: request_data.url,
                        method: request_data.method,
                        form: oauth_form,
                    },
                    function(error, response, body) {
                        console.log("===RESPONSE===");
                        console.log(body);
                        const newResponse = {
                            statusCode: 200,
                            body: JSON.stringify(body)
                        };
                        return newResponse;
                    }
                );
            }
        });
    }
};