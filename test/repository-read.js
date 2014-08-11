var uuid = require("uuid")

module.exports = TestReadRepository

function TestReadRepository(test, Repository, db) {
    var repo = Repository({
        namespace: "main-test-read"
    })

    test("getById()", function (assert) {
        var id = uuid()
        repo.store(db, [{ name: "steve", id: id }], function (err) {
            assert.ifError(err)

            repo.getById(db, id, function (err, record) {
                assert.ifError(err)

                assert.equal(record.id, id)
                assert.equal(record.name, "steve")

                assert.end()
            })
        })
    })

    test("getById() non existant", function (assert) {
        var id = uuid()
        repo.getById(db, id, function (err, record) {
            assert.ifError(err)

            assert.equal(record, null)

            assert.end()
        })
    })

    test("getAll() on a sub", function (assert) {
        var id = uuid()
        var sub = repo.sub(id)

        sub.store(db, [
            { name: "steve", id: "3" },
            { name: "mary", id: "1" },
            { name: "bob", id: "2" }
        ], function (err) {
            assert.ifError(err)

            sub.getAll(db, function (err, records) {
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

        sub.store(db, [
            { name: "steve", id: "3", sex: "male" },
            { name: "mary", id: "1", sex: "female" },
            { name: "bob", id: "2", sex: "male" },
            { name: "susan", id: "4", sex: "female" }
        ], function (err) {
            assert.ifError(err)

            sub.getFor(db, "sex", "male", function (err, records) {
                assert.ifError(err)

                assert.equal(records[0].name, "bob")
                assert.equal(records[1].name, "steve")

                assert.end()
            })
        })
    })

    test("getFor() for a nested key", function (assert) {
        var id = uuid()
        var sub = repo.sub(id)

        sub.store(db, [
            { name: "steve", id: "3", meta: { sex: "male" } },
            { name: "mary", id: "1", meta: { sex: "female" } },
            { name: "bob", id: "2", meta: { sex: "male" } },
            { name: "susan", id: "4", meta: { sex: "female" } }
        ], function (err) {
            assert.ifError(err)

            sub.getFor(db, "meta.sex", "male", function (err, records) {
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

        sub.store(db, [
            { name: "steve", id: "3", sex: "male" },
            { name: "mary", id: "1", sex: "female" },
            { name: "bob", id: "2", sex: "male" },
            { name: "susan", id: "4", sex: "female" }
        ], function (err) {
            assert.ifError(err)

            sub.getBy(db, "sex", "male", function (err, records) {
                assert.ifError(err)

                assert.equal(records[0].name, "bob")
                assert.equal(records[1].name, "steve")

                assert.end()
            })
        })
    })

    test("getBy() for a nested key", function (assert) {
        var id = uuid()
        var sub = repo.sub({
            indexes: ["meta.sex"],
            namespace: id
        })

        sub.store(db, [
            { name: "steve", id: "3", meta: { sex: "male" } },
            { name: "mary", id: "1", meta: { sex: "female" } },
            { name: "bob", id: "2", meta: { sex: "male" } },
            { name: "susan", id: "4", meta: { sex: "female" } }
        ], function (err) {
            assert.ifError(err)

            sub.getBy(db, "meta.sex", "male", function (err, records) {
                assert.ifError(err)

                assert.equal(records[0].name, "bob")
                assert.equal(records[1].name, "steve")

                assert.end()
            })
        })
    })

    test("getBy() non indexed key", function (assert) {
        repo.getBy(db, "name", "steve", function (err) {
            assert.ok(err)
            assert.equal(err.type, "nonexistant.index")

            assert.end()
        })
    })
}
