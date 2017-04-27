'use strict'

const request = require('supertest')

const Koa = require('koa')
const RateLimit = require('../src')
const Redis = require('redis')
const redis = Redis.createClient()

const app = new Koa()
const router = require('koa-router')()

app.use(router.routes())
app.use(router.allowedMethods())

const infinityLimiter = RateLimit({
    type: 'koa',
    max: Number.MAX_SAFE_INTEGER,
    duration: 1000 * 30,
    cache: redis
})

const rateLimiter = RateLimit({
    type: 'koa',
    max: 10,
    duration: 1000 * 30,
    cache: redis
})

const memCacheRateLimiter = RateLimit({
    type: 'koa',
    max: 10,
    duration: 1000 * 30
})

const memCacheRateLimiterMutli = RateLimit({
    type: 'koa',
    max: 10,
    duration: 1000 * 30
})

const memCacheInfinityRateLimiter = RateLimit({
    type: 'koa',
    max: Number.MAX_SAFE_INTEGER,
    duration: 1000 * 30
})

const data = {
    data: {
        message: '11111111'
    },
    list: Array.from({ length: 10000 }).map((t, i) => i)
}

function sender (ctx) {
    ctx.body = data
}

router.get('/api1', infinityLimiter, sender)
router.get('/api2', rateLimiter, sender)

router.get('/api3', memCacheRateLimiter, sender)
router.get('/api5', memCacheRateLimiterMutli, sender)
router.get('/api4', memCacheInfinityRateLimiter, sender)

const server = app.listen(3001)

process.on('exit', function () {
    console.log('text on exit')
    redis.end(true)
})

function viewCheck (app, api, status) {
    return new Promise((resolve, reject) => {
        request(app)
            .get(api)
            .expect(status, (err, res) => {
                if (err) reject(err)
                resolve()
            })
    })
}

describe('# Koa memCacheRateLimiter', function () {
    it('rate onece', function (done) {
        request(server)
            .get('/api3')
            .expect(200, (err, res) => {
                if (err) throw err
                done()
            })
    })

    it('rate mutli', function (done) {
        const queue = Array.from({ length: 10 }).map(() => viewCheck(server, '/api5', 200))

        Promise.all(queue)
            .then(() => {
                return viewCheck(server, '/api5', 409)
            })
            .then(() => done())
            .catch(err => {
                console.log(err)
                throw err
                done()
            })
    })
})

describe('# Koa redisRateLimiter', function () {
    it('rate onece', function (done) {
        request(server)
            .get('/api2')
            .expect(200, (err, res) => {
                if (err) throw err
                done()
            })
    })

    it('rate mutli', function (done) {
        const queue = Array.from({ length: 9 }).map(() => viewCheck(server, '/api2', 200))

        Promise.all(queue)
            .then(() => {
                return viewCheck(server, '/api2', 409)
            })
            .then(() => done())
            .catch(err => {
                throw err
                done()
            })
    })
})
