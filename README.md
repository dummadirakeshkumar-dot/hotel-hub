# HostelHub – Room Allotment Management API

HostelHub replaces paper-based room availability tracking with a REST API built using Node.js, Express and SQLite.

## 1. Features

- Residents, rooms and allotments stored in three related SQLite tables.
- Room CRUD: get all, get one, add, update and delete.
- Room search using `?block=A`; optional status filtering.
- Allotment JOIN endpoint returns resident and room names.
- Input validation with clear error messages and HTTP status codes.
- Top Three endpoint counts historical allotments per room, sorts by count descending and breaks ties alphabetically.
- Automated tests for the required three twist cases.

## 2. Requirements

- Node.js 18 or later
- VS Code
- Postman, or the REST Client VS Code extension for `requests.http`

## 3. Install and run on Windows

Open the project folder in VS Code. Select Terminal → New Terminal.

```powershell
npm install
npm run seed
npm start
```

The server starts at `http://localhost:3000`.

For automatic restart while editing:

```powershell
npm run dev
```

## 4. Database tables

- `residents`: resident identity and contact information.
- `rooms`: room name, block and status (`available`, `occupied`, `maintenance`).
- `allotments`: historical link between a resident and a room, with allotment and vacating timestamps.

The database file is created automatically at `data/hostelhub.db`.

## 5. API routes

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | API health |
| GET | `/residents` | List residents |
| GET | `/residents/:id` | Get one resident |
| POST | `/residents` | Add resident |
| PUT | `/residents/:id` | Update resident |
| DELETE | `/residents/:id` | Delete resident |
| GET | `/rooms` | List rooms |
| GET | `/rooms?block=A` | Search by block |
| GET | `/rooms?status=available` | Filter by status |
| GET | `/rooms/:id` | Get one room |
| POST | `/rooms` | Add room |
| PUT | `/rooms/:id` | Update room |
| DELETE | `/rooms/:id` | Delete room |
| GET | `/rooms/top` | Top three by historical allotment count |
| GET | `/allotments` | List allotment history |
| GET | `/allotments/join` | JOIN residents, rooms and allotments |
| POST | `/allotments` | Create allotment |
| PATCH | `/allotments/:id/vacate` | Vacate an active allotment |
| DELETE | `/allotments/:id` | Delete an allotment history record |

## 6. Example requests

Create a room:

```json
{
  "name": "301",
  "block": "C",
  "status": "available"
}
```

Create a resident:

```json
{
  "name": "Ravi Kumar",
  "email": "ravi@example.com",
  "phone": "9876543210"
}
```

Create an allotment:

```json
{
  "resident_id": 1,
  "room_id": 1
}
```

## 7. Status codes

- `200`: successful GET or update.
- `201`: record created.
- `204`: successful deletion with no response body.
- `400`: invalid input.
- `404`: requested record or route not found.
- `409`: duplicate or conflicting operation.
- `500`: unexpected server error.

## 8. Automated tests

Run all tests:

```powershell
npm test
```

Run only the three twist tests:

```powershell
npm run test:twist
```

The tests use separate temporary SQLite files and do not erase the normal demo database.

## 9. Postman

Import `postman/HostelHub.postman_collection.json` into Postman. The collection uses `http://localhost:3000` as its base URL.

## 10. Important data rule

The allotments table is an allocation history. When a resident vacates, the `vacated_at` field is filled and the room becomes available. The Top Three query counts both active and historical allotment records. This allows the system to show which rooms have been allotted most often over time.

## 11. Project submission

Include the source files, README, project overview, SQL query reference, Postman collection, and genuine screenshots of your own successful execution and tests.
