const fs = require("fs");
var test = require("./odv_converter");

const rawdata = fs.readFileSync("daily_summaries.json");
const dailySum = JSON.parse(rawdata);
const rawdata1 = fs.readFileSync("third_party.json");
const thirdParty = JSON.parse(rawdata1);
const rawdata2 = fs.readFileSync("manually_updated_activity_summaries.json");
const manually = JSON.parse(rawdata2);
const rawdata3 = fs.readFileSync("activity_details_summaries.json");
const actDetails = JSON.parse(rawdata3);
const rawdata4 = fs.readFileSync("epoch_summaries.json");
const epochSum = JSON.parse(rawdata4);
const rawdata5 = fs.readFileSync("sleep_summaries.json");
const sleepSum = JSON.parse(rawdata5);
const rawdata6 = fs.readFileSync("body_composition_summaries.json");
const bodyComSum = JSON.parse(rawdata6);

var array = [];
if(dailySum != undefined) {
    for(var i = 0; i < dailySum.length; i++) {
        array.push(test.odvConverter(dailySum[i], "dailySum")[0]);
        array.push(test.odvConverter(dailySum[i], "dailySum")[1]);
        array.push(test.odvConverter(dailySum[i], "dailySum")[2]);
    }
}
if(thirdParty != undefined) {
    for(var j = 0; j < thirdParty.length; j++) {
        array.push(test.odvConverter(thirdParty[j], "thirdParty")[0]);
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
        array.push(test.odvConverter(epochSum[n], "epochSum")[0]);
    }
}
if(sleepSum != undefined) {
    for(var o = 0; o < sleepSum.length; o++) {
        var buffer2 = test.odvConverter(sleepSum[o], "sleepSum");
        for(var p = 0; p < buffer2.length; p++) {
            array.push(buffer2[p]);
        }
    }
}
if(bodyComSum != undefined) {
    for(var q = 0; q < bodyComSum.length; q++) {
        array.push(test.odvConverter(bodyComSum[q], "bodyComSum")[0]);
    }
}

console.log("==========ARRAY==========");
for(var r = 0; r < array.length; r++) {
    if(array[r] != undefined) {
        console.log(array[r].Item);
    }
}