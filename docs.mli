type EventedRepository<T> := {
    store: (Array<T>, Callback<Array<T>>),
    update: (id: String, delta: Object, Callback<T>),
    remove: (id: String, Callback<void>),
    drop: (Callback<void>),
    sub: (opts: String | Object) => EventedRepository<X>,

    getById: (id: String, Callback<T>),
    getAll: (Callback<Array<T>>),
    getFor: (key: String, value: Any, Callback<Array<T>>),
    getBy: (key: String, value: Any, Callback<Array<T>>)
}

evented-repository/mongo := (MongoDB, String | {
    namespace: String,
    missingCallback: (err) => void,
    encoder: (item: T) => dataItem: S,
    decoder: (dataItem: S) => item: T
    primaryKey: "id",
    indexes: Array<String>
})
