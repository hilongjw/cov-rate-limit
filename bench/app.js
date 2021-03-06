const express = require('express')
const RateLimit = require('../src')
const Redis = require('redis')
const redis = Redis.createClient()

const cache = LRU({ max: 1024 * 1024 * 50 })

const rateLimiter = RateLimit({
    type: 'express',
    max: Number.MAX_SAFE_INTEGER,
    duration: 1000 * 10,
    // key (req) {
    //     return Math.floor(Math.random() * 200)
    // },
    cache: redis
})

const app = express()

const config = {
    port: 3000
}

app.set('trust proxy', 1)

const data = {
    data: {
        message: '11111111'
    },
    list: Array.from({ length: 10000 }).map((t, i) => i)
}

function sender (req, res) {
    res.send(data)
}

app.get('/api1', rateLimiter, sender)

app.get('/api3', sender)

app.listen(config.port, () => {
    console.log('App running at ', config.port)
})