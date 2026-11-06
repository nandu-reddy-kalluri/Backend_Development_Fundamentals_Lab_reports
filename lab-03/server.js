const express = require('express')
const { open } = require('sqlite')
const path = require('path')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'database.db')
let db = null

// Initialize Database and Server
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

// API 1: GET /books - Search, filter, sort & pagination via query params
app.get('/books', async (request, response) => {
  try {
    const {
      search_q = '',
      order_by = 'id',
      order = 'ASC',
      limit = 10,
      offset = 0,
      min_price = 0,
      max_price = 1000000,
    } = request.query

    // Whitelist valid columns to prevent SQL injection in ORDER BY
    const allowedColumns = ['id', 'title', 'author', 'price', 'pages']
    const safeOrderBy = allowedColumns.includes(order_by) ? order_by : 'id'
    const safeOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'

    const getBooksQuery = `
      SELECT *
      FROM book
      WHERE title LIKE ?
        AND price >= ?
        AND price <= ?
      ORDER BY ${safeOrderBy} ${safeOrder}
      LIMIT ? OFFSET ?;
    `

    const books = await db.all(getBooksQuery, [
      `%${search_q}%`,
      Number(min_price),
      Number(max_price),
      Number(limit),
      Number(offset),
    ])

    response.status(200).json(books)
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

// API 2: GET /books/:bookId - Get a single book
app.get('/books/:bookId', async (request, response) => {
  try {
    const { bookId } = request.params

    const getBookQuery = `
      SELECT *
      FROM book
      WHERE id = ?;
    `

    const book = await db.get(getBookQuery, [bookId])

    if (book === undefined) {
      response.status(404).json({ error: 'Book Not Found' })
    } else {
      response.status(200).json(book)
    }
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

// API 3: POST /books - Add a book with input validation
app.post('/books', async (request, response) => {
  try {
    const { title, author, price, pages } = request.body

    // Reject missing or empty title
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return response.status(400).json({ error: 'Invalid or missing title' })
    }

    // Reject missing or empty author
    if (!author || typeof author !== 'string' || author.trim() === '') {
      return response.status(400).json({ error: 'Invalid or missing author' })
    }

    // Reject non-numeric or missing price
    if (price === undefined || price === null || isNaN(Number(price))) {
      return response.status(400).json({ error: 'Price must be a valid number' })
    }

    // Reject non-numeric or missing pages
    if (pages === undefined || pages === null || isNaN(Number(pages))) {
      return response.status(400).json({ error: 'Pages must be a valid number' })
    }

    const addBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `

    const result = await db.run(addBookQuery, [
      title.trim(),
      author.trim(),
      Number(price),
      Number(pages),
    ])

    response.status(201).json({
      message: 'Book Added Successfully',
      bookId: result.lastID,
    })
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

// API 4: PUT /books/:bookId - Update a book
app.put('/books/:bookId', async (request, response) => {
  try {
    const { bookId } = request.params
    const { title, author, price, pages } = request.body

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return response.status(400).json({ error: 'Invalid or missing title' })
    }
    if (!author || typeof author !== 'string' || author.trim() === '') {
      return response.status(400).json({ error: 'Invalid or missing author' })
    }
    if (price === undefined || isNaN(Number(price))) {
      return response.status(400).json({ error: 'Price must be a valid number' })
    }
    if (pages === undefined || isNaN(Number(pages))) {
      return response.status(400).json({ error: 'Pages must be a valid number' })
    }

    const updateBookQuery = `
      UPDATE book
      SET title = ?,
          author = ?,
          price = ?,
          pages = ?
      WHERE id = ?;
    `

    const result = await db.run(updateBookQuery, [
      title.trim(),
      author.trim(),
      Number(price),
      Number(pages),
      bookId,
    ])

    if (result.changes === 0) {
      response.status(404).json({ error: 'Book Not Found' })
    } else {
      response.status(200).json({ message: 'Book Details Updated' })
    }
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

// API 5: DELETE /books/:bookId - Delete a book
app.delete('/books/:bookId', async (request, response) => {
  try {
    const { bookId } = request.params

    const deleteBookQuery = `
      DELETE FROM book
      WHERE id = ?;
    `

    const result = await db.run(deleteBookQuery, [bookId])

    if (result.changes === 0) {
      response.status(404).json({ error: 'Book Not Found' })
    } else {
      response.status(200).json({ message: 'Book Removed' })
    }
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

module.exports = app
