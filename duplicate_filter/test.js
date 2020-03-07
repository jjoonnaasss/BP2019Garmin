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

//This code snippet only exist for test purposes. It can be used to test filter.js

const fs = require("fs");
var test = require("./filter.js");

const rawdata = fs.readFileSync("OhneDiaConvert.json");
const nonFilteredData = JSON.parse(rawdata);

//Use this code to create a .txt file with the filtered data. Attention!!! If you use this code section, the rest of the code will be faulty.
/*fs.writeFile("filtered data.txt", JSON.stringify(test.filter(nonFilteredData)), function(err) {
    if (err) throw err;
    console.log('File is created successfully.');
});*/

//Checks if the JSON file "OhneDiaConvert.json" contains redundant data.
console.log("==========REDUNDANT DATA!!!==========");
var v = test.filter(nonFilteredData);
var counter = 1;
for(var i = 0; i < v.data.length; i++) {
    for(var j = i+1; j < v.data.length; j++) {
        if(v.data[i].type === v.data[j].type) {
            if(v.data[i].epoch === v.data[j].epoch) {
                console.log(counter.toString() + ". REDUNDANT DATA:");
                console.log(v.data[i]);
                console.log(v.data[j]);
                counter += 1;
            }
        }
    }
}
if(counter === 1) console.log("0 REDUNDANT DATA EXISTING!!!");