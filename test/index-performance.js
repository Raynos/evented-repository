var uuid = require("uuid")

module.exports = TestIndexesRepository

function TestIndexesRepository(test, Repository, db) {
    var repo = Repository(db, {
        namespace: "main",
        indexes: ["country"]
    })

    var indexSub = repo.sub({
        indexes: ["count"],
        namespace: "indexes"
    })
    var nonSub = repo.sub("no-indexes")

    test("ensure index data exists", function (assert) {
        indexSub.getById("1", function (err, record) {
            if (record === null) {
                insertData()
            } else if (record) {
                assert.end()
            } else {
                console.log("wtf", err, record)
                assert.fail("wtf")
            }
        })

        function insertData() {
            var records = range(0, 100000).map(function (index) {
                return {
                    id: String(index),
                    sex: index % 2 === 0 ? "male" : "female",
                    count: String(index % 1000)
                }
            })

            indexSub.store(records, function (err) {
                assert.ifError(err)

                nonSub.store(records, function (err){
                    assert.ifError(err)

                    assert.end()
                })
            })
        }
    })


    test("getBy() vs getFor() performance", function (assert) {
        var startBy = Date.now()
        indexSub.getBy("count", "50", function (err, records) {
            assert.ifError(err)

            byTime = Date.now() - startBy

            console.log("records", records.length)
            assert.equal(records.length, 100)

            var startFor = Date.now()
            nonSub.getFor("count", "50", function (err, records) {
                assert.ifError(err)

                forTime = Date.now() - startFor

                assert.equal(records.length, 100)

                assert.ok(byTime * 10 < forTime)

                console.log("#COMMENT getFor", forTime, "getBy", byTime)

                assert.end()
            })
        })
    })

    test("getById() vs getFor() performance", function (assert) {
        var targetId = "50000"
        var startBy = Date.now()
        indexSub.getById(targetId, function (err, record) {
            assert.ifError(err)

            byTime = Date.now() - startBy

            assert.equal(record.id, targetId)

            var startFor = Date.now()
            nonSub.getFor("id", targetId, function (err, records) {
                assert.ifError(err)

                forTime = Date.now() - startFor

                assert.equal(records.length, 1)
                assert.equal(records[0].id, targetId)

                assert.ok(byTime * 10 < forTime)

                console.log("#COMMENT getFor", forTime, "getById", byTime)

                assert.end()
            })
        })
    })
}

function range(min, max) {
    var list = []

    for (var i = min; i < max; i++) {
        list.push(i)
    }

    return list
}
