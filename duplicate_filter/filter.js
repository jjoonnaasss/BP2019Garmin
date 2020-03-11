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

    var filterData = data;

    //Function created to avoid redundant code.
    function duplicateFilter(odvData) {
        //This function helps to avoid redundant code.
        function check(vaultType, var1, var2, iorj) {
            if((odvData.data[var1].type === vaultType) && (odvData.data[var2].type) === vaultType) { //data has to be the same type to be redundant
                if(odvData.data[var1].epoch === odvData.data[var2].epoch) {
                    if(odvData.data[var1].value != odvData.data[var2].value) {
                        if(odvData.data[var1].value > odvData.data[var2].value) { //Keep the data with the longer duration.
                            odvData.data.splice(var2, 1); //data.splice(index, number of deleting data)
                            iorj = "j";
                        } else {
                            odvData.data.splice(var1, 1);
                            iorj = "i";
                        }
                    } else {
                        if(odvData.data[var2].origin === "unknown") { //Delete the data which has no given device.
                            odvData.data.splice(var2, 1);
                            iorj = "j";
                        } else {
                            odvData.data.splice(var1, 1);
                            iorj = "i";
                        }
                    }
                }
            }
            return iorj;
        }

        for(var i = 0; i < odvData.data.length; i++) {
            for(var j = i+1; j < odvData.data.length; j++) {
                if((odvData.data[i].type === "HEART_RATE") && (odvData.data[j].type === "HEART_RATE")) {
                    if(odvData.data[i].epoch === odvData.data[j].epoch) {
                        if(odvData.data[j].origin === "unknown") { //Delete the data which has no given device.
                            odvData.data.splice(j, 1);
                            j -= 1;
                        } else {
                            odvData.data.splice(i, 1);
                            i -= 1;
                        }
                    }
                } else if((odvData.data[i].type === "WEIGHT") && (odvData.data[j].type === "WEIGHT")) {
                    if(odvData.data[i].epoch === odvData.data[j].epoch) {
                        if(odvData.data[j].origin === "unknown") { //Delete the data which has no given device.
                            odvData.data.splice(j, 1);
                            j -= 1;
                        } else {
                            odvData.data.splice(i, 1);
                            i -= i;
                        }
                    }
                } else if((odvData.data[i].type === "STRESS") && (odvData.data[j].type === "STRESS")) {
                    if(odvData.data[i].epoch === odvData.data[j].epoch) {
                        if(odvData.data[j].origin === "unknown") { //Delete the data which has no given device.
                            odvData.data.splice(j, 1);
                            j -= 1;
                        } else {
                            odvData.data.splice(i, 1);
                            i -= i;
                        }
                    }
                } else {
                    var minus = "none";
                    minus = check("EXERCISE_MANUAL", i, j, minus);
                    minus = check("EXERCISE_LOW", i, j, minus);
                    minus = check("EXERCISE_MID", i, j, minus);
                    minus = check("EXERCISE_HIGH", i, j, minus);
                    minus = check("SLEEP_LIGHT", i, j, minus);
                    minus = check("SLEEP_REM", i, j, minus);
                    minus = check("SLEEP_DEEP", i, j, minus);
                    if(minus === "i") {
                        i -= 1;
                    } else if(minus === "j") {
                        j -= 1;
                    }
                }
            }
        }
        return odvData;
    }

    return duplicateFilter(filterData);
};