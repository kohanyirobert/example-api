import express from 'express'
import pgPromise from 'pg-promise'
import pgConnectionString from 'pg-connection-string'
import { exit } from 'node:process'

for (const key of ['HOST', 'PORT', 'PG_URL', 'EC2_HOSTNAME']) {
  if (process.env[key]) {
    console.log(`${key}: ${process.env[key]}`)
  } else {
    console.error(`${key}: ${process.env[key]}, must be set`)
    exit(-1)
  }
}

const pgp = pgPromise()
const config = pgConnectionString.parse(process.env.PG_URL)
console.log('Config:', config)
const db = pgp(config)

const app = express()
app.use(express.json())

app.use((req, res, next) => {
  if (process.env.EC2_HOSTNAME) {
    res.setHeader('X-EC2-Hostname', process.env.EC2_HOSTNAME)
  }
  next()
})

app.get('/api/cars', async (req, res) => {
  try {
    console.log('GET /api/cars')
    const cars = await db.any('SELECT * FROM car')
    console.log('Result:', cars)
    res.json(cars)
  } catch (e) {
    console.error(e)
    res.status(500).send(e)
  }
})

app.post("/api/cars", async (req, res) => {
  try {
    console.log('POST /api/cars', req.body)
    const { id } = await db.one('INSERT INTO car (manufacturer, model) VALUES ($1, $2) RETURNING id', [
      req.body.manufacturer,
      req.body.model
    ])
    const car = { id, ...req.body }
    console.log('Result:', car)
    res.json(car)
  } catch (e) {
    console.error(e)
    res.status(500).send(e)
  }
})

app.delete("/api/cars/:id", async (req, res) => {
  try {
    console.log(`DELETE /api/cars/${req.params.id}`)
    await db.none('DELETE FROM car WHERE id = $1', [+req.params.id])
    res.send()
  } catch (e) {
    console.error(e)
    res.status(500).send(e)
  }
})

app.listen(process.env.PORT, process.env.HOST, () => console.log(`Listening on ${process.env.HOST}:${process.env.PORT}`))
