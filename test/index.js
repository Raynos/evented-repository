var test = require("tape")

var eventedRepository = require("../index")

test("eventedRepository is a function", function (assert) {
    assert.equal(typeof eventedRepository, "function")
    assert.end()
})
