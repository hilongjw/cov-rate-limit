#  Express Rate Limit

A lightweight Rate limiter middleware  for Express and Koa. Use to limit repeated requests to public APIs and/or endpoints such as password reset.

## Install

```sh
$ npm install --save cov-rate-limit
```

## Example

### Koa

```javascript
const Koa = require('koa')
const RateLimit = require('cov-rate-limit')

const app = new Koa()

const rateLimiter = RateLimit({
    type: 'koa',
    max: 100,
    duration: 1000 * 60 * 10,
    key (ctx) {
        return ctx.ip
    }
})

app.use(rateLimiter)

```

### Express

RateLimit with redis

```javascript
const express = require('express')
const RateLimit = require('cov-rate-limit')

const Redis = require('redis')
const redis = Redis.createClient()

const rateLimiter = RateLimit({
    type: 'express',
    max: 100,
    duration: 1000 * 60 * 10, // 10 min
    key (req) {
        return req.ip
    },
    cache: redis
})

const app = express()

app.set('trust proxy', 1)

const data = {
    data: {
        message: '11111111'
    },
    list: Array.from({ length: 10000 }).map((t, i) => i)
}

app.get('/api1', rateLimiter, (req, res) => {
    res.send(data)
})

```

## Options

```javascript
{
    type: 'koa' // 'express'
    CacheKey: 'C0V_RATE:',
    key (req) {
        return req.ip
    },
    max: 500, // max requests within duration [500]
    duration: 1000 * 60 * 15, // of limit in milliseconds [15 * 60 * 1000]
    setHeader: true,
    cache: redis // redis client [in memory cache]
    endSender (req, res) {},
    // endSender (ctx, next) {}
}
```


## License

MIT © [Awe](https://github.com/hilongjw)

inspiration by code [express-rate-limit](https://github.com/nfriedly/express-rate-limit)
