module.exports.odvConverter = function(dataJSON, type) {

    // This is the array, which will be returned in the end. It contains all the Table items of the given summary.
    var params = [];
    /* In case you need a String instead of an JSON object, just use JSON.stringify() before the initialized JSON object
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
                // startTimeInSeconds: Start time of the activity in seconds since January 1, 1970, 00:00:00 UTC(Unix timestamp)
                // startTimeOffsetInSeconds: derive the "local" time of the device that captured the data by adding it to startTimeInSeconds
                timestamp: dataJSON.startTimeInSeconds + dataJSON.startTimeOffsetInSeconds,
                type : type,
                vaultEntry: { VaultEntryType: "EXERCISE_MID", Value: dataJSON.durationInSeconds, ValueExtension: null }
            }
        };
        var daily2 = {
            TableName: "FitnessData",
            Item: {
                summaryId: dataJSON.summaryId,
                timestamp: dataJSON.startTimeInSeconds + dataJSON.startTimeOffsetInSeconds,
                type: type,
                vaultEntry: { VaultEntryType: "HEART_RATE", Value: dataJSON.averageHeartRateInBeatsPerMinute, ValueExtension: null }
            }
        };
        var daily3 = {
            TableName: "FitnessData",
            Item: {
                summaryId: dataJSON.summaryId,
                timestamp: dataJSON.startTimeInSeconds + dataJSON.startTimeOffsetInSeconds,
                type: type,
                // TODO: STRESS Value is not the right type. Needs to be adjusted, but we don't know the unit for the amount yet.
                vaultEntry: { VaultEntryType: "STRESS", Value: dataJSON.averageStressLevel, ValueExtension: null }
            }
        };
        params.push(daily1);
        params.push(daily2);
        params.push(daily3);
        return params;

    // Third Party Daily Summaries Table
    case "thirdParty":
        var third = {
            TableName: "FitnessData",
            Item: {
                summaryId: dataJSON.summaryId,
                timestamp: dataJSON.startTimeInSeconds + dataJSON.startTimeOffsetInSeconds,
                activityType: dataJSON.activityType,
                type: type,
                vaultEntry: { VaultEntryType: "EXERCISE_MID", Value: dataJSON.durationInSeconds, ValueExtension: null }
            }
        };
        params.push(third);
        return params;

    // Activity Summaries
    case "activitySum":
        var actSum = {
            TabelName: "FitnessData",
            Item: {
                summaryId: dataJSON.summaryId,
                timestamp: dataJSON.startTimeInSeconds + dataJSON.startTimeOffsetInSeconds,
                activityType: dataJSON.activityType,
                tyoe: type,
                vaultEntry: { VaultEntryType: "EXERCISE_MID", Value: dataJSON.durationInSeconds, ValueExtension: null }
            }
        };
        params.push(actSum);
        return params;

    // Manually Updated Activity Summaries
    case "manually":
        var manu1 = {
            TableName: "FitnessData",
            Item:  {
                summaryId: dataJSON.summaryId,
                timestamp: dataJSON.startTimeInSeconds + dataJSON.startTimeOffsetInSeconds,
                activityType: dataJSON.activityType,
                type: type,
                vaultEntry: { VaultEntryType: "EXERCISE_MID", Value: dataJSON.durationInSeconds, ValueExtension: null }
            }
        };
        var manu2 = {
            TableName: "FitnessData",
            Item: {
                summaryId: dataJSON.summaryId,
                timestamp: dataJSON.startTimeInSeconds + dataJSON.startTimeOffsetInSeconds,
                activityType: dataJSON.activityType,
                type: type,
                vaultEntry: { VaultEntryTyoe: "HEART_RATE", Value: dataJSON.averageHeartRateInBeatsPerMinute, ValueExtension: null }
            }
        };
        params.push(manu1);
        params.push(manu2);
        return params;

    // Activity Details Summaries
    case "actDetails":
        var actD1 = {
            TableName: "FitnessData",
            Item: {
                summaryId: dataJSON.summaryId,
                timestamp: dataJSON.summary.startTimeInSeconds + dataJSON.summarystartTimeOffsetInSeconds,
                activityType: dataJSON.summary.activityType,
                type: type,
                vaultEntry: { VaultEntryType: "EXERCISE_MID", Value: dataJSON.summary.durationInSeconds, ValueExtension: null }
            }
        };
        var actD2 = {
            TableName: "FitnessData",
            Item: {
                summaryId: dataJSON.summaryId,
                timestamp: dataJSON.summary.startTimeInSeconds + dataJSON.summary.startTimeOffsetInSeconds,
                activityType: dataJSON.summary.activityType,
                type: type,
                vaultEntry: { VaultEntryType: "HEART_RATE", Value: dataJSON.summary.averageHeartRateInBeatsPerMinute, ValueExtension: null }
            }
        };
        params.push(actD1);
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
                        timestamp: dataJSON.summary.startTimeInSeconds + dataJSON.summary.startTimeOffsetInSeconds,
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
                timestamp: dataJSON.startTimeInSeconds + dataJSON.startTimeOffsetInSeconds,
                activityType: dataJSON.activityType,
                type: type,
                vaultEntry: { VaultEntryType: "EXERCISE_MID", Value: dataJSON.durationInSeconds, ValueExtension: null }
            }
        };
        params.push(epoch);
        return params;

    // Sleep Summaries
    case "sleepSum":
        var sleep1 = {
            TableName: "FitnessData",
            Item: {
                summaryId: dataJSON.summaryId,
                timestamp: dataJSON.startTimeInSeconds + dataJSON.startTimeOffsetInSeconds,
                type: type,
                vaultEntry: { VaultEntryType: "SLEEP_LIGHT", Value: dataJSON.lightSleepDurationInSeconds, ValueExtensions: null }
            }
        };
        var sleep2 = {
            TableName: "FitnessData",
            Item: {
                summaryId: dataJSON.summaryId,
                timestamp: dataJSON.startTimeInSeconds + dataJSON.startTimeOffsetInSeconds,
                type: type,
                vaultEntry: { VaultEntryType: "SLEEP_REM", Value: dataJSON.remSleepInSeconds, ValueExtensions: null }
            }
        };
        var sleep3 = {
            TableName: "FitnessData",
            Item: {
                summaryId: dataJSON.summaryId,
                timestamp: dataJSON.startTimeInSeconds + dataJSON.startTimeOffsetInSeconds,
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
                timestamp: dataJSON.measurementTimeInSeconds + dataJSON.measurementTimeOffsetInSeconds,
                type: type,
                vaultEntry: { VaultEntryType: "WEIGHT", Value: (dataJSON.weightInGrams/1000), ValueExtension: null }
            }
        };
        params.push(bodyC);
        return params;

        /* TODO: Probably need add Stress Details Summaries. The way we save this summary depends on the unit of the 
        *       amount of stress, which was not decided by the employer yet.
        *
        * "User Metric Summaries", "Menstrual Cycle Tracking(MCT) Summaries", "Pulse Ox Summaries" and "Respiration Summaries"
        * don't contain any useful information for the bolus calculator.
        *
        * "Move IQ Summaries" doesn't contain any additional useful information, since the given data is already included in
        * Daily and Epoch summaries.
        */

    default:
        return params;
    }
};