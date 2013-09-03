var mongo = require("continuable-mongo")
var test = require("tape")

var MongoRepository = require("../mongo.js")
var TestRepository = require("./repository-test.js")

var db = mongo("mongodb://localhost:27017/evented-repository")

TestRepository(test, MongoRepository, db)

test("close mongo", function (assert) {
    db.close(function (err) {
        assert.ifError(err)

        assert.end()
    })
})
