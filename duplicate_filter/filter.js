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

module.exports.filter = function(data) {

    var odvData = data;

    function check(vaultType, var1, var2) {
        if(odvData.data[var1].type == odvData.data[var2].type) {
            if(odvData.data[var1].epoch == odvData.data[var2].epoch) {
                if(odvData.data[var1].value != odvData.data[var2].value) {
                    if(odvData.data[var1].value > odvData.data[var2].value) { //Keep the data with the longer duration.
                        odvData.data.splice(var2, 1);
                    } else {
                        odvData.data.splice(var1, 1);
                    }
                } else {
                    if(odvData.data[var2].origin == "unknown") { //Delete the data without a given device.
                        odvData.data.splice(var2, 1);
                    } else {
                        odvData.data.splice(var1, 1);
                    }
                }
            }
        }
    }

    for(var i = 0; i < odvData.data.length; i++) {
        if(odvData.data[i] == undefined) { //This data was already deleted.
            continue;
        }
        for(var j = i+1; j < odvData.data.length; j++) { //This data was already deleted.
            if(odvData.data[j] == undefined) {
                continue;
            }
            if((odvData.data[i].type == "HEART_RATE") && (odvData.data[j].type == "HEART_RATE")) {
                if(odvData.data[i].epoch == odvData.data[j].epoch) {
                    if(odvData.data[j].origin == "unknown") { //Delete the data without a given device.
                        odvData.data.splice(j, 1);
                    } else {
                        odvData.data.splice(i, 1);
                    }
                }
            } else if((odvData.data[i].type == "WEIGHT") && (odvData.data[j].type == "WEIGHT")) {
                if(odvData.data[i].epoch == odvData.data[j].epoch) {
                    if(odvData.data[j].origin == "unknown") { //Delete the data without a given device.
                        odvData.data.splice(j, 1);
                    } else {
                        odvData.data.splice(i, 1);
                    }
                }
            } else if((odvData.data[i].type == "STRESS") && (odvData.data[j].type == "STRESS")) {
                if(odvData.data[i].epoch == odvData.data[j].epoch) {
                    if(odvData.data[j].origin == "unknown") { //Delete the data without a given device.
                        odvData.data.splice(j, 1);
                    } else {
                        odvData.data.splice(i, 1);
                    }
                }
            } else {
                check("EXERCISE_MANUAL", i, j);
                check("EXERCISE_LOW", i, j);
                check("EXERCISE_MID", i, j);
                check("EXERCISE_HIGH", i, j);
                check("SLEEP_LIGHT", i, j);
                check("SLEEP_REM", i, j);
                check("SLEEP_DEEP", i, j);
            }
        }
    }
    return odvData;
}