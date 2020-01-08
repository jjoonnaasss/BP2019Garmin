exports.handler = function (event, context, callback) {
    // Dependencies
    const fs = require("fs");

    //read consumer-key, -secret and application secret
    const access_rawdata = fs.readFileSync("/opt/access.json");
    const access = JSON.parse(access_rawdata);

    var AWS = require("aws-sdk");
    AWS.config.update({region: "eu-central-1"});
    var ddb = new AWS.DynamoDB({apiVersion: "2012-08-10"}); //initialize database

    //initial values to be replaced with the actual parameters
    var mail = "empty";
    var pwhash = "empty";

    if (event.body) {  //check, if data was received at all
        var postData = event.body.split("*");
        if (postData.length >= 5) { //check, if there are enough parameters given, read parameters, check secret-value
            mail = postData[1];
            pwhash = postData[3];
            if (postData[5] !== access.app_secret) { //check secret-value
                console.log("wrong secret");
                return;
            }
        }
    }
    console.log("received mail:  " + mail + " with password hash: " + pwhash);

    //parameters to read password hash and user access token from database
    var params = {
        TableName: "UserData",
        Key: {
            "Mail": {
                S: mail
            }
        }
    };

    //read password hash and user access token from database
    ddb.getItem(params, function (err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            console.log("Success", data);
            if(data.Item.PWHash.S.equals(pwhash)){
                const uat = data.Item.UAT.S;

                //parameters for searching the database for all fitness-data entries with the users uat
                var params = {
                    TableName: "FitnessData",
                    KeyConditionExpression: "UAT = :key",
                    ExpressionAttributeValues: {
                        ":key": {"S": uat}
                    }
                };

                //read all entries for the given uat
                ddb.query(params, function (err, data) {
                    if (err) {
                        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                    } else {
                        console.log("Query succeeded.");
                        const userData = data;
                        var fileData = "insert information like title here"; //TODO

                        if(userData) { //append all the entries to a string, in order to write that string in a file later
                            JSON.parse(userData).forEach(function (item) {
                                fileData += `{"type":${item.type.S},"value1":${item.value1.S}`;
                                if (item.value2) {
                                    fileData += `,"value2":${item.value2}},`;
                                } else {
                                    fileData += "},";
                                }
                            });

                            //cut off last ","
                            fileData = fileData.substring(0, fileData.length - 1);

                            fs.writeFileSync("garmin_data.json", fileData);
                        }
                    }
                });

            } else {
                //create response, telling the user that the given password is incorrect
                const res = {
                    "statusCode": 401,
                    "headers": {
                        "Content-Type": "text/plain",
                    },
                    "body": "error with login"
                };
                //send response
                callback(null, res);
            }
        }
    });
};