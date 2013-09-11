var uuid = require("uuid")

module.exports = TestReadRepository

function TestReadRepository(test, Repository, db) {
    var repo = Repository(db, {
        namespace: "main",
        indexes: ["country"]
    })

    test("getById()", function (assert) {
        var id = uuid()
        repo.store([{ name: "steve", id: id }], function (err) {
            assert.ifError(err)

            repo.getById(id, function (err, record) {
                assert.ifError(err)

                assert.equal(record.id, id)
                assert.equal(record.name, "steve")

                assert.end()
            })
        })
    })

    test("getById() non existant", function (assert) {
        var id = uuid()
        repo.getById(id, function (err, record) {
            assert.ifError(err)

            assert.equal(record, null)

            assert.end()
        })
    })

    test("getAll() on a sub", function (assert) {
        var id = uuid()
        var sub = repo.sub(id)

        sub.store([
            { name: "steve", id: "3" },
            { name: "mary", id: "1" },
            { name: "bob", id: "2" }
        ], function (err) {
            assert.ifError(err)

            sub.getAll(function (err, records) {
                assert.ifError(err)

                assert.equal(records[0].name, "mary")
                assert.equal(records[1].name, "bob")
                assert.equal(records[2].name, "steve")

                assert.end()
            })
        })
    })

    test("getFor() on a sub", function (assert) {
        var id = uuid()
        var sub = repo.sub(id)

        sub.store([
            { name: "steve", id: "3", sex: "male" },
            { name: "mary", id: "1", sex: "female" },
            { name: "bob", id: "2", sex: "male" },
            { name: "susan", id: "4", sex: "female" }
        ], function (err) {
            assert.ifError(err)

            sub.getFor("sex", "male", function (err, records) {
                assert.ifError(err)

                assert.equal(records[0].name, "bob")
                assert.equal(records[1].name, "steve")

                assert.end()
            })
        })
    })

    test("getBy() on a sub", function (assert) {
        var id = uuid()
        var sub = repo.sub({
            indexes: ["sex"],
            namespace: id
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

                assert.equal(records[0].name, "bob")
                assert.equal(records[1].name, "steve")

                assert.end()
            })
        })
    })

    test("getBy() non indexed key", function (assert) {
        repo.getBy("name", "steve", function (err) {
            assert.ok(err)
            assert.equal(err.type, "nonexistant.index")

            assert.end()
        })
    })
}