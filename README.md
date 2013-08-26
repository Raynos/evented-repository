# evented-repository

<!--
    [![build status][1]][2]
    [![NPM version][3]][4]
    [![Coverage Status][5]][6]
    [![gemnasium Dependency Status][7]][8]
    [![Davis Dependency status][9]][10]
-->

<!-- [![browser support][11]][12] -->

Repository interface for noSQL database

## Example

```js
var EventedRepository = require("evented-repository/mongo")
var mongo = require("continuable-mongo")

var db = mongo("mongodb://localhost:27017/my_db")

var repo = EventedRepository(db, {
  namespace: "my-repo"
})

// do stuff
```

## Docs

A `Repository` is a data access interface with a shape like

```ocaml
type Repository<T> := {
    store: (Array<T>, Callback<Array<T>>),
    update: (id: String, delta: Object, Callback<T>),
    remove: (id: String, Callback<void>),
    drop: (Callback<void>),
    sub: (namespace: String, opts: Object) => Repository<X>,

    getById: (id: String, Callback<T>),
    getAll: (Callback<Array<T>>),
    getFor: (key: String, value: Any, Callback<Array<T>>),
    getBy: (key: String, value: Any, Callback<Array<T>>)
}
```

This module is an implementation of an `EventedRepository` which
  is the same as `Repository` with the addition that all mutative
  data operations are stored in an immutable event section. This
  is for purposes of history tracking.

### `namespace`

A `Repository` is created using a `db` instance and `namespace`.
  The repository will persists records in the `db` under the
  given `namespace`

### `primary key`

A `Repository` has a configurable `primary key`. This is referred
  to as `id` in the type definition above and defaults to the
  `id` property of the record being persisted in the database.

### `indexes`

**UnImplemented**

A `Repository` has an array of secondary index keys (`indexes`).
  These are the keys of properties of the record for which a
  secondary index exists in the repository. Each key in the
  `indexes` array is a valid argument to `getBy`.

Every `Repository` has a main index on the `primary key`

### `encoder()` and `decoder`

A `Repository` can have an encoder and decoder assigned to it.

The encoder will be called on every record that get's stored
  and on every record that gets updated before it's persisted
  into the database

The decoder will be called on every record that comes out of
  the database. Including the callbacks to `store()`, `remove()`
  and `update()`

The encoder and decoder are meant to be used as a way to add
  database specific formatting to the values you are persisting
  on the way into the database and to decode all values coming
  out of the database to ensure they have the correct shape as
  defined by your application.

### `Repository.store([record, ...], callback)`

`store()` should take an array of records to store into the
  repository. Each record get's passed through the optional
  `encoder` and each record will have it's `primary key` set to
  a `uuid()` if it's not set.

`store()` will call your callback with the array of records you
  have inserted, it passes these records through the optional
  `decoder`.

`store()` will create and persist an event that looks like

```js
{
  name: "record created",
  record: {{record}},
  id: {{recordPrimaryKey}},
  time: Number
}
```

### `Repository.update(id, delta, callback)`

`update()` takes an `id` for a record (the value of it's
  `primary key`) and a `delta` object. It will fetch the current
  value for the `id` and then extends that value by shallow
  copying properties from the `delta` object onto the current
  value. The new value extended with the properties of the
  `delta` object is then passed through the optional `encoder`
  function and persisted back into the database.

`update()` will fail with a `"not.found"` error if there is no
  record for the `id`

The `callback` will be called with the new extended value once
  the `update()` operation succeeds. This value is passed through
  the `decoder` function before the callback is called

`update()` will create and persist an event that looks like

```js
{
  name: "record updated",
  id: {{recordPrimaryKey}},
  delta: {{deltaToApply}},
  time: Number
}
```

### `Repository.remove(id, callback)`

`remove()` takes an `id` for a record (the value of it's
  `primary key`) and will remove the record with that `id` if it
  exists. If it doesn't exists then it does nothing.

`remove()` will create and persist an event that looks like

```js
{
  name: "record removed",
  id: {{recordPrimaryKey}},
  time: Number
}
```

### `Repository.drop(callback)`

`drop()` will remove all records in the `namespace`.

### `Repository.sub(options)`

`sub()` will create a sub repository. The `namespace` passed in
  through `options.namespace` will be prefixed with the current
  `namespace` of the repository.

Basically this allows you to do something like

```js
var repo = Repository(db, { namespace: "my-app" })
var users = repo.sub({ namespace: "users" })

var repo2 = Repository(db, { namespace: "other-app" })
var users2 = repo.sub({ namespace: "users" })
```

### `getById(id, callback)`

`getById()` allows you to query the repository for a record by
  it's `primary key`. The callback will get called with the
  record after it's passed through the optional `decoder`.

`getById()` only returns a single record (or `null` if no record
  exists for this id) and assumes that the records you are
  storing in the repository have a unique `primary key` per
  record.

`getById()` should be optimized by the main index.

### `getAll(callback)`

`getAll()` will return all the records in the repository. The
  callback will be called with all the records after they are
  passed through the optional `decoder`

### `getFor(key, value, callback)`

`getFor()` queries all the records in the repository and then
  filters them by records where the property `key` has a value
  that matches `value`.

The callback will get called with all the records that match
  the criteria after they are passed through the optional
  `decoder`.

`getFor()` is not optimized by an index.

### `getBy(key, value, callback)`

**UnImplemented**

`getBy()` queries the database for records where the property
  with `key` key has the value `value`. `getBy()` will use the
  secondary indexes configured on the `Repository`.

If the `key` is not in the `indexes` array then `getBy()` fails
  with a `"not.indexed"` error.

The callback will get called with the records taht match the
  criteria after they are passed through the optional `decoder`

`getBy()` is optimized by a secondary index.

## Installation

`npm install evented-repository`

## Contributors

 - Raynos

## MIT Licenced

  [1]: https://secure.travis-ci.org/Raynos/evented-repository.png
  [2]: https://travis-ci.org/Raynos/evented-repository
  [3]: https://badge.fury.io/js/evented-repository.png
  [4]: https://badge.fury.io/js/evented-repository
  [5]: https://coveralls.io/repos/Raynos/evented-repository/badge.png
  [6]: https://coveralls.io/r/Raynos/evented-repository
  [7]: https://gemnasium.com/Raynos/evented-repository.png
  [8]: https://gemnasium.com/Raynos/evented-repository
  [9]: https://david-dm.org/Raynos/evented-repository.png
  [10]: https://david-dm.org/Raynos/evented-repository
  [11]: https://ci.testling.com/Raynos/evented-repository.png
  [12]: https://ci.testling.com/Raynos/evented-repository
