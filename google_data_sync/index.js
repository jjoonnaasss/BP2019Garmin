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
    const AWS = require("aws-sdk");
    AWS.config.update({region: "eu-central-1"});
    const ddb = new AWS.DynamoDB({apiVersion: "2012-08-10"});

    //read client-id, -secret and application secret
    const accessRawdata = fs.readFileSync("/opt/access.json");
    const access = JSON.parse(accessRawdata);

    let points = [];

    //create oauth2-client
    const oauth2Client = new google.auth.OAuth2(
        access.id,
        access.secret
    );

    if (event.body) {

        const postData = event.body.split("*");
        //create variables to store the parameters received from the website
        const mail = postData[1];
        const pwHash = postData[3];

        //check, if website sent the correct secret
        if (postData[5] !== access.app_secret) {
            console.log("wrong secret");
            return;
        }

        //parameters for the database access
        const parameters = {
            TableName: "UserData",
            Key: {
                "Mail": {
                    S: mail
                }
            }
        };

        let tokens;

        ddb.getItem(parameters, function (err, data) { //check, if mail is already registered
            if (err || !data.Item || (data.Item.PWHash.S !== pwHash)) { //compare passwords
                const res = {
                    "statusCode": 401,
                    "headers": {
                        "Content-Type": "text/plain",
                    },
                    "body": "error with login"
                };
                callback(null, res); //return error
                console.log("Error (with login)", err);
            } else if (!data.Item.Google_token || !data.Item.GoogleTimestamp) { //check, if account is connected with Google
                const res = {
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

                //give tokens to the oauth client
                oauth2Client.setCredentials({
                    access_token: tokens.access_token
                });

                //store last synchronized and current timestamps
                const googleTimestamp = data.Item.GoogleTimestamp.S;
                const currentTimestamp = Date.now().toString();

                //request the list of all data sources the user has
                fit.users.dataSources.list({auth: oauth2Client, userId: "me"}, function (err, resp) {
                    if (!err) {
                        let len = resp.data.dataSource.length;

                        //iterate over the data sources
                        resp.data.dataSource.forEach(source => {

                            //request the actual data stored in the data source
                            fit.users.dataset.aggregate({
                                auth: oauth2Client,
                                userId: "me",
                                requestBody: {
                                    startTimeMillis: googleTimestamp,
                                    endTimeMillis: currentTimestamp,
                                    aggregateBy: [{dataSourceId: source.dataStreamId}]
                                }
                            }, function (err, resp) {

                                //collect the data from the different data sources
                                if (!err) {
                                    len--;
                                    resp.data.bucket.forEach(bucket => bucket.dataset.forEach(dataset => dataset.point.forEach(point => points.push(JSON.stringify(point)))));

                                    //call store function if all data was collected
                                    if (len <= 0) {
                                        storePoints(points, mail, currentTimestamp, 0, callback);
                                    }
                                } else {
                                    len--;

                                    //call store function if all data was collected
                                    if (len <= 0) {
                                        storePoints(points, mail, currentTimestamp, 0, callback);
                                    }
                                }
                            });
                        });
                    } else {
                        console.log(err);
                    }
                });
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
    const accessRawdata = fs.readFileSync("/opt/access.json");
    const access = JSON.parse(accessRawdata);
    //initialize database
    const AWS = require("aws-sdk");
    AWS.config.update({region: "eu-central-1"});
    const ddb = new AWS.DynamoDB({apiVersion: "2012-08-10"});

    //check if the points-list is small enough to start the last iteration
    if (points.length <= 500 && points.length > 0) {
        //parameters for the database access
        let parameters = {
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

        //store the encrypted data
        ddb.putItem(parameters, function (err) {
            if (!err) {
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
                    if (!err) {
                        //create response for the website
                        const res = {
                            "statusCode": 200,
                            "headers": {
                                "Content-Type": "text/plain",
                            },
                            "body": "done"
                        };
                        callback(null, res); //return response to website
                        console.log("done", err);
                    } else {
                        console.log(err, err.stack); // an error occurred
                    }
                });
            } else {
                console.log(err);
            }
        });
    } else if (points.length > 0) { //case, where there are too many datapoints to start last iteration -> recursion
        const array = points.slice(0, 500);

        //parameters for the database access
        const params = {
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

        //store the encrypted data
        ddb.putItem(params, function (err) {
            if (!err) {
                console.log("calling with " + array.slice(500).length + "entries and counter = " + (counter + 1));
                storePoints(points.slice(500), mail, timestamp, counter + 1, callback); //recursion, call function again with remaining data, that has not yet been stored
            } else {
                console.log(err);
            }
        });
    } else {
        //create response for the website
        const res = {
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