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

    //initialize database
    const AWS = require("aws-sdk");
    AWS.config.update({region: "eu-central-1"});
    const ddb = new AWS.DynamoDB({apiVersion: "2012-08-10"});

    //read client-id, -secret and application secret
    const accessRawdata = fs.readFileSync("/opt/access.json");
    const access = JSON.parse(accessRawdata);

    //create oauth2-client
    const oauth2Client = new google.auth.OAuth2(
        access.id,
        access.secret,
        "https://eu0kfjg03f.execute-api.eu-central-1.amazonaws.com/default/oauth2_google"
    );

    //create response object
    const res = {
        "statusCode": 200,
        "headers": {
            "Content-Type": "text/html",
        }
    };

    if (event.queryStringParameters && event.queryStringParameters.code) {//check if the function was called by the google API

        // This will provide an object with the access_token and refresh_token.
        // Save these somewhere safe so they can be used at a later time.
        oauth2Client.getToken(event.queryStringParameters.code, (err, tokens) => {
            if (err) {
                console.log(err);
            } else {
                console.log(tokens);
                oauth2Client.setCredentials(tokens);

                storeToken(tokens, callback);
            }
        });
    } else if (event.body) {

        //split information received by website
        const postData = event.body.split("*");
        var parameters;

        //create variables to store the parameters received from the website
        const mail = postData[1];
        const pwHash = postData[3];
        const ranVal = postData[5];
        const secret = postData[7];

        if (postData.length === 9) { //read values entered by the user to create a new account in the database and start connection with google

            //check, if website sent the correct secret
            if(secret !== access.app_secret) {
                console.log("wrong secret");
                return;
            }

            //parameters for the database access
            parameters = {
                TableName: "UserData",
                Key: {
                    "Mail": {
                        S: mail
                    }
                }
            };

            ddb.getItem(parameters, function (err, data) { //check, if mail is already registered
                if (!err && data.Item) {
                    let res = {
                        "statusCode": 401,
                        "headers": {
                            "Content-Type": "text/plain",
                        },
                        "body": "mail already registered"
                    };
                    callback(null, res); //return error
                    console.log("already registered");
                } else {
                    //parameters for the database access
                    parameters = {
                        TableName: "UserData",
                        Key: {
                            "Mail": {
                                S: ranVal
                            }
                        }
                    };

                    //read token from the database, using the random value
                    ddb.getItem(parameters, function (err, data) {
                        if (err || !data.Item) {
                            let res = {
                                "statusCode": 401,
                                "headers": {
                                    "Content-Type": "text/plain",
                                },
                                "body": "error reading tokens for random value"
                            };
                            callback(null, res); //return error
                            console.log("error reading tokens for random value");
                        } else {

                            //parameters for the database access
                            parameters = {
                                TableName: "UserData",
                                Item: {
                                    "Mail": {
                                        S: mail
                                    },
                                    "PWHash": {
                                        S: pwHash
                                    },
                                    "Google_token": {
                                        S: data.Item.Google_token.S
                                    },
                                    "GoogleTimestamp": {
                                        S: Date.now().toString()
                                    }
                                }
                            };
                            //store mail with password and token
                            ddb.putItem(parameters, function (err) {
                                if (err) {
                                    console.log("Error at storing mail and pw", err);
                                } else {
                                    deleteRandomEntry(ranVal, callback);
                                }
                            });
                        }
                    });
                }
            });
        } else if (postData.length === 10) { //read current password hash from database to reconnect existing account with google

            //check, if website sent the correct secret
            if(secret !== access.app_secret) {
                console.log("wrong secret");
                return;
            }

            //parameters for the database access
            var params = {
                TableName: "UserData",
                Key: {
                    "Mail": {
                        S: mail
                    }
                }
            };

            //read password hash from database
            ddb.getItem(params, function (err, data) {
                if (err || !data.Item ||(data.Item.PWHash.S !== pwHash)) { //compare passwords
                    let res = {
                        "statusCode": 401,
                        "headers": {
                            "Content-Type": "text/plain",
                        },
                        "body": "error with login"
                    };
                    callback(null, res); //return error
                    console.log("Error (with login)", err);
                } else {

                    //parameters for the database access
                    parameters = {
                        TableName: "UserData",
                        Key: {
                            "Mail": {
                                S: ranVal
                            }
                        }
                    };

                    //read token from the database, using the random value
                    ddb.getItem(parameters, function (err, data) {
                        if (err || !data.Item) {
                            let res = {
                                "statusCode": 401,
                                "headers": {
                                    "Content-Type": "text/plain",
                                },
                                "body": "error reading tokens for random value"
                            };
                            callback(null, res); //return error
                            console.log("error reading tokens for random value");
                        } else {

                            //parameters for the database access
                            params = {
                                TableName: "UserData",
                                Key: {
                                    "Mail": {
                                        S: mail
                                    }
                                },
                                ExpressionAttributeNames: {
                                    "#GT": "Google_token",
                                    "#GTS": "GoogleTimestamp",
                                },
                                ExpressionAttributeValues: {
                                    ":gt": {
                                        S: data.Item.Google_token.S
                                    },
                                    ":gts": {
                                        S: Date.now().toString()
                                    },
                                },
                                UpdateExpression: "SET #GT = :gt, #GTS = :gts"
                            };

                            //add the google token to the existing database entry of the user
                            ddb.updateItem(params, function (err) {
                                if (!err) {
                                    deleteRandomEntry(ranVal, callback);
                                } else {
                                    console.log(err, err.stack); // an error occurred
                                }
                            });
                        }
                    });
                }
            });
        } else {
            // generate a url that asks permissions for Blogger and Google Calendar scopes
            const scopes = [
                "https://www.googleapis.com/auth/fitness.activity.read",
                "https://www.googleapis.com/auth/fitness.location.read",
                "https://www.googleapis.com/auth/fitness.body.read"
            ];

            //get url to redirect the user to
            const url = oauth2Client.generateAuthUrl({
                // "online" (default) or "offline" (gets refresh_token)
                access_type: "online",

                // define scope the user has to agree to
                scope: scopes
            });

            //set response body with automatic redirection to applications callback website
            res.body = url;

            //callback to the user
            callback(null, res);
        }
    }
};

//store the google token in the database using a randomly generated value
function storeToken(tokens, callback) {

    //initialize database
    const AWS = require("aws-sdk");
    AWS.config.update({region: "eu-central-1"});
    const ddb = new AWS.DynamoDB({apiVersion: "2012-08-10"});

    //generate the random value
    var randomVal = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;

    for (let i = 0; i < 8; i++) {
        randomVal += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    var parameters;

    //parameters for the database access
    parameters = {
        TableName: "UserData",
        Key: {
            "Mail": {
                S: randomVal
            }
        }
    };

    //check if there already is an entry for the random value in the database and if so, start storeToken again
    ddb.getItem(parameters, function (err, data) {
        if (!err) {
            if (!data.Item) {

                //parameters for the database access
                parameters = {
                    Item: {
                        "Mail": {
                            S: randomVal
                        },
                        "Google_token": {
                            S: JSON.stringify(tokens)
                        }
                    },
                    TableName: "UserData"
                };

                //store token in the database
                ddb.putItem(parameters, function (err) {
                    if (!err) {
                        //create response object
                        const res = {
                            "statusCode": 200,
                            "headers": {
                                "Content-Type": "text/html",
                            },
                            "body": "<meta http-equiv=\"refresh\" content=\"0; URL=http://192.168.178.5/google-callback.php?val=" + randomVal + "\">"
                        };
                        //callback to the user, redirecting him to the google callback website
                        callback(null, res);
                    } else {
                        console.log("error at storing entry: " + err, err.stack);
                    }
                });

            } else {
                //restart storeToken, as the random value was already used
                storeToken(tokens, callback);
            }
        } else {
            console.log("Error", err);
        }
    });
}

//delete the entry from the database, that stored the google token under a random value, as it is not needed anymore
function deleteRandomEntry(ranVal, callback) {

    //initialize database
    const AWS = require("aws-sdk");
    AWS.config.update({region: "eu-central-1"});
    const ddb = new AWS.DynamoDB({apiVersion: "2012-08-10"});

    //parameters for the database access
    var params = {
        TableName: "UserData",
        Key: {
            "Mail": {S: ranVal}
        }
    };

    //remove the random value entry from the table
    ddb.deleteItem(params, function (err) {
        if (!err) {
            const res = {
                "statusCode": 200,
                "headers": {
                    "Content-Type": "text/html",
                },
                "body": "success"
            };
            //callback to the website
            callback(null, res);
        } else {
            console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
        }
    });
}