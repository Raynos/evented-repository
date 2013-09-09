var uuid = require("uuid")

module.exports = TestRepository

function TestRepository(test, Repository, db) {
    var repo = Repository(db, {
        namespace: "main",
        indexes: ["country"]
    })

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

    test("getBy() vs getFor() performance", function (assert) {
        var id = uuid()
        var sub1 = repo.sub({
            indexes: ["count"],
            namespace: id
        })
        var sub2 = repo.sub(id + "_id")

        var records = range(0, 100000).map(function (index) {
            return {
                id: index,
                sex: index % 2 === 0 ? "male" : "female",
                count: String(index % 100)
            }
        })

        var count = 2
        var byTime
        var forTime
        sub1.store(records, function (err) {
            assert.ifError(err)

            sub2.store(records, function (err) {
                assert.ifError(err)

                var startBy = Date.now()
                sub1.getBy("count", "50", function (err, records) {
                    assert.ifError(err)

                    byTime = Date.now() - startBy

                    assert.equal(records.length, 1000)

                    var startFor = Date.now()
                    sub2.getFor("count", "50", function (err, records) {
                        assert.ifError(err)

                        forTime = Date.now() - startFor

                        assert.equal(records.length, 1000)

                        assert.ok(byTime * 1.5 < forTime)

                        assert.end()
                    })
                })
            })
        })
    })

    test("getById() vs getFor() performance", function (assert) {
        var id = uuid()
        var sub1 = repo.sub({
            indexes: ["count"],
            namespace: id
        })
        var sub2 = repo.sub(id + "_id")

        var records = range(0, 100000).map(function (index) {
            return {
                id: index,
                sex: index % 2 === 0 ? "male" : "female",
                count: String(index % 100)
            }
        })

        var count = 2
        var byTime
        var forTime
        var targetId = records[50000].id
        sub1.store(records, function (err) {
            assert.ifError(err)

            sub2.store(records, function (err) {
                assert.ifError(err)

                var startBy = Date.now()
                sub1.getById(targetId, function (err, record) {
                    assert.ifError(err)

                    byTime = Date.now() - startBy

                    assert.equal(record.id, targetId)

                    var startFor = Date.now()
                    sub2.getFor("id", targetId, function (err, records) {
                        assert.ifError(err)

                        forTime = Date.now() - startFor

                        assert.equal(records.length, 1)
                        assert.equal(records[0].id, targetId)

                        assert.ok(byTime * 1.5 < forTime)

                        console.log("getFor", forTime, "getById", byTime)

                        assert.end()
                    })
                })
            })
        })  
    })

    test("decoder() works", skip)
    test("encoder() works", skip)

    test("update() respects encoder()", skip)
    test("concurrent update() works", skip)

    test("batch semantics are correct. Journal should work", skip)
}

function range(min, max) {
    var list = []

    for (var i = min; i < max; i++) {
        list.push(i)
    }

    return list
}

function skip(assert) { return assert.end() }
