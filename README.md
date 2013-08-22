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
