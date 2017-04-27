'use strict'
const Cache = require('./memcache')

const ERROR_MAP = {
    code: 409,
    message: 'Rate limit exceeded'
}

const _options = {
    CacheKey: 'C0V_RATE:',
    key (req) {
        return req.ip
    },
    max: 500,
    duration: 1000 * 60 * 15,
    setHeader: true
}

function asyncCacheStore (cache, life) {
    return {
        incr (key, cb) {
            cache.incr(key, (err, count) => {
                if (err) return cb(err)
                count = Number(count)
                if (count === 1) {
                    cache.expire(key, life)
                }
                cb(null, count)
            })
        }
    }
}

let lid = 0

const HeaderMap = {
    limit: 'X-RateLimit-Limit',
    remaining: 'X-RateLimit-Remaining'
}

class Limiter {
    constructor (options = {}) {
        this.lid = lid++
        this.options = Object.assign({}, _options, options)
        if (!options.cache) {
            this.cache = new Cache(this.options.duration)
        } else {
            this.cache = asyncCacheStore(options.cache, this.options.duration / 1000)
        }
    }

    static koaEndSender (ctx) {
        ctx.status = ERROR_MAP.code
        ctx.body = ERROR_MAP
    }

    static expEndSender (req, res) {
        res.status(ERROR_MAP.code).json(ERROR_MAP)
    }

    setHeader (res, count) {
        res.set(HeaderMap.limit, this.options.max)
        res.set(HeaderMap.remaining, Math.max(this.options.max - count, 0))
    }

    genKey (key) {
        return this.lid + ':' + this.options.CacheKey + key
    }

    increment (key) {
        return new Promise((resolve, reject) => {
            this.cache.incr(key, (err, count) => {
                if (err) return reject(err)
                resolve(count)
            })
        })
    }

    async koa (ctx, next) {
        const key = this.options.key(ctx)
        const cacheKey = this.genKey(key)

        const count = await this.increment(cacheKey)

        if (this.options.setHeader) {
            this.setHeader(ctx, count)
        }

        if (count > this.options.max) {
            this.options.endSender(ctx)
        } else {
            next()
        }
    }

    express (req, res, next) {
        const key = this.options.key(req)
        const cacheKey = this.genKey(key)

        this.increment(cacheKey)
            .then(count => {
                if (this.options.setHeader) {
                    this.setHeader(res, count)
                }

                if (count > this.options.max) {
                    this.options.endSender(req, res)
                } else {
                    next()
                }
            })
            .catch(err => {
                this.options.endSender(req, res)
            })
    }
}

module.exports = function (options) {
    if (!options.endSender) {
        if (options.type === 'express') {
            options.endSender = Limiter.expEndSender
        } else {
            options.endSender = Limiter.koaEndSender
        }
    }

    const limiter = new Limiter(options)

    if (options.type === 'express') {
        return limiter.express.bind(limiter)
    }

    return limiter.koa.bind(limiter)
}
