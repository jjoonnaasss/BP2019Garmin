exports.handler = function () {
    //dependencies
    const {google} = require("googleapis");
    const fs = require("fs");
    const fit = google.fitness("v1");

    //initialize database
    var AWS = require("aws-sdk");
    AWS.config.update({region: "eu-central-1"});
    var ddb = new AWS.DynamoDB({apiVersion: "2012-08-10"});

    //read client-id, -secret and application secret
    const access_rawdata = fs.readFileSync("/opt/access.json");
    const access = JSON.parse(access_rawdata);

    var points = [];

    //create oauth2-client
    const oauth2Client = new google.auth.OAuth2(
        access.id,
        access.secret
    );

    var mail = "***";

    //parameters for the database access
    var parameters = {
        TableName: "UserData",
        Key: {
            "Mail": {
                S: mail
            }
        }
    };

    var tokens;

    ddb.getItem(parameters, function (err, data) { //check, if mail is already registered
        if (err) {
            console.log(err);
        } else {
            tokens = JSON.parse(data.Item.Google_token.S);
            console.log("tokens: " + tokens);

            oauth2Client.setCredentials({
                access_token: tokens.access_token
            });

            let googleTimestamp = data.Item.GoogleTimestamp.S;
            let currentTimestamp = Date.now().toString();

            fit.users.dataSources.list({auth: oauth2Client, userId: "me"}, function (err, resp) {
                if (err) {
                    console.log(err);
                } else {
                    let len = resp.data.dataSource.length;
                    resp.data.dataSource.forEach(source => {
                        fit.users.dataset.aggregate({
                            auth: oauth2Client,
                            userId: "me",
                            requestBody: {
                                startTimeMillis: googleTimestamp,
                                endTimeMillis: currentTimestamp,
                                aggregateBy: [{dataSourceId: source.dataStreamId}]
                            }
                        }, function (err, resp) {
                            if (err) {
                                //console.log(err);
                                len--;
                                if (len <= 0) {
                                    storePoints(points, mail, currentTimestamp, 0);
                                }
                            } else {
                                len--;
                                resp.data.bucket.forEach(bucket => bucket.dataset.forEach(dataset => dataset.point.forEach(point => points.push(JSON.stringify(point)))));
                                if (len <= 0) {
                                    storePoints(points, mail, currentTimestamp, 0);
                                }
                            }
                        });
                    });
                    console.log(points.length);
                }
            });

            console.log(points.length);

            /*fit.users.dataSources.datasets.get({auth: oauth2Client, userId: "me", dataSourceId: "derived:com.google.calories.expended:com.google.android.gms:from_activities",
                datasetId: "1580896800000000000-1581253200000000000"}, function(err, resp) {
                if(err) {
                    console.log(err);
                } else {
                    console.log(JSON.stringify(resp));
                }
            });*/
        }
    });
};


function storePoints(points, mail, timestamp, counter) {
    //initialize database
    var AWS = require("aws-sdk");
    AWS.config.update({region: "eu-central-1"});
    var ddb = new AWS.DynamoDB({apiVersion: "2012-08-10"});


    if (points.length <= 1000) {
        console.log("if with " + points.length + "entries");
        var parameters = {
            TableName: "GoogleData",
            Item: {
                "Mail": {
                    S: mail
                },
                "ExportTime": {
                    S: timestamp + "_" + counter
                },
                "Data": {
                    S: points.join("§$§")
                }
            }
        };

        ddb.putItem(parameters, function (err) {
            if (err) {
                console.log(err);
            }
        });
    } else {
        console.log("else with " + points.length + "entries");
        var array = points.slice(0, 1000);

        var params = {
            TableName: "GoogleData",
            Item: {
                "Mail": {
                    S: mail
                },
                "ExportTime": {
                    S: timestamp + "_" + counter
                },
                "Data": {
                    S: array.join("§$§")
                }
            }
        };

        ddb.putItem(params, function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log("calling with " + points.slice(1000).length + "entries and counter = " + (counter+1));
                storePoints(points.slice(1000), mail, timestamp, counter+1);
            }
        });
    }
}