exports.handler = function (event, context, callback) {

    // Dependencies
    const request = require("request");
    const OAuth = require("oauth-1.0a");
    const crypto = require("crypto");
    const qs = require("querystring");
    const fs = require("fs");

    var AWS = require("aws-sdk");
    AWS.config.update({region: "us-east-2"});
    var ddb = new AWS.DynamoDB({apiVersion: "2012-08-10"}); //Datenbank-Objekt initialisieren

    //Consumer-Key und -Secret einlesen
    const access_rawdata = fs.readFileSync("access.json");
    const access = JSON.parse(access_rawdata);

    //Access-Control-Allow-Origin ermöglicht Zugriff auf das Response-Objekt
    const res = {
        "statusCode": 200,
        "headers": {
            "Content-Type": "text/plain",
            "Access-Control-Allow-Origin": "*"
        }
    };


    // OAuth-Instanz initialisieren
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

    //HTTPS-Request, um ein Request-Token inklusive Secret anzufordern
    request(
        {
            url: request_data.url,
            method: request_data.method,
            form: oauth.authorize(request_data),
        },
        function (error, response, body) {
            const req_data = qs.parse(body);

            //Parameter, um das Token in die Datenbank zu speichern
            var params = {
                TableName: "RequestToken",
                Item: {
                    "Token": {
                        S: req_data.oauth_token
                    },
                    "Secret": {
                        S: req_data.oauth_token_secret
                    }
                }
            };

            //Token in die Datenbank speichern
            ddb.putItem(params, function (err, data) {
                if (err) {
                    console.log("Error", err);
                } else {
                    console.log("Success", data);
                }
            });

            //Weiterleitung des Nutzers zur Bestätigungs-URL
            res.body = "https://connect.garmin.com/oauthConfirm" +
                "?" + qs.stringify({oauth_token: req_data.oauth_token});
            callback(null, res);
        }
    );
};