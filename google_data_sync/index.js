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

    if (event.body) {

        var postData = event.body.split("*");
        //create variables to store the parameters received from the website
        var mail = postData[1];
        var pwhash = postData[3];

        //check, if website sent the correct secret
        if (postData[5] !== access.app_secret) {
            console.log("wrong secret");
            return;
        }

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
            if (err || !data.Item || (data.Item.PWHash.S !== pwhash)) { //compare passwords
                let res = {
                    "statusCode": 401,
                    "headers": {
                        "Content-Type": "text/plain",
                    },
                    "body": "error with login"
                };
                callback(null, res); //return error
                console.log("Error (with login)", err);
            } else if (!data.Item.Google_token || !data.Item.GoogleTimestamp) { //check, if account is connected with Google
                let res = {
                    "statusCode": 401,
                    "headers": {
                        "Content-Type": "text/plain",
                    },
                    "body": "no google connection"
                };
                callback(null, res); //return error
                console.log("no google connection", err);
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
                                        storePoints(points, mail, currentTimestamp, 0, callback);
                                    }
                                } else {
                                    len--;
                                    resp.data.bucket.forEach(bucket => bucket.dataset.forEach(dataset => dataset.point.forEach(point => points.push(JSON.stringify(point)))));
                                    if (len <= 0) {
                                        storePoints(points, mail, currentTimestamp, 0, callback);
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
    }
};

//stores the received data in the database using multiple entries, max. 500 points per entry
function storePoints(points, mail, timestamp, counter, callback) {

    //dependencies
    const encryption = require("/opt/encryption");
    const fs = require("fs");
    //read client-id, -secret and application secret
    const access_rawdata = fs.readFileSync("/opt/access.json");
    const access = JSON.parse(access_rawdata);
    //initialize database
    var AWS = require("aws-sdk");
    AWS.config.update({region: "eu-central-1"});
    var ddb = new AWS.DynamoDB({apiVersion: "2012-08-10"});


    if (points.length <= 500 && points.length > 0) {
        //parameters for the database access
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
                    S: encryption.encryption(points.join(","), access.dataEncPW, false) //encrypt the actual data using a password from the access.json
                }
            }
        };

        ddb.putItem(parameters, function (err) {
            if (err) {
                console.log(err);
            } else {
                //parameters for the database access
                parameters = {
                    TableName: "UserData",
                    Key: {
                        "Mail": {
                            S: mail
                        }
                    },
                    ExpressionAttributeNames: {
                        "#GTS": "GoogleTimestamp",
                    },
                    ExpressionAttributeValues: {
                        ":gts": {
                            S: Date.now().toString()
                        },
                    },
                    UpdateExpression: "SET #GTS = :gts"
                };

                //add the google token to the existing database entry of the user
                ddb.updateItem(parameters, function (err) {
                    if (err) {
                        console.log(err, err.stack); // an error occurred
                    }
                    //create response for the website
                    let res = {
                        "statusCode": 200,
                        "headers": {
                            "Content-Type": "text/plain",
                        },
                        "body": "done"
                    };
                    callback(null, res); //return response to website
                    console.log("done", err);
                });
            }
        });
    } else if (points.length > 0) {
        var array = points.slice(0, 500);

        //parameters for the database access
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
                    S: encryption.encryption(array.join(","), access.dataEncPW, false) //encrypt the actual data using a password from the access.json
                }
            }
        };

        ddb.putItem(params, function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log("calling with " + array.slice(500).length + "entries and counter = " + (counter + 1));
                storePoints(points.slice(500), mail, timestamp, counter + 1, callback);
            }
        });
    } else {
        //create response for the website
        let res = {
            "statusCode": 200,
            "headers": {
                "Content-Type": "text/plain",
            },
            "body": "no new data"
        };
        callback(null, res); //return response to website
        console.log("no new data");
    }
}