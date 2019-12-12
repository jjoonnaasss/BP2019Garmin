const m = require("mocha");
var assert = require("assert");
m.describe("Test", function() {
    m.describe("foo", function() {
        m.it("2+2=4", function() {
            assert.equal(2 + 2, 4);
        });
    });
});
