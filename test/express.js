'use strict'

const request = require('supertest')

const express = require('express')
const RateLimit = require('../src')
const Redis = require('redis')
const redis = Redis.createClient()

const infinityLimiter = RateLimit({
    type: 'express',
    max: Number.MAX_SAFE_INTEGER,
    duration: 1000 * 30,
    cache: redis
})

const rateLimiter = RateLimit({
    type: 'express',
    max: 10,
    duration: 1000 * 30,
    cache: redis
})

const rateLimiterOnce = RateLimit({
    type: 'express',
    max: 10,
    duration: 1000 * 30,
    cache: redis
})

const memCacheRateLimiter = RateLimit({
    type: 'express',
    max: 10,
    duration: 1000 * 30
})

const memCacheRateLimiterOnce = RateLimit({
    type: 'express',
    max: 10,
    duration: 1000 * 30
})

const memCacheInfinityRateLimiter = RateLimit({
    type: 'express',
    max: Number.MAX_SAFE_INTEGER,
    duration: 1000 * 30
})

const app = express()

const config = {
    port: 3000
}

const data = {
    data: {
        message: '11111111'
    },
    list: Array.from({ length: 10000 }).map((t, i) => i)
}

function sender (req, res) {
    res.send(data)
}

app.get('/api1', infinityLimiter, sender)
app.get('/api2', rateLimiter, sender)
app.get('/redis-once', rateLimiterOnce, sender)


app.get('/mem-once', memCacheRateLimiterOnce, sender)

app.get('/api3', memCacheRateLimiter, sender)
app.get('/api4', memCacheInfinityRateLimiter, sender)

app.listen(config.port)

process.on('exit', function () {
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

describe('# Express memCacheRateLimiter', function () {
    it('rate onece', function (done) {
        request(app)
            .get('/mem-once')
            .expect(200, (err, res) => {
                if (err) throw err
                done()
            })
    })

    it('rate mutli', function (done) {
        const queue = Array.from({ length: 10 }).map(() => viewCheck(app, '/api3', 200))

        Promise.all(queue)
            .then(() => {
                return viewCheck(app, '/api3', 409)
            })
            .then(done)
            .catch(err => {
                console.log(err)
                throw err
                done()
            })
    })

    it('rate 1000', function (done) {
        this.timeout(20 * 1000) 
        const queue = Array.from({ length: 1000 }).map(() => viewCheck(app, '/api4', 200))

        Promise.all(queue)
            .then(() => done())
            .catch(err => {
                throw err
                done()
            })
    })
})

describe('# Express redisRateLimiter', function () {
    it('rate onece', function (done) {
        request(app)
            .get('/redis-once')
            .expect(200, (err, res) => {
                if (err) throw err
                done()
            })
    })

    it('rate mutli', function (done) {
        const queue = Array.from({ length: 10 }).map(() => viewCheck(app, '/api2', 200))

        Promise.all(queue)
            .then(() => {
                return viewCheck(app, '/api2', 409)
            })
            .then(done)
            .catch(err => {
                throw err
                done()
            })
    })

    it('rate 1000', function (done) {
        this.timeout(10 * 1000) 
        const queue = Array.from({ length: 1000 }).map(() => viewCheck(app, '/api1', 200))

        Promise.all(queue)
            .then(() => done())
            .catch(err => {
                console.log(err)
                throw err
                done()
            })
    })
})
