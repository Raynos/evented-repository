var uuid = require("uuid")

module.exports = TestEncoderDecoder

function TestEncoderDecoder(test, Repository, db) {
    var repo = Repository(db, {
        namespace: "main",
        indexes: ["country"]
    })

    test("decoder() works", function (assert) {
        var id = uuid()
        var sub = repo.sub({
            indexes: ["sex"],
            namespace: id,
            decoder: function (r) {
                r.gender = r.sex === "male" ? "M" : "F"
                return r
            }
        })

        sub.store([
            { name: "steve", id: "3", sex: "male" },
            { name: "mary", id: "1", sex: "female" },
            { name: "bob", id: "2", sex: "male" },
            { name: "susan", id: "4", sex: "female" }
        ], function (err) {
            assert.ifError(err)

            sub.getBy("sex", "male", function (err, records) {
                assert.ifError(err)

                assert.equal(records[0].gender, "M")
                assert.equal(records[1].gender, "M")

                sub.getFor("sex", "female", function (err, records) {
                    assert.ifError(err)

                    assert.equal(records[0].gender, "F")
                    assert.equal(records[1].gender, "F")

                    sub.getAll(function (err, records) {
                        assert.ifError(err)

                        assert.equal(records[0].gender, "F")
                        assert.equal(records[1].gender, "M")
                        assert.equal(records[2].gender, "M")
                        assert.equal(records[3].gender, "F")

                        sub.getById("2", function (err, record) {
                            assert.ifError(err)

                            assert.equal(record.gender, "M")

                            assert.end()
                        })
                    })
                })
            })
        })  
    })

    test("encoder() works", function (assert) {
        var id = uuid()
        var sub = repo.sub({
            namespace: id,
            encoder: function (r) {
                if (!r.createdAt) {
                    r.createdAt = Date.now()
                }

                r.lastUpdated = Date.now()
                return r
            }
        })

        var now = Date.now()
        sub.store([{ name: "steve" }], function (err, records) {
            assert.ifError(err)

            var createdAt = records[0].createdAt
            var lastUpdated = records[0].lastUpdated

            assert.equal(records[0].name, "steve")
            assert.ok(createdAt === now || createdAt === now + 1)
            assert.ok(lastUpdated === now || lastUpdated === now + 1)

            sub.update(records[0].id, {
                sex: "male"
            }, function (err, record) {
                assert.ifError(err)

                assert.notEqual(record.lastUpdated, records[0].lastUpdated)
                assert.equal(record.createdAt, records[0].createdAt)

                sub.getById(record.id, function (err, doc) {
                    assert.ifError(err)

                    assert.equal(doc.lastUpdated, record.lastUpdated)

                    assert.end()
                })
            })
        })    
    })

    test("update() respects encoder()", function (assert) {
        var id = uuid()
        var sub = repo.sub({
            namespace: id,
            encoder: function (r) {
                if (!r.boolean) {
                    r.boolean = true
                } else {
                    delete r.boolean;
                }

                return r
            }
        })

        sub.store([{ name: "steve", id: id }], function (err, records) {
            assert.ifError(err)

            assert.equal(records[0].boolean, true)

            sub.update(id, { sex: "male" }, function (err, record) {
                assert.ifError(err)

                assert.equal(record.boolean, undefined)
                assert.notOk("boolean" in record)

                sub.getById(id, function (err, record) {
                    assert.ifError(err)

                    assert.equal(record.boolean, undefined)
                    assert.notOk("boolean" in record)

                    sub.update(id, { gender: "M" }, function (err, record) {
                        assert.ifError(err)

                        assert.equal(record.boolean, true)

                        sub.getById(id, function (err, record) {
                            assert.ifError(err)

                            assert.equal(record.boolean, true)

                            assert.end()
                        })
                    })
                })
            })
        })
    })
}
