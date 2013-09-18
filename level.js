var Sublevel = require("level-sublevel")
var uuid = require("uuid")
var TypedError = require("error/typed")
var extend = require("xtend")
var deleteRange = require("level-delete-range")

var NOT_FOUND = TypedError({
    type: "not.found",
    message: "could not find key %s"
})
var NO_INDEX = TypedError({
    type: "nonexistant.index",
    message: "could not get by %s as no index exists"
})

module.exports = EventedRepository

function EventedRepository(database, opts) {
    if (typeof opts === "string") {
        opts = { namespace: opts }
    }
    opts = opts || {}

    var encoder = opts.encoder || identity
    var decoder = opts.decoder || identity
    var missingCallback = opts.missingCallback || noop
    var primaryKey = opts.primaryKey || "id"
    var indexes = opts.indexes || []
    var eventNamespace = opts.eventNamespace || "~events"
    var indexNamespace = opts.indexNamespace || "~indexes"

    var db = Sublevel(database)
    var eventDb = db.sublevel(eventNamespace)
    var indexDb = db.sublevel(indexNamespace)

    var indexDbs = indexes.reduce(function (acc, key) {
        acc[key] = indexDb.sublevel(key)
        return acc
    }, {})

    db.pre(function (op, add) {
        var value = op.value

        if (op.type !== "put") {
            return
        }

        indexes.forEach(function (key) {
            var command = {
                key: value[key] + "~" + value[primaryKey],
                value: value,
                type: "put",
                prefix: indexDbs[key]
            }

            add(command)
        })
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

        eventDb.batch(records.map(asStoreEvent), function (err) {
            if (err) {
                return callback(err)
            }

            db.batch(records.map(asStore), function (err) {
                if (err) {
                    return callback(err)
                }

                callback(null, records.map(decoder))
            })
        })
    }

    function asStoreEvent(record) {
        return {
            type: "put",
            key: record[primaryKey] + "~" + uuid(),
            value: {
                name: "record created",
                record: record,
                id: record[primaryKey],
                time: Date.now()
            }
        }
    }

    function asStore(record) {
        return {
            type: "put",
            key: record[primaryKey],
            value: record
        }
    }

    function update(id, delta, callback) {
        callback = callback || missingCallback

        eventDb.put(id + "~" + uuid(), {
            name: "record updated",
            id: id,
            delta: delta,
            time: Date.now()
        }, function (err) {
            if (err) {
                return callback(err)
            }

            db.get(id, function (err, record) {
                if (err && err.notFound) {
                    return callback(NOT_FOUND(id))
                }

                if (err) {
                    return callback(err)
                }

                var newValue = encoder(extend(record, delta))
                db.put(id, newValue, function (err) {
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

        eventDb.put(id + "~" + uuid(), {
            name: "record removed",
            id: id,
            time: Date.now()
        }, function (err) {
            if (err) {
                return callback(err)
            }

            db.del(id, callback)
        })
    }

    function drop(callback) {
        deleteRange(db, {}, callback)
    }

    function sub(options) {
        if (typeof options === "string") {
            options = { namespace: options }
        }

        var subDb = db.sublevel(options.namespace)
        return EventedRepository(subDb, options)
    }

    function getByPrimaryKey(key, callback) {
        db.get(key, function (err, record) {
            if (err && err.notFound) {
                return callback(null, null)
            }

            if (err) {
                return callback(err)
            }

            callback(null, decoder(record))
        })
    }

    function getAll(callback) {
        var list = []
        var stream = db.createReadStream()

        stream
            .on("data", onData)
            .once("error", callback)
            .once("end", function onEnd() {
                stream.removeListener("data", onData)

                callback(null, list)
            })

        function onData(chunk) {
            var record = decoder(chunk.value)

            list.push(record)
        }
    }

    function getFor(key, value, callback) {
        var list = []
        var stream = db.createReadStream()

        stream
            .on("data", onData)
            .once("error", callback)
            .once("end", function onEnd() {
                stream.removeListener("data", onData)

                callback(null, list)
            })

        function onData(chunk) {
            var record = decoder(chunk.value)

            if (record[key] === value) {
                list.push(record)
            }
        }
    }

    function getBy(key, value, callback) {
        if (indexes.indexOf(key) === -1) {
            return callback(NO_INDEX(key))
        }

        var list = []
        var stream = indexDbs[key].createReadStream({
            start: value + "~",
            end: value + "~~"
        })

        stream
            .on("data", onData)
            .once("error", callback)
            .once("end", function onEnd() {
                stream.removeListener("data", onData)

                callback(null, list)
            })

        function onData(chunk) {
            var record = decoder(chunk.value)

            list.push(record)
        }
    }
}

function identity(x) { return x }
function noop() {}
