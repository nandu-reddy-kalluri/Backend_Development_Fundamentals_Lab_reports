# Lab 3: REST API, Query Parameters, Validation and Debugging

## Student Details

- **Student Name:** Nanda Kishore
- **Registration Number:** N25H03A1322
- **Section:** CSE GEN AI (2C)
- **Course:** Backend Development Fundamentals
- **Academic Term:** Year II – Term II
- **Faculty:** Joel Prashanth D

---

## Objective

To build an Express.js server connected to a SQLite database (`database.db`) that demonstrates:
1. RESTful resource naming (`/books` and `/books/:bookId`).
2. Search, price range filtering, dynamic sorting, and pagination via query parameters (`search_q`, `min_price`, `max_price`, `order_by`, `order`, `limit`, `offset`).
3. Strict HTTP request body validation on `POST /books` (rejecting missing title/author and non-numeric price/pages with `400 Bad Request`).
4. Correct HTTP status codes (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`) with consistent JSON responses.
5. In-depth understanding and practical solutions for 4 common backend debugging exercises (`EADDRINUSE`, import paths, missing table, and unawaited async promises).

---

## Technologies and Packages Used

- **Node.js** (v24.14.1) — JavaScript runtime environment
- **Express.js** (`express` v4.21.2) — Fast, unopinionated routing framework
- **SQLite3** (`sqlite3` v5.1.7) — Embedded relational database driver
- **SQLite Wrapper** (`sqlite` v5.1.1) — Promise-based SQLite library supporting `async/await`
- **Nodemon** (`nodemon` v3.1.9) — Development monitor for automatic server restarts

---

## Project Structure

```text
lab-03/
├── server.js            # Express server with query filtering & input validation
├── database.db          # Persistent SQLite database containing the book table
├── seed.sql             # SQL schema and 10 initial sample records
├── package.json         # Project metadata and start script
├── package-lock.json    # Dependency lockfile
├── .gitignore           # Excludes node_modules/ and .env
├── README.md            # Lab documentation, API guide & debugging solutions
└── screenshots/         # Verified endpoint test results
```

---

## Database Schema: `book`

The SQLite database file is `database.db`.

```sql
CREATE TABLE IF NOT EXISTS book (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    price INTEGER NOT NULL,
    pages INTEGER NOT NULL
);
```

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique ID for each book |
| `title` | TEXT | NOT NULL | Book title |
| `author` | TEXT | NOT NULL | Author name |
| `price` | INTEGER | NOT NULL | Book price in USD |
| `pages` | INTEGER | NOT NULL | Total page count |

---

## Installation & Running the Server

### 1. Install Dependencies
Open a terminal inside the `lab-03/` directory:
```powershell
cd c:\Users\nandu\Desktop\express\lab-03
npm install
```

### 2. Start the Server
```powershell
npm start
```
Server runs at `http://localhost:3000/`.

---

## REST Endpoints & Query Parameters

### 1. GET `/books` — Advanced Filtering, Sorting & Pagination

All query parameters are optional and have safe default values:

| Parameter | Type | Default | Description | Example |
|---|---|---|---|---|
| `search_q` | String | `""` | Partial title search using SQL `LIKE ?` | `/books?search_q=Clean` |
| `min_price`| Number | `0` | Minimum book price filter (`price >= ?`) | `/books?min_price=30` |
| `max_price`| Number | `1000000` | Maximum book price filter (`price <= ?`) | `/books?max_price=50` |
| `order_by` | String | `'id'` | Sorting column (`id`, `title`, `author`, `price`, `pages`) | `/books?order_by=price` |
| `order` | String | `'ASC'` | Sort direction (`ASC` or `DESC`) | `/books?order=DESC` |
| `limit` | Number | `10` | Maximum number of records to return | `/books?limit=5` |
| `offset` | Number | `0` | Number of records to skip for pagination | `/books?offset=5` |

#### Combined Query URL:
```text
http://localhost:3000/books?search_q=Design&min_price=30&max_price=60&order_by=price&order=DESC&limit=5&offset=0
```

---

### 2. POST `/books` — Body Validation

Inserts a new book only after validating that all required fields are present and valid:
- **Title:** Required, non-empty string.
- **Author:** Required, non-empty string.
- **Price:** Required, valid number.
- **Pages:** Required, valid number.

#### Valid Request:
- **Method:** `POST`
- **URL:** `http://localhost:3000/books`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "title": "Clean Architecture",
    "author": "Robert C. Martin",
    "price": 45,
    "pages": 432
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "message": "Book Added Successfully",
    "bookId": 11
  }
  ```

#### Invalid Request (e.g., missing title or invalid price):
- **Body:**
  ```json
  {
    "author": "Robert C. Martin",
    "price": "free"
  }
  ```
- **Response (400 Bad Request):**
  ```json
  {
    "error": "Invalid or missing title"
  }
  ```

---

### 3. GET `/books/:bookId` — Retrieve Single Book
- **URL:** `http://localhost:3000/books/1`
- **Response (200 OK):**
  ```json
  {
    "id": 1,
    "title": "The Pragmatic Programmer",
    "author": "Andrew Hunt & David Thomas",
    "price": 45,
    "pages": 352
  }
  ```
- **Non-Existent Book (`/books/999`):** Returns `404 Not Found` with:
  ```json
  {
    "error": "Book Not Found"
  }
  ```

---

### 4. PUT `/books/:bookId` — Update Book
- **Method:** `PUT`
- **URL:** `http://localhost:3000/books/1`
- **Body:**
  ```json
  {
    "title": "The Pragmatic Programmer: 20th Anniversary Edition",
    "author": "Andrew Hunt & David Thomas",
    "price": 50,
    "pages": 360
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "Book Details Updated"
  }
  ```

---

### 5. DELETE `/books/:bookId` — Remove Book
- **Method:** `DELETE`
- **URL:** `http://localhost:3000/books/10`
- **Response (200 OK):**
  ```json
  {
    "message": "Book Removed"
  }
  ```

---

## 4 Debugging Exercises & Solutions

### Exercise 1: Port Conflict (`EADDRINUSE: address already in use :::3000`)
- **Problem:** Attempting to start the server fails with `Error: listen EADDRINUSE: address already in use :::3000`.
- **Cause:** Another terminal session or background process is already running Node on port 3000.
- **Solution:**
  1. Find the process: `netstat -ano | findstr :3000`
  2. Terminate the process in PowerShell:
     ```powershell
     Stop-Process -Name node -Force
     ```
  3. Or start on a different port using an environment variable:
     ```powershell
     $env:PORT=4000; npm start
     ```

### Exercise 2: Incorrect Import Path (`Cannot find module`)
- **Problem:** `Error: Cannot find module './database.db'`.
- **Cause:** Hardcoding relative file paths without using Node's `path` module causes resolution errors when the terminal executes from different working directories.
- **Solution:** Always resolve paths using `path.join(__dirname, 'database.db')`:
  ```javascript
  const path = require('path')
  const dbPath = path.join(__dirname, 'database.db')
  ```

### Exercise 3: SQLite `SQLITE_ERROR: no such table: book`
- **Problem:** Database queries throw `no such table: book`.
- **Cause:** Connecting to a newly created empty SQLite file before the table schema is created.
- **Solution:** Execute schema creation with `CREATE TABLE IF NOT EXISTS` via `seed.sql` before querying.

### Exercise 4: Missing `await` Keyword
- **Problem:** `response.send(books)` sends an empty object `{}` or crashes.
- **Cause:** Asynchronous database methods return a `Promise`. Forgetting `await` passes the pending Promise instead of the resolved data:
  ```javascript
  // Buggy:
  const books = db.all(query) // Missing await! books is a Promise, not array.
  response.send(books)

  // Correct:
  const books = await db.all(query)
  response.send(books)
  ```

---

## Security: SQL Injection Prevention

1. **WHERE Clauses:** All user-supplied inputs (`search_q`, `min_price`, `max_price`, `bookId`) are bound using parameterized `?` placeholders. User input is never concatenated into SQL strings.
2. **Dynamic ORDER BY Protection:** Because column names cannot be parameterized in SQL with `?`, `order_by` is verified against an explicit whitelist of allowed columns (`['id', 'title', 'author', 'price', 'pages']`) before executing.
