const Koa = require('koa')

const RateLimit = require('../src')

const Redis = require('ioredis')
const redis = new Redis()

const app = new Koa()

const rateLimiter = RateLimit({
    type: 'koa',
    max: Number.MAX_SAFE_INTEGER,
    duration: 1000 * 10,
    key () {
        return Math.floor(Math.random() * 200)
    },
    cache: redis
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

app.use(rateLimiter)

app.use(sender)

app.listen(3001)
