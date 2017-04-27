function Cache (duration) {
    this.duration = duration
    this.cache = {}

    this.incr = function (key, cb) {
        if (this.cache[key]) {
            this.cache[key]++
        } else {
            this.cache[key] = 1
        }

        cb(null, this.cache[key])
    }

    this.clearAll = function () {
        this.cache = {}
    }

    this.worker = function () {
        this.timer = setInterval(this.clearAll, this.duration).unref()
    }

    this.stop = function () {
        clearInterval(this.timer)
    }

    this.worker()
}

module.exports = Cache