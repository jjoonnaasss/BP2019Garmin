module.exports.odvConverter = function(dataJSON, type) {

    //const fs = require("fs");
    //var table = require('text-table');

    var AWS = require("aws-sdk");
    AWS.config.update({region: "us-east-2"});
    //var ddb = new AWS.DynamoDB({apiVersion: "2012-08-10"}); // Initialize data bank object

    // heart frequency, stress, steps(?), weight, activities, sleep

    // This is the array, which will be returned in the end. It contains all the Table items of the given summary.
    var params = [];
    /* If you need a String instead of an JSON object, just use JSON.stringify() before the initialized JSON object
    *  type: The type of the summary, which is given as a parameter
    *  It's mostly the same procedure. Create a new Item for the Table FitnessData, which contains the summaryId, timestamp,
    *  type of the summary and vaultEntry data. Each vaultEntry is saved separately in a new Item.
    *  You can include a vaultEntry anytime by creating a new Item and saving it into the array params afterwards.
    */
    switch(type) {
    // Daily Summaries Table
    case "dailySum":
        var daily1 = {
            TableName: "FitnessData",
            Item: {
                summaryId: dataJSON.summaryId,
                // TODO: Find out the correct timestamp data.
                timestamp: Date.now(),
                type: type,
                vaultEntry: { VaultEntryType: "HEART_RATE", Value: dataJSON.averageHeartRateInBeatsPerMinute, ValueExtension: null }
            }
        };
        var daily2 = {
            TableName: "FitnessData",
            Item: {
                summaryId: dataJSON.summaryId,
                timestamp: Date.now(),
                type: type,
                // TODO: STRESS Value is not the right type. Needs to be adjusted.
                vaultEntry: { VaultEntryType: "STRESS", Value: dataJSON.averageStressLevel, ValueExtension: null }
            }
        };
        params.push(daily1);
        params.push(daily2);
        return params;

    // Third Party Daily Summaries Table
    case "thirdParty":
        var third = {
            TableName: "FitnessData",
            Item: {
                summaryId: dataJSON.summaryId,
                timestamp: Date.now(),
                activityType: dataJSON.activityType,
                type: type,
                vaultEntry: { VaultEntryType: "EXERCISE_MID", Value: dataJSON.durationInSeconds, ValueExtension: null }
            }
        };
        console.log("==========THIRD PARTY==========");
        console.log(third);

        return third;

    // Manually Updated Activity Summaries
    case "manually":
        var manu = {
            TableName: "FitnessData",
            Item:  {
                summaryId: dataJSON.summaryId,
                timestamp: Date.now(),
                activityType: dataJSON.activityType,
                type: type,
                vaultEntry: { VaultEntryType: "EXERCISE_MID", Value: dataJSON.durationInSeconds, ValueExtension: null }
            }
        };
        //console.log("==========MANUALLY==========");
        return manu;

    // Activity Details Summaries
    case "actDetails":
        var actD1 = {
            TableName: "FitnessData",
            Item: {
                summaryId: dataJSON.summaryId,
                timestamp: Date.now(),
                activityType: dataJSON.summary.activityType,
                type: type,
                vaultEntry: { VaultEntryType: "EXERCISE_MID", Value: dataJSON.summary.durationInSeconds, ValueExtension: null }
            }
        };
        params.push(actD1);
        var actD2 = {
            TableName: "FitnessData",
            Item: {
                summaryId: dataJSON.summaryId,
                timestamp: Date.now(),
                activityType: dataJSON.summary.activityType,
                type: type,
                vaultEntry: { VaultEntryType: "HEART_RATE", Value: dataJSON.summary.averageHeartRateInBeatsPerMinute, ValueExtension: null }
            }
        };
        params.push(actD2);

        // The given sample data of the Activity Details Summaries.
        // Check if there are any sample data.
        if("samples" in dataJSON) {
            // Iterate through the sample data, which is saved inside an array.
            for(var j = 0; j < dataJSON.samples.length; j++) {
                var actD3 = {
                    TableName: "FitnessData",
                    Item: {
                        summaryId: dataJSON.summaryId,
                        timestamp: Date.now(),
                        activityType: dataJSON.summary.activityType,
                        type: type,
                        vaultEntry: { VaultEntryType: "HEART_RATE", Value: dataJSON.samples[j].heartRate, ValueExtension: null }
                    }
                };
                params.push(actD3);
            }
        }
        return params;

    // Epoch Summaries
    case "epochSum":
        var epoch = {
            TableName: "FitnessData",
            Item: {
                summaryId: dataJSON.summaryId,
                timestamp: Date.now(),
                activityType: dataJSON.activityType,
                type: type,
                vaultEntry: { VaultEntryType: "EXERCISE_MID", Value: dataJSON.durationInSeconds, ValueExtension: null }
            }
        };
        return epoch;

    // Sleep Summaries
    case "sleepSum":
        var sleep1 = {
            TableName: "FitnessData",
            Item: {
                summaryId: dataJSON.summaryId,
                timestamp: Date.now(),
                type: type,
                vaultEntry: { VaultEntryType: "SLEEP_LIGHT", Value: dataJSON.lightSleepDurationInSeconds, ValueExtensions: null }
            }
        };
        var sleep2 = {
            TableName: "FitnessData",
            Item: {
                summaryId: dataJSON.summaryId,
                timestamp: Date.now(),
                type: type,
                vaultEntry: { VaultEntryType: "SLEEP_REM", Value: dataJSON.remSleepInSeconds, ValueExtensions: null }
            }
        };
        var sleep3 = {
            TableName: "FitnessData",
            Item: {
                summaryId: dataJSON.summaryId,
                timestamp: Date.now(),
                type: type,
                vaultEntry: { VaultEntryType: "SLEEP_DEEP", Value: dataJSON.deepSleepDurationInSeconds, ValueExtensions: null }
            }
        };
        params.push(sleep1);
        params.push(sleep2);
        params.push(sleep3);
        return params;

    // Body Composition Summaries
    case "bodyComSum":
        var bodyC = {
            TableName: "FitnessData",
            Item: {
                summaryId: dataJSON.summaryId,
                timestamp: Date.now(),
                type: type,
                vaultEntry: { VaultEntryType: "WEIGHT", Value: (dataJSON.weightInGrams/1000), ValueExtension: null }
            }
        };
        return bodyC;

        // TODO: Maybe add Stress Details Summaries. Depends how we want to save the STRESS Values.

        // TODO: User Metrics Summaries: Are there any important information for the .odv-format?

        // TODO: Move IQ Summaries: Move IQ events are not considered a fitness activity

        // TODO: Pulse Ox Summaries

        // TODO: Respiration Summaries: Tracks breathing rate throughout the day.

    default:
        break;
    }
};