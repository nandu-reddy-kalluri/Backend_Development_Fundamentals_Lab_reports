const express = require('express')
const {open} = require('sqlite')
const path = require('path')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'seedShareGarden.db')
let db = null

// Initialize Database and Server
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    // Create Gardeners Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS gardeners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE
      );
    `)

    // Create Plots Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS plots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL COLLATE NOCASE UNIQUE,
        soil_type TEXT NOT NULL,
        size_sq_m REAL NOT NULL
      );
    `)

    // Create Leases Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS leases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        gardener_id INTEGER,
        plot_id INTEGER,
        start_date TEXT,
        end_date TEXT,
        FOREIGN KEY (gardener_id) REFERENCES gardeners(id),
        FOREIGN KEY (plot_id) REFERENCES plots(id)
      );
    `)

    // Insert Sample Gardeners
    await db.run(`
      INSERT OR IGNORE INTO gardeners (id, name, email)
      VALUES
      (1, 'Asha Rao', 'asha@gmail.com'),
      (2, 'Rahul Kumar', 'rahul@gmail.com')
    `)

    // Insert Sample Plots
    await db.run(`
      INSERT OR IGNORE INTO plots (id, name, soil_type, size_sq_m)
      VALUES
      (1, 'Plot 1', 'Loamy', 20),
      (2, 'Plot 2', 'Clay', 15),
      (3, 'Plot 3', 'Sandy', 25)
    `)

    // Insert Sample Leases
    await db.run(`
      INSERT OR IGNORE INTO leases
      (id, gardener_id, plot_id, start_date, end_date)
      VALUES
      (1, 1, 1, '2026-11-01', NULL),
      (2, 2, 2, '2026-11-02', NULL)
    `)

    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

// API 1: Get All Gardeners
app.get('/gardeners/', async (request, response) => {
  const getGardenersQuery = `
    SELECT * FROM gardeners;
  `
  const gardeners = await db.all(getGardenersQuery)
  response.send(gardeners)
})

// API 2: Get One Gardener
app.get('/gardeners/:gardenerId/', async (request, response) => {
  const {gardenerId} = request.params

  const getGardenerQuery = `
    SELECT * FROM gardeners
    WHERE id = ?;
  `
  const gardener = await db.get(getGardenerQuery, [gardenerId])

  if (gardener === undefined) {
    response.status(404).send('Gardener Not Found')
  } else {
    response.send(gardener)
  }
})

// API 3: Get All Plots and Search by Soil Type
app.get('/plots/', async (request, response) => {
  const {soil_type = ''} = request.query

  const getPlotsQuery = `
    SELECT * FROM plots
    WHERE soil_type LIKE ?;
  `

  const plots = await db.all(getPlotsQuery, [`%${soil_type}%`])
  response.send(plots)
})

// API 4: Get One Plot
app.get('/plots/:plotId/', async (request, response) => {
  const {plotId} = request.params

  const getPlotQuery = `
    SELECT * FROM plots
    WHERE id = ?;
  `
  const plot = await db.get(getPlotQuery, [plotId])

  if (plot === undefined) {
    response.status(404).send('Plot Not Found')
  } else {
    response.send(plot)
  }
})

// API 5: Add a New Plot
app.post('/plots/', async (request, response) => {
  const {name, soil_type, size_sq_m} = request.body

  if (
    !name ||
    !name.trim() ||
    !soil_type ||
    !soil_type.trim() ||
    !Number.isFinite(Number(size_sq_m)) ||
    Number(size_sq_m) <= 0
  ) {
    response.status(400).send('Invalid Plot Details')
    return
  }

  const checkPlotQuery = `
    SELECT * FROM plots
    WHERE name = ? COLLATE NOCASE;
  `
  const existingPlot = await db.get(checkPlotQuery, [name.trim()])

  if (existingPlot !== undefined) {
    response.status(409).send(`${existingPlot.name} already exists`)
    return
  }

  const addPlotQuery = `
    INSERT INTO plots (name, soil_type, size_sq_m)
    VALUES (?, ?, ?);
  `

  await db.run(addPlotQuery, [
    name.trim(),
    soil_type.trim(),
    Number(size_sq_m),
  ])

  response.status(201).send('Plot Successfully Added')
})

// API 6: Update a Plot
app.put('/plots/:plotId/', async (request, response) => {
  const {plotId} = request.params
  const {name, soil_type, size_sq_m} = request.body

  if (
    !name ||
    !name.trim() ||
    !soil_type ||
    !soil_type.trim() ||
    !Number.isFinite(Number(size_sq_m)) ||
    Number(size_sq_m) <= 0
  ) {
    response.status(400).send('Invalid Plot Details')
    return
  }

  const getPlotQuery = `
    SELECT * FROM plots
    WHERE id = ?;
  `
  const previousPlot = await db.get(getPlotQuery, [plotId])

  if (previousPlot === undefined) {
    response.status(404).send('Plot Not Found')
    return
  }

  const checkDuplicateQuery = `
    SELECT * FROM plots
    WHERE name = ? COLLATE NOCASE AND id != ?;
  `
  const duplicatePlot = await db.get(checkDuplicateQuery, [
    name.trim(),
    plotId,
  ])

  if (duplicatePlot !== undefined) {
    response.status(409).send(`${duplicatePlot.name} already exists`)
    return
  }

  const updatePlotQuery = `
    UPDATE plots
    SET name = ?, soil_type = ?, size_sq_m = ?
    WHERE id = ?;
  `

  await db.run(updatePlotQuery, [
    name.trim(),
    soil_type.trim(),
    Number(size_sq_m),
    plotId,
  ])

  response.send('Plot Updated')
})

// API 7: Delete a Plot
app.delete('/plots/:plotId/', async (request, response) => {
  const {plotId} = request.params

  const getPlotQuery = `
    SELECT * FROM plots
    WHERE id = ?;
  `
  const plot = await db.get(getPlotQuery, [plotId])

  if (plot === undefined) {
    response.status(404).send('Plot Not Found')
    return
  }

  const deletePlotQuery = `
    DELETE FROM plots
    WHERE id = ?;
  `

  await db.run(deletePlotQuery, [plotId])
  response.send('Plot Deleted')
})

// API 8: Get Leases with Gardener and Plot Names
app.get('/leases/', async (request, response) => {
  const getLeasesQuery = `
    SELECT
      leases.id,
      gardeners.name AS gardener_name,
      plots.name AS plot_name,
      leases.start_date,
      leases.end_date
    FROM leases
    INNER JOIN gardeners
      ON leases.gardener_id = gardeners.id
    INNER JOIN plots
      ON leases.plot_id = plots.id;
  `

  const leases = await db.all(getLeasesQuery)
  response.send(leases)
})

module.exports = app
