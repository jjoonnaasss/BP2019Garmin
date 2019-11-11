//sample code to check, if verifier is received
exports.handler = async (event) => {

    let ver = 'no verifier received';
    if (event.queryStringParameters && event.queryStringParameters.oauth_verifier) {
        ver = event.queryStringParameters.oauth_verifier;
    }

    let responseBody = {
        verifier: ver
    };

    const response = {
        statusCode: 200,
        body: JSON.stringify(responseBody),
    };
    return response;
};