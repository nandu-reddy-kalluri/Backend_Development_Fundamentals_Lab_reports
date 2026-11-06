# Lecture: SQL Injection Demonstration & Prevention in Node.js / Express

## Student Details

- **Student Name:** Nanda Kishore
- **Registration Number:** N25H03A1322
- **Section:** CSE GEN AI (2C)
- **Course:** Backend Development Fundamentals
- **Academic Term:** Year II – Term II
- **Faculty:** Joel Prashanth D

---

## Overview & Presentation

This folder contains the practical implementation and lecture presentation explaining **SQL Injection (SQLi)** vulnerabilities and their prevention using parameterized queries in SQLite and Express.js.

- **Presentation Slides:** [`book_sql_injection_3_slides.pptx`](./book_sql_injection_3_slides.pptx)

---

## Project Structure

```text
student lecture/
├── book_sql_injection_3_slides.pptx  # 3-slide presentation on SQL Injection
├── server.js                         # Express server demonstrating route queries
├── database.db                       # SQLite database file containing the book table
├── seed.sql                          # Schema creation & initial 10 records
├── package.json                      # Project metadata & start script
├── package-lock.json                 # Lockfile
└── README.md                         # Detailed lecture guide & demonstration steps
```

---

## 1. What is SQL Injection (SQLi)?

SQL Injection is a web security vulnerability that allows an attacker to interfere with the queries that an application makes to its database. It occurs when untrusted user input is directly concatenated or interpolated into an SQL query string instead of being treated strictly as data.

### Vulnerable Code Example (String Interpolation)

```javascript
app.get('/books/:bookId', async (request, response) => {
  const { bookId } = request.params

  // VULNERABLE: Direct template literal interpolation
  const query = `
    SELECT *
    FROM book
    WHERE id = ${bookId};
  `

  const books = await db.all(query)
  response.send(books)
})
```

---

## 2. How the Attack Works (The Exploit)

### Scenario A: Normal Usage
- Request: `GET /books/1`
- Executed SQL:
  ```sql
  SELECT * FROM book WHERE id = 1;
  ```
- Result: Returns only book with `id = 1`.

### Scenario B: Attacker Injects `1 OR 1=1`
- Request: `GET /books/1 OR 1=1` (or URL-encoded `http://localhost:3000/books/1%20OR%201=1`)
- Executed SQL:
  ```sql
  SELECT * FROM book WHERE id = 1 OR 1=1;
  ```
- **Consequence:** Because `1=1` is always `TRUE`, the `WHERE` condition matches every single row in the table. The attacker successfully dumps the entire database, bypassing single-record restrictions!

---

## 3. How to Prevent SQL Injection (The Solution)

SQL Injection is neutralized by using **Parameterized Queries** (Prepared Statements). The database engine compiles the query structure first, and treats user inputs strictly as literal values, never as executable SQL commands.

### Secure Code Example (Positional Parameter `?`)

```javascript
app.get('/books/:bookId', async (request, response) => {
  const { bookId } = request.params

  // SECURE: Uses '?' placeholder
  const query = `
    SELECT *
    FROM book
    WHERE id = ?;
  `

  // bookId is safely passed in the params array
  const book = await db.get(query, [bookId])

  if (book === undefined) {
    return response.status(404).send('Book Not Found')
  }

  response.status(200).send(book)
})
```

When an attacker passes `1 OR 1=1` to the parameterized query, SQLite looks for a book whose `id` column literally equals the string `"1 OR 1=1"`. Finding none, it safely returns `404 Not Found` without executing the `OR` logic.

---

## 4. Running the Demo

1. Open a terminal in this directory:
   ```powershell
   cd "c:\Users\nandu\Desktop\express\student lecture"
   ```
2. Start the server:
   ```powershell
   npm start
   ```
   *(or `node server.js`)*
3. Test in your browser:
   - Normal ID: `http://localhost:3000/books/1`
   - SQLi Payload: `http://localhost:3000/books/1 OR 1=1`
