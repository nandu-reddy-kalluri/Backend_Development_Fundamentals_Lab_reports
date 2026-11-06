const express = require('express')
const {open} = require('sqlite')
const path = require('path')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'database.db')
let db = null

// Initialize database and start server
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    const PORT = process.env.PORT || 3000
    app.listen(PORT, () => {
      console.log(`Lecture server running at http://localhost:${PORT}/`)
    })
  } catch (error) {
    console.log(`Database Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

// API 1: List all books
app.get('/books', async (request, response) => {
  try {
    const query = `
      SELECT *
      FROM book;
    `
    const books = await db.all(query)
    response.status(200).json(books)
  } catch (error) {
    response.status(500).json({error: error.message})
  }
})

// API 2 (VULNERABLE ROUTE): Demonstrates SQL Injection
// Warning: For classroom demonstration only! Uses string interpolation.
app.get('/books/vulnerable/:bookId', async (request, response) => {
  try {
    const {bookId} = request.params

    // VULNERABLE: Direct string interpolation into query
    const query = `
      SELECT *
      FROM book
      WHERE id = ${bookId};
    `

    console.log(`[Vulnerable Query Executed]: ${query.trim()}`)

    // db.all is used so multiple books return if OR 1=1 is injected
    const books = await db.all(query)
    response.status(200).json(books)
  } catch (error) {
    response.status(500).json({
      error: 'SQL Execution Error',
      details: error.message,
    })
  }
})

// API 3 (SECURE ROUTE): Prevents SQL Injection using parameterized query
app.get('/books/:bookId', async (request, response) => {
  try {
    const {bookId} = request.params

    // SECURE: Uses '?' placeholder
    const query = `
      SELECT *
      FROM book
      WHERE id = ?;
    `

    const book = await db.get(query, [bookId])

    if (book === undefined) {
      return response.status(404).json({error: 'Book Not Found'})
    }

    response.status(200).json(book)
  } catch (error) {
    response.status(500).json({error: error.message})
  }
})

module.exports = app
