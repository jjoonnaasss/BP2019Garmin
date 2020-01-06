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
    }
}
if(thirdParty != undefined) {
    for(var i = 0; i < thirdParty.length; i++) {
        array.push(test.odvConverter(thirdParty[i], "thirdParty"));
    }
}
if(manually != undefined) {
    for(var i = 0; i < manually.length; i++) {
        array.push(test.odvConverter(manually[i], "manually"));
    }
}
if(actDetails != undefined) {
    for(var i = 0; i < actDetails.length; i++) {
        var buffer = test.odvConverter(actDetails[i], "actDetails");
        for(var j = 0; j < buffer.length; j++) {
            array.push(buffer[j]);
        }
    }
}
if(epochSum != undefined) {
    for(var i = 0; i < epochSum.length; i++) {
        array.push(test.odvConverter(epochSum[i], "epochSum"));
    }
}
if(sleepSum != undefined) {
    for(var i = 0; i < sleepSum.length; i++) {
        var buffer = test.odvConverter(sleepSum[i], "sleepSum");
        for(var j = 0; j < buffer.length; j++) {
            array.push(buffer[j]);
        }
    }
}
if(bodyComSum != undefined) {
    for(var i = 0; i < bodyComSum.length; i++) {
        array.push(test.odvConverter(bodyComSum[i], "bodyComSum"));
    }
}

console.log("==========ARRAY==========");
for(var i = 0; i < array.length; i++) {
    console.log(array[i].Item.vaultEntry);
}