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

    switch(type) {
    // Daily Summaries Table
    case "dailies":
        timeOffset = timeOff(dataJSON.startTimeOffsetInSeconds);
        var daily;
        if("timeOffsetHeartRateSamples" in dataJSON) {
            for (var key2 in dataJSON.timeOffsetHeartRateSamples) {
                // Add the given additional seconds to the startTime.
                var dateDaily = new Date(dataJSON.startTimeInSeconds * 1000);
                dateDaily.setSeconds(dateDaily.getSeconds() + key2);
                daily = createTable(
                    "unknown",
                    "HEART_RATE",
                    ((epoch / 1000) + parseInt(key2, 10)) * 1000,
                    dateDaily.toISOString().split(".")[0].concat(timeOffset),
                    dataJSON.timeOffsetHeartRateSamples[key2].toString());
                params.push(daily);
            }
        }
        return params;

    // Third Party Daily Summaries Table
    case "thirdParty":
        timeOffset = timeOff(dataJSON.startTimeOffsetInSeconds);
        if("source" in dataJSON) {
            device = dataJSON.source;
        }
        var third;
        if("timeOffsetHeartRateSamples" in dataJSON) {
            for (var key in dataJSON.timeOffsetHeartRateSamples) {
                // Add the given additional seconds to the startTime.
                var dateThird = new Date(dataJSON.startTimeInSeconds * 1000);
                dateThird.setSeconds(dateThird.getSeconds() + key);
                third = createTable(
                    device,
                    "HEART_RATE",
                    ((epoch / 1000) + parseInt(key, 10)) * 1000,
                    dateThird.toISOString().split(".")[0].concat(timeOffset),
                    dataJSON.timeOffsetHeartRateSamples[key].toString());
                params.push(third);
            }
        }
        return params;

    // Activity Summaries
    case "activities":
        timeOffset = timeOff(dataJSON.startTimeOffsetInSeconds);
        var kcalPerMinute = 0.0;
        var actSum;
        if("deviceName" in dataJSON) {
            device = dataJSON.deviceName;
        }
        if("manual" in dataJSON) {
            if(dataJSON.manual) {
                actSum = createTable(
                    device,
                    "EXERCISE_MANUAL",
                    epoch,
                    isoTime(dataJSON.startTimeInSeconds, timeOffset),
                    dataJSON.durationInSeconds.toString());
            }
            else {
                /*  kcal/minute < 3.5               light exercise
                *   3.5 <= kcal/minute <= 7.0       moderate exercise
                *   7.0 < kcal/minute               vigorous exercise
                */
                kcalPerMinute = dataJSON.activeKilocalories / (dataJSON.durationInSeconds / 60);
                if(kcalPerMinute < 3.5) {
                    actSum = createTable(
                        device,
                        "EXERCISE_LOW",
                        epoch,
                        isoTime(dataJSON.startTimeInSeconds, timeOffset),
                        dataJSON.durationInSeconds.toString());
                }
                else if(kcalPerMinute >= 3.5 && kcalPerMinute <= 7.0) {
                    actSum = createTable(
                        device,
                        "EXERCISE_MID",
                        epoch,
                        isoTime(dataJSON.startTimeInSeconds, timeOffset),
                        dataJSON.durationInSeconds.toString());
                }
                else {
                    actSum = createTable(
                        device,
                        "EXERCISE_HIGH",
                        epoch,
                        isoTime(dataJSON.startTimeInSeconds, timeOffset),
                        dataJSON.durationInSeconds.toString());
                }
            }
        }
        else {
            kcalPerMinute = dataJSON.activeKilocalories / (dataJSON.durationInSeconds / 60);
            if(kcalPerMinute < 3.5) {
                actSum = createTable(
                    device,
                    "EXERCISE_LOW",
                    epoch,
                    isoTime(dataJSON.startTimeInSeconds, timeOffset),
                    dataJSON.durationInSeconds.toString());
            }
            else if(kcalPerMinute >= 3.5 && kcalPerMinute <= 7.0) {
                actSum = createTable(
                    device,
                    "EXERCISE_MID",
                    epoch,
                    isoTime(dataJSON.startTimeInSeconds, timeOffset),
                    dataJSON.durationInSeconds.toString());
            }
            else {
                actSum = createTable(
                    device,
                    "EXERCISE_HIGH",
                    epoch,
                    isoTime(dataJSON.startTimeInSeconds, timeOffset),
                    dataJSON.durationInSeconds.toString());
            }
        }
        params.push(actSum);
        return params;

    // Manually Updated Activity Summaries
    case "manually":
        timeOffset = timeOff(dataJSON.startTimeOffsetInSeconds);
        var kcalPerMin = 0.0;
        var manuelSum;
        if("deviceName" in dataJSON) {
            device = dataJSON.deviceName;
        }
        if("manual" in dataJSON) {
            if(dataJSON.manual) {
                manuelSum = createTable(
                    device,
                    "EXERCISE_MANUAL",
                    epoch,
                    isoTime(dataJSON.startTimeInSeconds, timeOffset),
                    dataJSON.durationInSeconds.toString());
            }
            else {
                /*  kcal/minute < 3.5               light exercise
                *   3.5 <= kcal/minute <= 7.0       moderate exercise
                *   7.0 < kcal/minute               vigorous exercise
                */
                kcalPerMin = dataJSON.activeKilocalories / (dataJSON.durationInSeconds / 60);
                if(kcalPerMin < 3.5) {
                    manuelSum = createTable(
                        device,
                        "EXERCISE_LOW",
                        epoch,
                        isoTime(dataJSON.startTimeInSeconds, timeOffset),
                        dataJSON.durationInSeconds.toString());
                }
                else if(kcalPerMin >= 3.5 && kcalPerMinute <= 7.0) {
                    manuelSum = createTable(
                        device,
                        "EXERCISE_MID",
                        epoch,
                        isoTime(dataJSON.startTimeInSeconds, timeOffset),
                        dataJSON.durationInSeconds.toString());
                }
                else {
                    manuelSum = createTable(
                        device,
                        "EXERCISE_HIGH",
                        epoch,
                        isoTime(dataJSON.startTimeInSeconds, timeOffset),
                        dataJSON.durationInSeconds.toString());
                }
            }
        }
        else {
            kcalPerMin = dataJSON.activeKilocalories / (dataJSON.durationInSeconds / 60);
            if(kcalPerMinute < 3.5) {
                manuelSum = createTable(
                    device,
                    "EXERCISE_LOW",
                    epoch,
                    isoTime(dataJSON.startTimeInSeconds, timeOffset),
                    dataJSON.durationInSeconds.toString());
            }
            else if(kcalPerMin >= 3.5 && kcalPerMinute <= 7.0) {
                manuelSum = createTable(
                    device,
                    "EXERCISE_MID",
                    epoch,
                    isoTime(dataJSON.startTimeInSeconds, timeOffset),
                    dataJSON.durationInSeconds.toString());
            }
            else {
                manuelSum = createTable(
                    device,
                    "EXERCISE_HIGH",
                    epoch,
                    isoTime(dataJSON.startTimeInSeconds, timeOffset),
                    dataJSON.durationInSeconds.toString());
            }
        }
        params.push(manuelSum);
        return params;

    // Activity Details Summaries
    case "actDetails":
        if("deviceName" in dataJSON.summary) {
            device = dataJSON.summary.deviceName;
        }
        timeOffset = timeOff(dataJSON.summary.startTimeOffsetInSeconds);
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
    case "stressDetails":
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

    default:
        return params;
    }
};
