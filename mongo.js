var uuid = require("uuid")

module.exports = EventedRepository

function EventedRepository(db, opts) {
    var collection = db.collection(opts.namespace)
    var eventCollection = db.collection(opts.namespace + "~events")

    opts = opts || {}

    var encoder = opts.encoder || identity
    var decoder = opts.decoder || identity
    var missingCallback = opts.missingCallback || noop
    var primaryKey = opts.primaryKey || "id"

    return {
        store: store,
        update: update,
        remove: remove,
        getAll: getAll,
        getFor: getFor,
        getById: getByPrimaryKey,
        drop: drop,
        sub: sub
    }

    function store(records, callback) {
        records = records.map(encoder)
        callback = callback || missingCallback

        records.forEach(function (record) {
            if (!record[primaryKey]) {
                record[primaryKey] = uuid()
            }
        })

        eventCollection.insert(records.map(asEvent), function (err) {
            if (err) {
                return callback(err)
            }

            collection.insert(records, function (err, records) {
                if (err) {
                    return callback(err)
                }

                callback(null, decoder(records[0]))
            })
        })

        function asEvent(record) {
            return {
                name: "record created",
                record: record,
                id: record[primaryKey],
                time: Date.now()
            }
        }
    }

    function remove(id, callback) {
        callback = callback || missingCallback

        eventCollection.insert([{
            name: "record removed",
            id: id,
            time: Date.now()
        }], function (err) {
            if (err) {
                return callback(err)
            }

            var query = {}
            query[primaryKey] = id
            collection.remove(query, function (err, record) {
                if (err) {
                    return callback(err)
                }

                callback(null, null)
            })
        })
    }

    function update(id, delta, callback) {
        callback = callback || missingCallback

        eventCollection.insert([{
            name: "record updated",
            id: id,
            delta: delta,
            time: Date.now()
        }], function (err) {
            if (err) {
                return callback(err)
            }

            var query = {}
            query[primaryKey] = id
            collection.findAndModify(query, [[primaryKey, -1]], {
                $set: delta
            }, {
                "new": true
            }, function (err, record) {
                if (err) {
                    return callback(err)
                }

                callback(null, decoder(record))
            })
        })
    }

    function getByPrimaryKey(key, callback) {
        var query = {}
        query[primaryKey] = key

        collection.findOne(query, function (err, record) {
            if (err) {
                return callback(err)
            }

            callback(null, decoder(record))
        })
    }

    function getAll(callback) {
        collection.find().toArray(function (err, records) {
            if (err) {
                return callback(err)
            }

            callback(null, records.map(decoder))
        })
    }

    function getFor(key, value, callback) {
        var query = {}
        query[key] = value

        collection.find(query).toArray(function (err, records) {
            if (err) {
                return callback(err)
            }

            callback(null, records.map(decoder))
        })
    }

    function drop(callback) {
        var count = 2
        var done = false
        collection.drop(function (err) {
            if (err && !done) {
                done = true
                return callback(err)
            }

            if (--count === 0) {
                callback(null)
            }
        })
        eventCollection.drop(function (err) {
            if (err && !done) {
                done = true
                return callback(err)
            }

            if (--count === 0) {
                callback(null)
            }
        })
    }

    function sub(options) {
        options.namespace = opts.namespace + "." + options.namespace
        return EventedRepository(db, options)
    }
}

function identity(x) { return x }
function noop() {}
