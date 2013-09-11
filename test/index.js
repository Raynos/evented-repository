var mongo = require("continuable-mongo")
var test = require("tape")

var MongoRepository = require("../mongo.js")
var TestWriteRepository = require("./repository-write.js")
var TestReadRepository = require("./repository-read.js")
var TestIndexesRepository = require("./index-performance.js")
var TestEncoderDecoder = require("./encoder-decoder.js")

var db = mongo("mongodb://localhost:27017/evented-repository")

TestIndexesRepository(test, MongoRepository, db)
TestWriteRepository(test, MongoRepository, db)
TestReadRepository(test, MongoRepository, db)
TestEncoderDecoder(test, MongoRepository, db)

test("close mongo", function (assert) {
    db.close(function (err) {
        assert.ifError(err)

        assert.end()
    })
})
