// var mongo = require("continuable-mongo")
var test = require("tape")
var level = require("levelup")

// var MongoRepository = require("../mongo.js")
var LevelRepository = require("../level.js")
var TestWriteRepository = require("./repository-write.js")
var TestReadRepository = require("./repository-read.js")
var TestIndexesRepository = require("./index-performance.js")
var TestEncoderDecoder = require("./encoder-decoder.js")

// var mongoDb = mongo("mongodb://localhost:27017/evented-repository")
var levelDb = level("/tmp/evented-repository", {
    valueEncoding: "json"
})

// testRepository(MongoRepository, mongoDb)
testRepository(LevelRepository, levelDb)

test("close leveldb", function (assert) {
    levelDb.close(function (err) {
        assert.ifError(err)

        assert.end()
    })
})

// test("close mongo", function (assert) {
//     mongoDb.close(function (err) {
//         assert.ifError(err)

//         assert.end()
//     })
// })

function testRepository(Repository, db) {
    TestWriteRepository(test, Repository, db)
    TestReadRepository(test, Repository, db)
    TestIndexesRepository(test, Repository, db)
    TestEncoderDecoder(test, Repository, db)
}
