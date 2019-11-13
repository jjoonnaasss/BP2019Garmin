exports.handler = function(event, context, callback) {

// Dependencies
    const request = require('request');
    const OAuth = require('oauth-1.0a');
    const crypto = require('crypto');
    const qs = require('querystring');
    const fs = require('fs');

    const access_rawdata = fs.readFileSync('access.json');
    const access = JSON.parse(access_rawdata);
    var redirect = "";

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
            const uri = 'https://connect.garmin.com/oauthConfirm' +
                '?' + qs.stringify({oauth_token: req_data.oauth_token});
            console.log("===URL===");
            redirect = uri;
            console.log(redirect);
            callback(null, uri);
        }
    );
};
