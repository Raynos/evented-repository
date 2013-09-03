var uuid = require("uuid")

module.exports = TestRepository

function TestRepository(test, Repository, db) {
    var repo = Repository(db, "main")

    test("repository has correct methods", function (assert) {
        assert.equal(typeof repo.store, "function")
        assert.equal(typeof repo.update, "function")
        assert.equal(typeof repo.remove, "function")
        assert.equal(typeof repo.drop, "function")
        assert.equal(typeof repo.sub, "function")

        assert.equal(typeof repo.getById, "function")
        assert.equal(typeof repo.getAll, "function")
        assert.equal(typeof repo.getFor, "function")
        // assert.equal(typeof repo.getBy, "function")

        assert.end()
    })

    test("store() records", function (assert) {
        repo.store([
            { name: "steve" },
            { name: "bob" },
            { name: "mary" }
        ], function (err, records) {
            assert.ifError(err)

            assert.equal(records.length, 3)
            assert.equal(records[0].name, "steve")
            assert.equal(typeof records[0].id, "string")
            assert.equal(records[1].name, "bob")
            assert.equal(typeof records[1].id, "string")
            assert.equal(records[2].name, "mary")
            assert.equal(typeof records[2].id, "string")

            assert.end()
        })
    })

    test("update() record", function (assert) {
        var id = uuid()

        repo.store([{
            name: "steve", id: id
        }], function (err) {
            assert.ifError(err)

            repo.update(id, {
                name: "bob", foo: "bar"
            }, function (err, record) {
                assert.ifError(err)

                assert.equal(record.id, id)
                assert.equal(record.name, "bob")
                assert.equal(record.foo, "bar")

                assert.end()
            })
        })
    })

    test("update() non existant id", function (assert) {
        var id = uuid()

        repo.update(id, {
            name: "bob"
        }, function (err) {
            assert.ok(err)
            assert.equal(err.type, "not.found")

            assert.end()
        })
    })

    test("remove() record", function (assert) {
        var id = uuid()

        repo.store([{
            name: "bob", id: id
        }], function (err) {
            assert.ifError(err)

            repo.remove(id, function (err) {
                assert.ifError(err)

                repo.getById(id, function (err, record) {
                    assert.ifError(err)
                    assert.equal(record, null)

                    assert.end()
                })
            })
        })
    })

    test("remove() non existant id", function (assert) {
        repo.remove(uuid(), function (err) {
            assert.ifError(err)

            assert.end()
        })
    })

    test("sub() to generate sub collection", function (assert) {
        var subRepo = repo.sub("sub")
        var id = uuid()

        subRepo.store([{
            name: "steve", id: id
        }], function (err) {
            assert.ifError(err)

            subRepo.getById(id, function (err, record) {
                assert.ifError(err)

                assert.equal(record.name, "steve")
                assert.equal(record.id, id)

                repo.getById(id, function (err, record) {
                    assert.ifError(err)

                    assert.equal(record, null)

                    assert.end()
                })
            })
        })
    })

    test("drop() sub collection", function (assert) {
        var subRepo = repo.sub(uuid())

        subRepo.store([
            { name: "steve" },
            { name: "bob" },
            { name: "mary" }
        ], function (err) {
            assert.ifError(err)

            subRepo.getAll(function (err, records) {
                assert.ifError(err)

                assert.equal(records.length, 3)

                subRepo.drop(function (err) {
                    assert.ifError(err)

                    subRepo.getAll(function (err, records) {
                        assert.ifError(err)

                        assert.equal(records.length, 0)

                        assert.end()
                    })
                })
            })
        })
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

    test("getById() non existant", skip)

    test("getAll() on a sub", skip)
    test("getFor() on a sub", skip)
    test("getBy() on a sub", skip)
    test("getBy() non indexed key", skip)

    test("getBy() vs getFor() performance", skip)
    test("getById() vs getFor() performance", skip)

    test("decoder() works", skip)
    test("encoder() works", skip)
}

function skip(assert) { return assert.end() }
