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

//This code snippet is only used for test purposes. You can used this code to test if the given JSON files are converted correctly to the odv format.

const fs = require("fs");
var test = require("./odv_converter");

//Save the content of the JSON files into a constant.
const rawdata = fs.readFileSync("daily_summaries.json");
const dailySum = JSON.parse(rawdata);
const rawdata1 = fs.readFileSync("third_party.json");
const thirdParty = JSON.parse(rawdata1);
const rawdata2 = fs.readFileSync("activity_summaries.json");
const actSum = JSON.parse(rawdata2);
const rawdata3 = fs.readFileSync("manually_updated_activity_summaries.json");
const manually = JSON.parse(rawdata3);
const rawdata4 = fs.readFileSync("activity_details_summaries.json");
const actDetails = JSON.parse(rawdata4);
const rawdata5 = fs.readFileSync("epoch_summaries.json");
const epochSum = JSON.parse(rawdata5);
const rawdata6 = fs.readFileSync("sleep_summaries.json");
const sleepSum = JSON.parse(rawdata6);
const rawdata7 = fs.readFileSync("body_composition_summaries.json");
const bodyComSum = JSON.parse(rawdata7);
const rawdata8 = fs.readFileSync("stress_details_summaries.json");
const strDetSum = JSON.parse(rawdata8);

//Use the odv-converter on each JSON file and save the converted data into an array.
var array = [];
if(dailySum != undefined) {
    for(var i = 0; i < dailySum.length; i++) {
        for(var y = 0; y < test.odvConverter(dailySum[i], "dailies").length; y++) {
            array.push(test.odvConverter(dailySum[i], "dailies")[y]);
        }
    }
}
if(thirdParty != undefined) {
    for(var j = 0; j < thirdParty.length; j++) {
        array.push(test.odvConverter(thirdParty[j], "thirdParty")[0]);
    }
}
if(actSum != undefined) {
    for (var z = 0; z < actSum.length; z++) {
        array.push(test.odvConverter(actSum[z], "activities")[0]);
    }
}
if(manually != undefined) {
    for(var k = 0; k < manually.length; k++) {
        array.push(test.odvConverter(manually[k], "manually")[0]);
        array.push(test.odvConverter(manually[k], "manually")[1]);
    }
}
if(actDetails != undefined) {
    for(var l = 0; l < actDetails.length; l++) {
        var buffer = test.odvConverter(actDetails[l], "actDetails");
        for(var m = 0; m < buffer.length; m++) {
            array.push(buffer[m]);
        }
    }
}
if(epochSum != undefined) {
    for(var n = 0; n < epochSum.length; n++) {
        array.push(test.odvConverter(epochSum[n], "epochs")[0]);
    }
}
if(sleepSum != undefined) {
    for(var o = 0; o < sleepSum.length; o++) {
        var buffer2 = test.odvConverter(sleepSum[o], "sleeps");
        for(var p = 0; p < buffer2.length; p++) {
            array.push(buffer2[p]);
        }
    }
}
if(bodyComSum != undefined) {
    for(var q = 0; q < bodyComSum.length; q++) {
        array.push(test.odvConverter(bodyComSum[q], "bodyComps")[0]);
    }
}
if(strDetSum != undefined) {
    for(var r = 0; r < strDetSum.length; r++) {
        for(var s = 0; s < test.odvConverter(strDetSum[r], "stressDetails").length; s++) {
            array.push(test.odvConverter(strDetSum[r], "stressDetails")[s]);
        }
    }
}

// If it returns an empty array, throw an error.
if(array.length == 0) throw "The given summary doesn't exist!";

//Output the converted data on the console.
console.log("==========ARRAY==========");
for(var t = 0; t < array.length; t++) {
    if(array[t] != undefined) {
        console.log(array[t].Item);
    }
}