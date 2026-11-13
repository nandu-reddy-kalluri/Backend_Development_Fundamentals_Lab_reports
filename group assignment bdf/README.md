# Group Assignment: SeedShare Garden Community Platform

## Course and Project Details

- **Course:** Backend Development Fundamentals (BDF)
- **Batch / Group ID:** JP-GAI2C-G02
- **Student Name:** Nanda Kishore
- **Registration Number:** N25H03A1322
- **Section:** CSE GEN AI (2C)
- **Academic Term:** Year II – Term II
- **Faculty:** Joel Prashanth D

---

## 1. Project Overview

**SeedShare Garden** is a community garden plot and lease management backend system built with **Express.js** and an embedded **SQLite** database (`seedShareGarden.db`).

The platform allows community administrators and gardeners to:
1. Manage gardener profiles and registrations.
2. Manage garden plots with area size, soil type classification, and strict case-insensitive unique naming.
3. Handle plot leases connecting gardeners to specific plots via relational foreign keys and `INNER JOIN` queries.
4. Prevent naming collisions (case-insensitive deduplication) on both creation (`POST`) and updates (`PUT`).

---

## 2. Technology Stack

- **Runtime:** Node.js (v24.x)
- **Web Framework:** Express.js (`express` v4.19.2)
- **Database Engine:** SQLite3 (`sqlite3` v5.1.7)
- **Promise Wrapper:** `sqlite` (v5.1.1) for asynchronous `async/await` query execution
- **Testing:** REST Client (`app.http`) & Postman / Browser

---

## 3. Database Schema

The database file `seedShareGarden.db` contains 3 relational tables:

```sql
-- 1. Gardeners Table
CREATE TABLE IF NOT EXISTS gardeners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

-- 2. Plots Table (Case-insensitive unique plot name)
CREATE TABLE IF NOT EXISTS plots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL COLLATE NOCASE UNIQUE,
    soil_type TEXT NOT NULL,
    size_sq_m REAL NOT NULL
);

-- 3. Leases Table (Relational Junction Table)
CREATE TABLE IF NOT EXISTS leases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gardener_id INTEGER,
    plot_id INTEGER,
    start_date TEXT,
    end_date TEXT,
    FOREIGN KEY (gardener_id) REFERENCES gardeners(id),
    FOREIGN KEY (plot_id) REFERENCES plots(id)
);
```

### Initial Seed Data:
- **Gardeners:** Asha Rao (`asha@gmail.com`), Rahul Kumar (`rahul@gmail.com`)
- **Plots:** Plot 1 (Loamy, 20 m²), Plot 2 (Clay, 15 m²), Plot 3 (Sandy, 25 m²)
- **Leases:** Asha Rao &rarr; Plot 1, Rahul Kumar &rarr; Plot 2

---

## 4. API Endpoints Specification

### Gardeners Endpoints

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/gardeners/` | Retrieve all registered gardeners | `200 OK` |
| `GET` | `/gardeners/:gardenerId/` | Retrieve a single gardener by ID | `200 OK` / `404 Not Found` |

---

### Plots Endpoints

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/plots/` | Retrieve all plots (supports `?soil_type=` filter) | `200 OK` |
| `GET` | `/plots/:plotId/` | Retrieve single plot details by ID | `200 OK` / `404 Not Found` |
| `POST` | `/plots/` | Add a new plot with case-insensitive uniqueness | `201 Created` / `400 Bad Request` / `409 Conflict` |
| `PUT` | `/plots/:plotId/` | Update plot details with duplicate detection | `200 OK` / `400 Bad Request` / `404 Not Found` / `409 Conflict` |
| `DELETE` | `/plots/:plotId/` | Delete a plot by ID | `200 OK` / `404 Not Found` |

---

### Leases Endpoints

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/leases/` | Retrieve all active and historic leases joined with gardener and plot details | `200 OK` |

#### Joined Lease Query:
```sql
SELECT
  leases.id,
  gardeners.name AS gardener_name,
  plots.name AS plot_name,
  leases.start_date,
  leases.end_date
FROM leases
INNER JOIN gardeners ON leases.gardener_id = gardeners.id
INNER JOIN plots ON leases.plot_id = plots.id;
```

---

## 5. Key Edge Cases & Assignment "Twist" Solutions

1. **Case-Insensitive Plot Name Uniqueness (Collision Prevention):**
   - Attempting to insert `"plot 9"` when `"Plot 9"` exists is rejected with **`409 Conflict`**:
     ```text
     Plot 9 already exists
     ```
   - Implemented via `COLLATE NOCASE` in SQLite and application-level case-insensitive duplicate checking.

2. **Self-Update Without False Collision:**
   - When updating `Plot 1` with its own existing name (`"Plot 1"`), the update query checks `WHERE name = ? COLLATE NOCASE AND id != ?`, ensuring an existing plot does not conflict with itself.

3. **Input Validation:**
   - Rejects empty, whitespace-only names/soil types or negative/zero plot sizes with **`400 Invalid Plot Details`**.

4. **Resource Not Found:**
   - Requesting non-existent resources (e.g. `GET /gardeners/999/` or `DELETE /plots/999/`) properly returns **`404`** (`Gardener Not Found` / `Plot Not Found`).

---

## 6. How to Run the Server

### 1. Install Dependencies
```powershell
cd "group assignment bdf"
npm install
```

### 2. Start the Server
```powershell
npm start
```
Server runs at `http://localhost:3000/`.

### 3. Test with REST Client / curl
All requests are ready to execute in [`app.http`](./app.http).

---

## 7. Screenshots & Verification

The output screenshots are saved in [`screenshots/`](./screenshots/):

### 1. Get One Specific Gardener (`GET /gardeners/1/`)
![Get Specific Gardener](screenshots/Get%20One%20Specific%20Gardener%20.png)

### 2. Get One Specific Plot (`GET /plots/1/`)
![Get Specific Plot](screenshots/Get%20One%20Specific%20Plot%20.png)

### 3. Resource Not Found Handling (`404 Not Found`)
![Page Not Found](screenshots/page%20not%20found.png)
