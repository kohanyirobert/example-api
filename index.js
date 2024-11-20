import os from 'node:os'
import express from 'express'
import pgPromise from 'pg-promise'
import pgConnectionString from 'pg-connection-string'

console.log('PORT:', process.env.PORT)

const pgp = pgPromise()
const config = pgConnectionString.parse(process.env.PG_URL)
console.log('PG_URL', process.env.PG_URL, config)
const db = pgp(config)

console.log('Hostname:', os.hostname())

const networkInterfaces = os.networkInterfaces()
for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName]
    for (const iface of interfaces) {
        if (iface.family === 'IPv4' && !iface.internal) {
            console.log(`IPv4: ${iface.address}`)
        }
    }
}

const app = express()
app.use(express.json())

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

app.listen(process.env.PORT, () => console.log('Listening on port', process.env.PORT))