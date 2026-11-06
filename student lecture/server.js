
const express = require('express')
const { open } = require('sqlite')
const path = require('path')
const sqlite3 = require('sqlite3')

const app = express()

const dbPath = path.join(__dirname, 'database.db')
let db = null

app.get('/books/:bookId', async (request, response) => {
  const { bookId } = request.params;
  const query = `select * from book where id= `
  const answer = await db.all(query, [bookId])
  response.send(answer)
})

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server running on port 3000')
    })
  } catch (error) {
    console.log(`Database Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()
