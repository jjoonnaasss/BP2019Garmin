exports.handler = async (event) => {

    var jsonBody = JSON.parse(event.body);
    var uat = jsonBody.epochs[0].userAccessToken;
    var startTime = jsonBody.epochs[0].uploadStartTimeInSeconds;
    var endTime = jsonBody.epochs[0].uploadEndTimeInSeconds;
    var url = jsonBody.epochs[0].callbackURL;
    console.log("\n uat: " + uat + "\n startTime: " + startTime + "\n endTime: " + endTime + "\n url:" + url);

    const res = {
        "statusCode": 200
    };

    return res;
};