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


/*
 * googleOdvConverter receives a JSON data, which is still in google fit format and converts it to the odv-Format.
 * It returns the odv-File as a string.
*/
module.exports.googleOdvConverter = function(dataJSON) {

    var entries = [];
    var epo;
    var date;

    //This function creates a JSON out of the given data.
    function createJSON(origin, type, epoch, isoTime, value) {
        var data = {"origin": origin, "source": "Google Fit", "type": type, "epoch": epoch, "isoTime": isoTime, "value": value};
        return data;
    }

    //This function converts the date to the isoTime.
    //currentDate: the date you want to convert
    //hours: which timezone
    function addHours(currentDate, hours) {
        var buffer = currentDate;
        var offset = 0;
        buffer.setTime(currentDate.getTime() + (hours*60*60*100));
        if(hours >= 0) {
            if(hours.toString().length == 1) {
                offset = `+0${hours}:00`;
            }
            else {
                offset = `+${hours}:00`;
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
        return buffer.toISOString().split(".")[0].concat(offset);
    }

    //This function filters redundant data of a JSON file.
    function duplicateFilter(odvData) {
        //This function helps to avoid redundant code.
        function check(vaultType, var1, var2, IorJ) {
            if ((odvData.data[var1].type === vaultType) && (odvData.data[var2].type) === vaultType) { //data has to be the same type to be redundant
                if (odvData.data[var1].epoch === odvData.data[var2].epoch) {
                    if (odvData.data[var1].value !== odvData.data[var2].value) {
                        if (odvData.data[var1].value > odvData.data[var2].value) { //Keep the data with the longer duration.
                            odvData.data.splice(var2, 1); //data.splice(index, number of deleting data)
                            IorJ = "j";
                        } else {
                            odvData.data.splice(var1, 1);
                            IorJ = "i";
                        }
                    } else {
                        if (odvData.data[var2].origin === "unknown") { //Delete the data which has no given device.
                            odvData.data.splice(var2, 1);
                            IorJ = "j";
                        } else {
                            odvData.data.splice(var1, 1);
                            IorJ = "i";
                        }
                    }
                }
            }
            return IorJ;
        }

        for (var i = 0; i < odvData.data.length; i++) {
            for (var j = i + 1; j < odvData.data.length; j++) {
                //delete redundant "HEART_RATE" data
                if ((odvData.data[i].type === "HEART_RATE") && (odvData.data[j].type === "HEART_RATE")) {
                    if (odvData.data[i].epoch === odvData.data[j].epoch) {
                        if (odvData.data[j].origin === "unknown") { //Delete the data which has no given device.
                            odvData.data.splice(j, 1);
                            j -= 1;
                        } else {
                            odvData.data.splice(i, 1);
                            i -= 1;
                        }
                    }
                    //delete redundatn "WEIGHT" data
                } else if ((odvData.data[i].type === "WEIGHT") && (odvData.data[j].type === "WEIGHT")) {
                    if (odvData.data[i].epoch === odvData.data[j].epoch) {
                        if (odvData.data[j].origin === "unknown") { //Delete the data which has no given device.
                            odvData.data.splice(j, 1);
                            j -= 1;
                        } else {
                            odvData.data.splice(i, 1);
                            i -= i;
                        }
                    }
                    //delete redundant "STRESS" data
                } else if ((odvData.data[i].type === "STRESS") && (odvData.data[j].type === "STRESS")) {
                    if (odvData.data[i].epoch === odvData.data[j].epoch) {
                        if (odvData.data[j].origin === "unknown") { //Delete the data which has no given device.
                            odvData.data.splice(j, 1);
                            j -= 1;
                        } else {
                            odvData.data.splice(i, 1);
                            i -= i;
                        }
                    }
                } else {
                    var minus = "none";
                    //delete redundant data of the specific type
                    minus = check("EXERCISE_MANUAL", i, j, minus);
                    minus = check("EXERCISE_LOW", i, j, minus);
                    minus = check("EXERCISE_MID", i, j, minus);
                    minus = check("EXERCISE_HIGH", i, j, minus);
                    minus = check("SLEEP_LIGHT", i, j, minus);
                    minus = check("SLEEP_REM", i, j, minus);
                    minus = check("SLEEP_DEEP", i, j, minus);
                    if (minus === "i") {
                        i -= 1;
                    } else if (minus === "j") {
                        j -= 1;
                    }
                }
            }
        }
        return odvData;
    }

    //We will save the converted file into fileData.
    let fileData = "{\"title\":\"DiaConvert ODV JSON export\",\"exportDate\":\"" + new Date(Date.now()).toLocaleString("de-DE", {
        hour12: false,
        timeZone: "Europe/Berlin"
    }).replace(",", "") + "\",\"data\":[";

    let activityTime = 0;
    let kcalPerMinute = 0;

    for(var a = 0; a < dataJSON.data.length; a++) {
        switch(dataJSON.data[a].dataTypeName) {
        case "com.google.weight":
            epo = (Math.round(dataJSON.data[a].startTimeNanos / 1000000));  //Nanoseconds -> Milliseconds
            date = addHours(new Date(dataJSON.data[a].startTimeNanos / 1000000), 1);    //currently using 1 as timezone, since we are located in Germany.
            entries.push(createJSON("unknown", "WEIGHT", epo, date, dataJSON.data[a].value[0].fpVal));
            break;
        case "com.google.heart_minutes":    //Heart Points: 1 HP (medium intensity activity)	2 HPs (High intensity activity)
            activityTime = Math.round(((dataJSON.data[a].endTimeNanos / 1000000) - (dataJSON.data[a].startTimeNanos / 1000000)) / 1000);
            if(dataJSON.data[a].value[0].fpVal === 1) {
                epo = (Math.round(dataJSON.data[a].startTimeNanos / 1000000));
                date = addHours(new Date(dataJSON.data[a].startTimeNanos / 1000000), 1);
                entries.push(createJSON("unknown", "EXERCISE_HIGH", epo, date, activityTime));
            } else {
                epo = (Math.round(dataJSON.data[a].startTimeNanos / 1000000));
                date = addHours(new Date(dataJSON.data[a].startTimeNanos / 1000000), 1);
                entries.push(createJSON("unknown", "EXERCISE_MID", epo, date, activityTime));
            }
            break;
        case "com.google.calories.expended":
            //convert nanoseconds to seconds
            activityTime = Math.round(((dataJSON.data[a].endTimeNanos / 1000000) - (dataJSON.data[a].startTimeNanos / 1000000)) / 1000);
            kcalPerMinute = dataJSON.data[a].value[0].fpVal / (activityTime/60);
            //1.2 kcal/min for a 70-kg individual(sitting), which means everything lower than 1.2 kcal/min is no exercise
            if(1.2 < kcalPerMinute && kcalPerMinute < 3.5) {
                epo = (Math.round(dataJSON.data[a].startTimeNanos / 1000000));
                date = addHours(new Date(dataJSON.data[a].startTimeNanos / 1000000), 1);
                entries.push(createJSON("unknown", "EXERCISE_LOW", epo, date, activityTime));
            } else if(3.5 <= kcalPerMinute && kcalPerMinute <= 7.0) {
                epo = (Math.round(dataJSON.data[a].startTimeNanos / 1000000));
                date = addHours(new Date(dataJSON.data[a].startTimeNanos / 1000000), 1);
                entries.push(createJSON("unknown", "EXERCISE_MID", epo, date, activityTime));
            } else { //more than 7.0 kcal/min
                epo = (Math.round(dataJSON.data[a].startTimeNanos / 1000000));
                date = addHours(new Date(dataJSON.data[a].startTimeNanos / 1000000), 1);
                entries.push(createJSON("unknown", "EXERCISE_HIGH", epo, date, activityTime));
            }
            break;
        case "com.google.heart_rate.bpm":
            if(dataJSON.data[a].value[0].fpVal > 10) {
                epo = (Math.round(dataJSON.data[a].startTimeNanos / 1000000));
                date = addHours(new Date(dataJSON.data[a].startTimeNanos / 1000000), 1);
                entries.push(createJSON("unknown", "HEART_RATE", epo, date, dataJSON.data[a].value[0].fpVal));
            }
            break;
        default:
            break;
        }
    }

    //stringify the data
    for(var j = 0; j < entries.length; j++) {
        fileData += JSON.stringify((entries[j])) + ",";
    }
    //cut off last ","
    fileData = fileData.substring(0, fileData.length - 1);
    fileData += "]}";

    //filter the duplicates
    const fileBuffer = JSON.parse(fileData);
    fileData = JSON.stringify(duplicateFilter(fileBuffer));

    return fileData;
};