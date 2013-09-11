var uuid = require("uuid")
var TypedError = require("error/typed")
var extend = require("xtend")

var NOT_FOUND = TypedError({
    type: "not.found",
    message: "could not find key %s"
})
var NO_INDEX = TypedError({
    type: "nonexistant.index",
    message: "could not get by %s as no index exists"
})

module.exports = EventedRepository

function EventedRepository(db, opts) {
    if (typeof opts === "string") {
        opts = { namespace: opts }
    }
    opts = opts || {}

    var collection = db.collection(opts.namespace)
    var eventCollection = db.collection(opts.namespace + "~events")

    var encoder = opts.encoder || identity
    var decoder = opts.decoder || identity
    var missingCallback = opts.missingCallback || noop
    var primaryKey = opts.primaryKey || "id"
    var indexes = opts.indexes || []
    var sortCriteria = {}
    sortCriteria[primaryKey] = 1

    if (indexes.indexOf(primaryKey) === -1) {
        indexes.push(primaryKey)
    }

    indexes.forEach(function (key) {
        var opts = {}
        opts[key] = 1
        collection.ensureIndex(opts, { background: true }, missingCallback)
    })

    return {
        store: store,
        update: update,
        remove: remove,
        drop: drop,
        sub: sub,

        getById: getByPrimaryKey,
        getAll: getAll,
        getFor: getFor,
        getBy: getBy
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

                callback(null, records.map(decoder))
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
            collection.findOne(query, function (err, record) {
                if (err) {
                    return callback(err)
                }

                if (record === null) {
                    return callback(NOT_FOUND(id))
                }

                var newValue = encoder(extend(record, delta))
                collection.update(query, {
                    $set: delta
                }, function (err) {
                    if (err) {
                        return callback(err)
                    }

                    callback(null, decoder(newValue))
                })
            })
        })
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

    function drop(callback) {
        collection.drop(callback)
    }

    function sub(options) {
        if (typeof options === "string") {
            options = { namespace: options }
        }

        options.namespace = opts.namespace + "." + options.namespace
        return EventedRepository(db, options)
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
        collection.find({}, { sort: sortCriteria })
            .toArray(function (err, records) {
                if (err) {
                    return callback(err)
                }

                callback(null, records.map(decoder))
            })
    }

    function getFor(key, value, callback) {
        var query = {}
        query[key] = value

        collection.find(query, { sort: sortCriteria })
            .toArray(function (err, records) {
                if (err) {
                    return callback(err)
                }

                callback(null, records.map(decoder))
            })
    }

    function getBy(key, value, callback) {
        if (indexes.indexOf(key) === -1) {
            return callback(NO_INDEX(key))
        }

        var query = {}
        query[key] = value

        collection.find(query, { sort: sortCriteria })
            .toArray(function (err, records) {
                if (err) {
                    return callback(err)
                }

                callback(null, records.map(decoder))
            })
    }
}

function identity(x) { return x }
function noop() {}
