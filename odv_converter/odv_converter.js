module.exports.odvConverter = function(dataJSON, type) {

    // This is the array, which will be returned in the end. It contains all the Table items of the given summary.
    var params = [];
    var timeOffset;

    // This function return the correct UTC timeline
    function timeOff(time) {
        if(time >= 0) {
            if(((time/60)/60).toString().length == 1) {
                return "+0".concat(((time/60)/60).toString()).concat(":00");
            }
            else {
                return ((time/60)/60).toString().concat(":00");
            }
        }
        else {
            if((((time*(-1))/60)/60).toString().length == 1) {
                return "-0".concat((((time*(-1))/60)/60).toString()).concat(":00");
            }
            else {
                return (((time*(-1))/60)/60).toString().concat(":00");
            }
        }
    }

    /* This function creates the table with the important fitness data.
    *  origin: The used fitness davice
    *  source: The data source.
    *  type: VaultEntryType
    *  epoch: Start time of the activity or the time this data was taken in Unix timestamp.
    *  isoTime: The epoch timestamp as iso-format.
    *  value: The given value of the VaultEntryType.
    */
    function createTable(ori, typ, epo, iso, val) {
        var table = {
            TableName: "FitnessDat",
            Item: {
                origin: ori,
                source: "Garmin-Connect",
                type: typ,
                epoch: epo,
                isoTime: iso,
                value: val
            }
        };
        return table;
    }

    /* In case you need a String instead of an JSON object, just use JSON.stringify() before the initialized JSON object
    *  type: The type of the summary, which is given as a parameter
    *  It's mostly the same procedure. Create a new Item for the Table FitnessData, which contains the summaryId, epoch,
    *  type of the summary and vaultEntry data. Each vaultEntry is saved separately in a new Item.
    *  You can include a vaultEntry anytime by creating a new Item and saving it into the array params afterwards.
    */
    switch(type) {
    // Daily Summaries Table
    case "dailies":
        timeOffset = timeOff(dataJSON.startTimeOffsetInSeconds);
        var daily1 = createTable(null, "EXERCISE_MID", dataJSON.startTimeInSeconds + dataJSON.startTimeOffsetInSeconds, new Date(dataJSON.startTimeInSeconds * 1000).toISOString().split(".")[0].concat(timeOffset), dataJSON.durationInSeconds);
        var daily2 = createTable(null, "HEART_RATE", dataJSON.startTimeInSeconds + dataJSON.startTimeOffsetInSeconds, new Date(dataJSON.startTimeInSeconds * 1000).toISOString().split(".")[0].concat(timeOffset), dataJSON.averageHeartRateInBeatsPerMinute);
        var daily3 = createTable(null, "STRESS", dataJSON.startTimeInSeconds + dataJSON.startTimeOffsetInSeconds, new Date(dataJSON.startTimeInSeconds * 1000).toISOString().split(".")[0].concat(timeOffset), dataJSON.averageHeartRateInBeatsPerMinute);
        params.push(daily1);
        params.push(daily2);
        params.push(daily3);
        return params;

    // Third Party Daily Summaries Table
    case "thirdParty":
        timeOffset = timeOff(dataJSON.startTimeOffsetInSeconds);
        var third = createTable(dataJSON.source, "EXERCISE_MID", dataJSON.startTimeInSeconds + dataJSON.startTimeOffsetInSeconds, new Date(dataJSON.startTimeInSeconds * 1000).toISOString().split(".")[0].concat(timeOffset), dataJSON.durationInSeconds);
        params.push(third);
        return params;

    // Activity Summaries
    case "activities":
        timeOffset = timeOff(dataJSON.startTimeOffsetInSeconds);
        var actSum = createTable(dataJSON.deviceName, "EXERCISE_MID", dataJSON.startTimeInSeconds + dataJSON.startTimeOffsetInSeconds, new Date(dataJSON.startTimeInSeconds * 1000).toISOString().split(".")[0].concat(timeOffset), dataJSON.durationInSeconds);
        params.push(actSum);
        return params;

    // Manually Updated Activity Summaries
    case "manually":
        timeOffset = timeOff(dataJSON.startTimeOffsetInSeconds);
        var manu = createTable(dataJSON.deviceName, "EXERCISE_MID", dataJSON.startTimeInSeconds + dataJSON.startTimeOffsetInSeconds, new Date(dataJSON.startTimeInSeconds * 1000).toISOString().split(".")[0].concat(timeOffset), dataJSON.durationInSeconds);
        params.push(manu);
        return params;

    // Activity Details Summaries
    case "actDetails":
        timeOffset = timeOff(dataJSON.summary.startTimeOffsetInSeconds);
        var actD1 = createTable(dataJSON.summary.deviceName, "EXERCISE_MID", dataJSON.summary.startTimeInSeconds + dataJSON.summarystartTimeOffsetInSeconds, new Date(dataJSON.summary.startTimeInSeconds * 1000).toISOString().split(".")[0].concat(timeOffset), dataJSON.summary.durationInSeconds);
        var actD2 = createTable(dataJSON.summary.deviceName, "HEART_RATE", dataJSON.summary.startTimeInSeconds + dataJSON.summarystartTimeOffsetInSeconds, new Date(dataJSON.summary.startTimeInSeconds * 1000).toISOString().split(".")[0].concat(timeOffset), dataJSON.summary.averageHeartRateInBeatsPerMinute);
        params.push(actD1);
        params.push(actD2);

        // The given sample data of the Activity Details Summaries.
        // Check if there are any sample data.
        if("samples" in dataJSON) {
            // Iterate through the sample data, which is saved inside an array.
            for(var j = 0; j < dataJSON.samples.length; j++) {
                var actD3 = createTable(dataJSON.summary.deviceName, "HEART_RATE", dataJSON.samples[j].startTimeInSeconds + dataJSON.summary.startTimeOffsetInSeconds, new Date(dataJSON.samples[j].startTimeInSeconds * 1000).toISOString().split(".")[0].concat(timeOffset), dataJSON.samples[j].heartRate);
                params.push(actD3);
            }
        }
        return params;

    // Epoch Summaries
    case "epochs":
        timeOffset = timeOff(dataJSON.startTimeOffsetInSeconds);
        var epoch = createTable(null, "EXERCISE_MID", dataJSON.startTimeInSeconds + dataJSON.startTimeOffsetInSeconds, new Date(dataJSON.startTimeInSeconds * 1000).toISOString().split(".")[0].concat(timeOffset), dataJSON.durationInSeconds);
        params.push(epoch);
        return params;

    // Sleep Summaries
    case "sleeps":
        timeOffset = timeOff(dataJSON.startTimeOffsetInSeconds);
        var sleep1 = createTable(null, "SLEEP_LIGHT", dataJSON.startTimeInSeconds + dataJSON.startTimeOffsetInSeconds, new Date(dataJSON.startTimeInSeconds * 1000).toISOString().split(".")[0].concat(timeOffset), dataJSON.lightSleepDurationInSeconds);
        var sleep2 = null;
        if("remSleepInSeconds" in dataJSON) {
            sleep2 = createTable(null, "SLEEP_REM", dataJSON.startTimeInSeconds + dataJSON.startTimeOffsetInSeconds, new Date(dataJSON.startTimeInSeconds * 1000).toISOString().split(".")[0].concat(timeOffset), dataJSON.remSleepInSeconds);
        }
        var sleep3 = createTable(null, "SLEEP_DEEP", dataJSON.startTimeInSeconds + dataJSON.startTimeOffsetInSeconds, new Date(dataJSON.startTimeInSeconds * 1000).toISOString().split(".")[0].concat(timeOffset), dataJSON.deepSleepDurationInSeconds);
        params.push(sleep1);
        if(sleep2 != null) {
            params.push(sleep2);
        }
        params.push(sleep3);
        return params;

    // Body Composition Summaries
    case "bodyComps":
        timeOffset = timeOff(dataJSON.measurementTimeOffsetInSeconds);
        var bodyC = createTable(null, "WEIGHT", dataJSON.measurementTimeInSeconds + dataJSON.measurementTimeOffsetInSeconds, new Date(dataJSON.measurementTimeInSeconds * 1000).toISOString().split(".")[0].concat(timeOffset), (dataJSON.weightInGrams/1000));
        params.push(bodyC);
        return params;

        /* TODO: Probably need add Stress Details ("type" : "stressDetails") Summaries. The way we save this summary depends on the unit of the
        *       amount of stress, which was not decided by the employer yet.
        *
        * "User Metric Summaries" ("type": "userMetrics"), "Menstrual Cycle Tracking(MCT) Summaries", "Pulse Ox Summaries" and "Respiration Summaries" ("type": "allDayRespiration")
        * don't contain any useful information for the bolus calculator.
        *
        * "Move IQ Summaries" ("type": "moveIQActivities") doesn't contain any additional useful information, since the given data is already included in
        * Daily and Epoch summaries.
        */

    default:
        return params;
    }
};
