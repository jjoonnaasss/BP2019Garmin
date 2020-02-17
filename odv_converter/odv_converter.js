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

module.exports.odvConverter = function(dataJSON, type) {

    // This is the array, which will be returned in the end. It contains all the Table items of the given summary.
    var params = [];
    var timeOffset;

    // This function returns the correct UTC timeline
    function timeOff(time) {
        let hours = Math.round(time / 3600);
        if(time >= 0) {
            if(hours.toString().length == 1) {
                return `+0${hours}:00`;
            }
            else {
                return `+${hours}:00`;
            }
        }
        else {
            if((-hours).toString().length == 1) {
                return `-0${-hours}:00`;
            }
            else {
                return `-${-hours}:00`;
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

    // get ISO time as string, based on start time in seconds and offset
    function isoTime(seconds, off) {
        return new Date(seconds * 1000).toISOString().split(".")[0].concat(off);
    }

    let epoch = (dataJSON.startTimeInSeconds + dataJSON.startTimeOffsetInSeconds) * 1000;

    let device = "unknown";

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
        // TODO: Which category shall we advice this exercise to? default "EXERCISE_LOW"
        /*if(!("moderateIntensityDurationInSeconds" in dataJSON) &&
           !("vigorousIntensityDurationInSeconds" in dataJSON)) {
            var daily = createTable(
                "unknown",
                "EXERCISE_LOW",
                epoch,
                isoTime(dataJSON.startTimeInSeconds, timeOffset),
                dataJSON.durationInSeconds.toString());
            params.push(daily);
        }
        if("moderateIntensityDurationInSeconds" in dataJSON &&
           dataJSON.moderateIntensityDurationInSeconds > 0) {
            var daily1 = createTable(
                "unknown",
                "EXERCISE_MID",
                epoch,
                isoTime(dataJSON.startTimeInSeconds, timeOffset),
                dataJSON.moderateIntensityDurationInSeconds.toString());
            params.push(daily1);
        }
        if("vigorousIntensityDurationInSeconds" in dataJSON &&
           dataJSON.vigorousIntensityDurationInSeconds > 0) {
            var daily2 = createTable(
                "unknown",
                "EXERCISE_HIGH",
                epoch,
                isoTime(dataJSON.startTimeInSeconds, timeOffset),
                dataJSON.vigorousIntensityDurationInSeconds.toString());
            params.push(daily2);
        }
        if("averageHeartRateInBeatsPerMinute" in dataJSON) {
            var daily3 = createTable(
                "unknown",
                "HEART_RATE",
                epoch,
                isoTime(dataJSON.startTimeInSeconds, timeOffset),
                dataJSON.averageHeartRateInBeatsPerMinute.toString());
            params.push(daily3);
        }*/
        var daily5;
        if("timeOffsetHeartRateSamples" in dataJSON) {
            for (var key2 in dataJSON.timeOffsetHeartRateSamples) {
                // Add the given additional seconds to the startTime.
                var date = new Date(dataJSON.startTimeInSeconds * 1000);
                date.setSeconds(date.getSeconds() + key2);
                daily5 = createTable(
                    "unknown",
                    "HEART_RATE",
                    ((epoch / 1000) + parseInt(key2, 10)) * 1000,
                    date.toISOString().split(".")[0].concat(timeOffset),
                    dataJSON.timeOffsetHeartRateSamples[key2].toString());
                params.push(daily5);
            }
        }
        return params;

    // Third Party Daily Summaries Table
    case "thirdParty":
        if("source" in dataJSON) {
            device = dataJSON.source;
        }
        /*timeOffset = timeOff(dataJSON.startTimeOffsetInSeconds);
        if(!("moderateIntensityDurationInSeconds" in dataJSON) && 
           !("vigorousIntensityDurationInSeconds" in dataJSON)) {
            var third = createTable(
                device,
                "EXERCISE_LOW",
                epoch,
                isoTime(dataJSON.startTimeInSeconds, timeOffset),
                dataJSON.durationInSeconds.toString());
            params.push(third);
        }
        if("moderateIntensityDurationInSeconds" in dataJSON &&
           dataJSON.moderateIntensityDurationInSeconds > 0) {
            var third1 = createTable(
                device,
                "EXERCISE_MID",
                epoch,
                isoTime(dataJSON.startTimeInSeconds, timeOffset),
                dataJSON.moderateIntensityDurationInSeconds.toString());
            params.push(third1);
        }
        if("vigorousIntensityDurationInSeconds" in dataJSON &&
           dataJSON.vigorousIntensityDurationInSeconds > 0) {
            var third2 = createTable(
                device,
                "EXERCISE_HIGH",
                epoch,
                isoTime(dataJSON.startTimeInSeconds, timeOffset),
                dataJSON.vigorousIntensityDurationInSeconds.toString());
            params.push(third2);
        }
        if("averageHeartRateInBeatsPerMinute" in dataJSON) {
            var third3 = createTable(
                device,
                "HEART_RATE",
                epoch,
                isoTime(dataJSON.startTimeInSeconds, timeOffset),
                dataJSON.averageHeartRateInBeatsPerMinute.toString());
            params.push(third3);
        }*/
        var third4;
        if("timeOffsetHeartRateSamples" in dataJSON) {
            for (var key in dataJSON.timeOffsetHeartRateSamples) {
                // Add the given additional seconds to the startTime.
                var date2 = new Date(dataJSON.startTimeInSeconds * 1000);
                date2.setSeconds(date2.getSeconds() + key);
                third4 = createTable(
                    device,
                    "HEART_RATE",
                    ((epoch / 1000) + parseInt(key, 10)) * 1000,
                    date2.toISOString().split(".")[0].concat(timeOffset),
                    dataJSON.timeOffsetHeartRateSamples[key].toString());
                params.push(third4);
            }
        }
        return params;

    /* Activity Summaries
    *  All wellness data, like steps and distance contained in the Activity are already represented in the Daily summary and
    *  in the corresponding Epoch sumarries, so Activity summaries should only be used for programs that wish to treat specific
    *  activity types in different ways, such as giving the iser extra cresit for going swimming three times in the same week.
    *  TODO: Do we really need activities?
    */
    case "activities":
        if("deviceName" in dataJSON) {
            device = dataJSON.deviceName;
        }
        timeOffset = timeOff(dataJSON.startTimeOffsetInSeconds);
        var actSum = createTable(
            device,
            "EXERCISE_MID",
            epoch,
            isoTime(dataJSON.startTimeInSeconds, timeOffset),
            dataJSON.durationInSeconds.toString());
        params.push(actSum);
        return params;

    // Manually Updated Activity Summaries
    // This is practically the same as activities except that it is manually created.
    // TODO: Do we really need this data?
    case "manually":
        if("deviceName" in dataJSON) {
            device = dataJSON.deviceName;
        }
        timeOffset = timeOff(dataJSON.startTimeOffsetInSeconds);
        var manu = createTable(
            device,
            "EXERCISE_MID",
            epoch,
            isoTime(dataJSON.startTimeInSeconds, timeOffset),
            dataJSON.durationInSeconds.toString());
        params.push(manu);
        return params;

    // Activity Details Summaries
    case "actDetails":
        if("deviceName" in dataJSON.summary) {
            device = dataJSON.summary.deviceName;
        }
        timeOffset = timeOff(dataJSON.summary.startTimeOffsetInSeconds);
        /*if("durationInSeconds" in dataJSON.summary) {
            var actD1 = createTable(
                device,
                "EXERCISE_MID",
                dataJSON.summary.startTimeInSeconds + dataJSON.summary.startTimeOffsetInSeconds,
                isoTime(dataJSON.summary.startTimeInSeconds, timeOffset),
                dataJSON.summary.durationInSeconds.toString());
            params.push(actD1);
        }
        if("averageHeartRateInBeatsPerMinute" in dataJSON.summary) {
            var actD2 = createTable(
                device,
                "HEART_RATE",
                (dataJSON.summary.startTimeInSeconds + dataJSON.summary.startTimeOffsetInSeconds) * 1000,
                isoTime(dataJSON.summary.startTimeInSeconds, timeOffset),
                dataJSON.summary.averageHeartRateInBeatsPerMinute.toString());
            params.push(actD2);
        }*/

        // The given sample data of the Activity Details Summaries.
        // Check if there are any sample data.
        if("samples" in dataJSON) {
            // Iterate through the sample data, which is saved inside an array.
            for(var j = 0; j < dataJSON.samples.length; j++) {
                if("heartRate" in dataJSON.samples[j]) {
                    var actD3 = createTable(device,
                        "HEART_RATE",
                        (dataJSON.samples[j].startTimeInSeconds + dataJSON.summary.startTimeOffsetInSeconds) * 1000,
                        isoTime(dataJSON.samples[j].startTimeInSeconds, timeOffset),
                        dataJSON.samples[j].heartRate.toString());
                    params.push(actD3);
                }
            }
        }
        return params;

    // Epoch Summaries
    case "epochs":
        timeOffset = timeOff(dataJSON.startTimeOffsetInSeconds);
        if("intensity" in dataJSON) {
            // If the duration is under 900 the epoch will be replaced by a new one with a duration of 900, so
            // filter this one out.
            if(dataJSON.durationInSeconds == 900) {
                var epochTable;
                // met == 1.0 -> sitting -> no exercise(everything which takes more energy than sitting is an exercise)
                if(dataJSON.intensity == "SEDENTARY" && dataJSON.met > 1.0) {
                    epochTable = createTable(
                        "unknown",
                        "EXERCISE_LOW",
                        epoch,
                        isoTime(dataJSON.startTimeInSeconds, timeOffset),
                        dataJSON.activeTimeInSeconds.toString());
                }
                else if(dataJSON.intensity == "ACTIVE") {
                    epochTable = createTable(
                        "unknown",
                        "EXERCISE_MID",
                        epoch,
                        isoTime(dataJSON.startTimeInSeconds, timeOffset),
                        dataJSON.activeTimeInSeconds.toString());
                }
                else if(dataJSON.intensity == "HIGHLY_ACTIVE") {
                    epochTable = createTable(
                        "unknown",
                        "EXERCISE_HIGH",
                        epoch,
                        isoTime(dataJSON.startTimeInSeconds, timeOffset),
                        dataJSON.activeTimeInSeconds.toString());
                }
                params.push(epochTable);
            }
        }
        return params;

    // Sleep Summaries
    case "sleeps":
        timeOffset = timeOff(dataJSON.startTimeOffsetInSeconds);
        if("light" in dataJSON.sleepLevelsMap) {
            var sleepLight;
            for(var li = 0; li < dataJSON.sleepLevelsMap.light.length; li++) {
                sleepLight = createTable(
                    "unknown",
                    "SLEEP_LIGHT",
                    (dataJSON.sleepLevelsMap.light[li].startTimeInSeconds + dataJSON.startTimeOffsetInSeconds) * 1000,
                    isoTime(dataJSON.sleepLevelsMap.light[li].startTimeInSeconds, timeOffset),
                    (dataJSON.sleepLevelsMap.light[li].endTimeInSeconds - dataJSON.sleepLevelsMap.light[li].startTimeInSeconds).toString());
                params.push(sleepLight);
            }
        }
        if("rem" in dataJSON.sleepLevelsMap) {
            var sleepRem;
            for(var re = 0; re < dataJSON.sleepLevelsMap.rem.length; re++) {
                sleepRem = createTable(
                    "unknown",
                    "SLEEP_REM",
                    (dataJSON.sleepLevelsMap.rem[re].startTimeInSeconds + dataJSON.startTimeOffsetInSeconds) * 1000,
                    isoTime(dataJSON.sleepLevelsMap.rem[re].startTimeInSeconds, timeOffset),
                    (dataJSON.sleepLevelsMap.rem[re].endTimeInSeconds - dataJSON.sleepLevelsMap.rem[re].startTimeInSeconds).toString());
                params.push(sleepRem);
            }
        }
        if("deep" in dataJSON.sleepLevelsMap) {
            var sleepDeep;
            for(var de = 0; de < dataJSON.sleepLevelsMap.deep.length; de++) {
                sleepDeep = createTable (
                    "unknown",
                    "SLEEP_DEEP",
                    (dataJSON.sleepLevelsMap.deep[de].startTimeInSeconds + dataJSON.startTimeOffsetInSeconds) * 1000,
                    isoTime(dataJSON.sleepLevelsMap.deep[de].startTimeInSeconds, timeOffset),
                    (dataJSON.sleepLevelsMap.deep[de].endTimeInSeconds - dataJSON.sleepLevelsMap.deep[de].startTimeInSeconds).toString());
                params.push(sleepDeep);
            }
        }
        return params;

    // Body Composition Summaries
    case "bodyComps":
        timeOffset = timeOff(dataJSON.measurementTimeOffsetInSeconds);
        if("weightInGrams" in dataJSON) {
            var bodyC = createTable(
                "unknown",
                "WEIGHT",
                (dataJSON.measurementTimeInSeconds + dataJSON.measurementTimeOffsetInSeconds) * 1000,
                isoTime(dataJSON.measurementTimeInSeconds, timeOffset),
                (dataJSON.weightInGrams/1000).toString());
            params.push(bodyC);
        }
        return params;

    // Stress Details Summaries
    case "stress":
        timeOffset = timeOff(dataJSON.startTimeOffsetInSeconds);
        if("timeOffsetStressLevelValues" in dataJSON) {
            var str_table;
            for(var keyStr in dataJSON.timeOffsetStressLevelValues) {
                var dateStr = new Date(dataJSON.startTimeInSeconds * 1000);
                dateStr.setSeconds(dateStr.getSeconds() + keyStr);
                str_table = createTable(
                    "unknown",
                    "STRESS",
                    ((epoch/1000) + parseInt(keyStr, 10)) * 1000,
                    dateStr.toISOString().split(".")[0].concat(timeOffset),
                    dataJSON.timeOffsetStressLevelValues[keyStr].toString());
                params.push(str_table);
            }
        }
        return params;

        /* "User Metric Summaries" ("type": "userMetrics"), "Menstrual Cycle Tracking(MCT) Summaries", "Pulse Ox Summaries" and "Respiration Summaries" ("type": "allDayRespiration")
        * don't contain any useful information for the bolus calculator.
        *
        * "Move IQ Summaries" ("type": "moveIQActivities") doesn't contain any additional useful information, since the given data is already included in
        * Daily and Epoch summaries.
        */

    default:
        return params;
    }
};
