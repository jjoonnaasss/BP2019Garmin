exports.handler = function (event, context, callback) {

    const request = require("request");
    const OAuth = require("oauth-1.0a");
    const crypto = require("crypto");
    const fs = require("fs");
    const oauthSignature = require("oauth-signature");

    //Consumer-Key und -Secret einlesen
    const access_rawdata = fs.readFileSync("access.json");
    const access = JSON.parse(access_rawdata);

    var AWS = require("aws-sdk");
    AWS.config.update({region: "us-east-2"});
    var ddb = new AWS.DynamoDB({apiVersion: "2012-08-10"}); //Datenbank-Objekt initialisieren

    //Daten aus der Ping-Notification abspeichern
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
    //Statuscode 200 antworten, damit der Ping nicht erneut gesendet wird
    callback(null, res);

    var uat_secret; //Variable für das Secret aus der Datenbank erstellen

    //Parameter für den Datenbankzugriff
    var params = {
        TableName: "UserAccessTokens",
        Key: {
            "UAT": {
                S: uat
            }
        }
    };

    // Secret zum vorhandenen UAT aus der Datenbank auslesen
    ddb.getItem(params, function (err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            console.log("Success", data);
            uat_secret = data.Item.Secret.S;
        }
    });

    console.log("UAT: " + uat + ", " + uat_secret);

    // OAuth-Instanz initialisieren
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

    //Base-String-Parameter für OAuth erstellen
    var base_string_params = {
        oauth_consumer_key: access.key,
        oauth_token: uat,
        oauth_signature_method: "HMAC-SHA1",
        oauth_timestamp: oauth.getTimeStamp(),
        oauth_nonce: oauth.getNonce()
    };

    //URL in zwei Teile trennen, um auf die URL ohne Upload-Zeiten zugreifen zu können
    var url_arr = url.split("?");

    //Signatur erstellen
    var sig = oauthSignature.generate("GET", url_arr[0], base_string_params, access.secret, uat_secret);

    //OAuth-Daten erstellen lassen
    var form = oauth.authorize({url: url, method: "GET"}, {
        oauth_token: uat,
        oauth_token_secret: uat_secret,
        secret: uat_secret
    });

    //Signatur manuell abspeichern
    form.oauth_signature = sig;

    //Authorization-Header erstellen
    var auth_header = oauth.toHeader(form);
    auth_header.Authorization = auth_header.Authorization + ", oauth_token=" + "\"" + uat + "\""; //UAT in den Header einbauen

    console.log(auth_header);

    //HTTPS-Request, um die tatsächlichen Daten anzufordern
    request(
        {
            url: url,
            method: "GET",
            headers: auth_header,
        },
        function (error, response, body) {
            console.log("===RESPONSE===");
            console.log(body);

            //TODO: body kann aus mehreren Summaries zusammengesetzt sein -> foreach über das body-array?; zwischen verschiedenen Daten-Arten unterscheiden

            //Daten abspeichern, die neben dem UAT benötigt werden, um die Datenbankeinträge eindeutig identifizeren zu können
            var start = body.startTimeInSeconds;
            var end = body.startTimeOffsetInSeconds;
            var id = body.summaryId;

            //Parameter, um alle Einträge für das gegebene UAT auslesen zu können
            var params = {
                TableName: "FitnessData",
                KeyConditionExpression: "UAT = :key",
                ExpressionAttributeValues: {
                    ":key": {"S": uat}
                }
            };

            //alle Einträge für das gegebene UAT auslesen
            ddb.query(params, function (err, data) {
                if (err) {
                    console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                } else {
                    console.log("Query succeeded.");
                    data.Items.forEach(function (item) {
                        if (item.startTime.S.equals(start) && item.endTime.S.equals(end)) { //existiert bereits ein Eintrag mit gleicher Start- und Endzeit, müssen keine neuen Daten gespeichert werden
                            return;
                        } else if (item.startTime.S.equals(start)) {    //existiert ein Eintrag mit gleicher Start-, aber anderer Endzeit, wird er gelöscht, um eine aktuellere Version zu speichern
                            let parameters = {
                                Key: {
                                    "UAT": {
                                        S: item.UAT.S
                                    },
                                    "ID": {
                                        S: item.ID.S
                                    }
                                },
                                TableName: "FitnessData"
                            };
                            ddb.deleteItem(parameters, function (err, data) {
                                if (err) console.log(err, err.stack);
                                else console.log(data);
                            });
                        }

                        //Parameter, um die neuen Daten abzuspeichern
                        var parameters = {
                            Item: {
                                "UAT": {
                                    S: uat
                                },
                                "ID": {
                                    S: id
                                },
                                "startTime": {
                                    S: start
                                },
                                "endTime": {
                                    S: end
                                },
                                "data": {
                                    S: JSON.stringify(body) //maybe qs.stringify
                                }
                            },
                            TableName: "FitnessData"
                        };

                        //Speichern der neuen Daten in der Datenbank
                        ddb.putItem(parameters, function (err, data) {
                            if (err) console.log(err, err.stack);
                            else console.log("Success! " + data);
                        });
                    });
                }
            });
        }
    );
};