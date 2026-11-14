const express = require("express");
const { db, initializeDatabase } = require("./db");

initializeDatabase();
const app = express();
app.use(express.json());

const VALID_STATUSES = ["available", "occupied", "maintenance"];

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

function isPositiveInteger(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

function handleDatabaseError(error, res) {
  if (String(error.code).includes("SQLITE_CONSTRAINT_UNIQUE")) {
    return sendError(res, 409, "A record with these unique details already exists.");
  }
  if (String(error.code).includes("SQLITE_CONSTRAINT_FOREIGNKEY")) {
    return sendError(res, 409, "This record is linked to another record and cannot be changed or deleted.");
  }
  if (String(error.code).includes("SQLITE_CONSTRAINT")) {
    return sendError(res, 400, error.message);
  }
  console.error(error);
  return sendError(res, 500, "Internal server error.");
}

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to HostelHub API",
    status: "running",
    endpoints: ["/residents", "/rooms", "/allotments", "/rooms/top"]
  });
});

/* ------------------------- RESIDENT ENDPOINTS ------------------------- */

// GET /residents - list residents
app.get("/residents", (req, res) => {
  const residents = db.prepare("SELECT * FROM residents ORDER BY id").all();
  res.status(200).json(residents);
});

// GET /residents/:id - get one resident
app.get("/residents/:id", (req, res) => {
  if (!isPositiveInteger(req.params.id)) return sendError(res, 400, "Resident ID must be a positive integer.");
  const resident = db.prepare("SELECT * FROM residents WHERE id = ?").get(req.params.id);
  if (!resident) return sendError(res, 404, "Resident not found.");
  res.status(200).json(resident);
});

// POST /residents - add resident
app.post("/residents", (req, res) => {
  const { name, email, phone = null } = req.body || {};
  if (typeof name !== "string" || !name.trim()) return sendError(res, 400, "Name is required.");
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendError(res, 400, "A valid email address is required.");
  }
  try {
    const result = db.prepare(
      "INSERT INTO residents (name, email, phone) VALUES (?, ?, ?)"
    ).run(name.trim(), email.trim().toLowerCase(), phone);
    const resident = db.prepare("SELECT * FROM residents WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(resident);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// PUT /residents/:id - update resident
app.put("/residents/:id", (req, res) => {
  if (!isPositiveInteger(req.params.id)) return sendError(res, 400, "Resident ID must be a positive integer.");
  const existing = db.prepare("SELECT * FROM residents WHERE id = ?").get(req.params.id);
  if (!existing) return sendError(res, 404, "Resident not found.");
  const name = req.body?.name ?? existing.name;
  const email = req.body?.email ?? existing.email;
  const phone = req.body?.phone ?? existing.phone;
  if (typeof name !== "string" || !name.trim()) return sendError(res, 400, "Name cannot be empty.");
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return sendError(res, 400, "A valid email address is required.");
  try {
    db.prepare("UPDATE residents SET name = ?, email = ?, phone = ? WHERE id = ?")
      .run(name.trim(), email.trim().toLowerCase(), phone, req.params.id);
    res.status(200).json(db.prepare("SELECT * FROM residents WHERE id = ?").get(req.params.id));
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// DELETE /residents/:id - delete resident if not referenced by allotments
app.delete("/residents/:id", (req, res) => {
  if (!isPositiveInteger(req.params.id)) return sendError(res, 400, "Resident ID must be a positive integer.");
  const result = db.prepare("DELETE FROM residents WHERE id = ?").run(req.params.id);
  if (!result.changes) return sendError(res, 404, "Resident not found.");
  res.status(204).send();
});

/* --------------------------- ROOM ENDPOINTS --------------------------- */

// GET /rooms - list rooms; optional ?block=A and ?status=available
app.get("/rooms", (req, res) => {
  const { block, status } = req.query;
  if (status && !VALID_STATUSES.includes(status)) return sendError(res, 400, "Status must be available, occupied, or maintenance.");
  let sql = "SELECT * FROM rooms WHERE 1 = 1";
  const params = [];
  if (block) { sql += " AND block = ?"; params.push(String(block).trim()); }
  if (status) { sql += " AND status = ?"; params.push(status); }
  sql += " ORDER BY block COLLATE NOCASE, name COLLATE NOCASE";
  res.status(200).json(db.prepare(sql).all(...params));
});

// GET /rooms/top - three rooms with the most historical allotments; ties alphabetical
app.get("/rooms/top", (req, res) => {
  const rows = db.prepare(`
    SELECT rooms.id, rooms.name, rooms.block,
           COUNT(allotments.id) AS allotment_count
    FROM rooms
    INNER JOIN allotments ON allotments.room_id = rooms.id
    GROUP BY rooms.id, rooms.name, rooms.block
    ORDER BY allotment_count DESC, rooms.name COLLATE NOCASE ASC, rooms.block COLLATE NOCASE ASC
    LIMIT 3
  `).all();
  res.status(200).json(rows);
});

// GET /rooms/:id - get one room
app.get("/rooms/:id", (req, res) => {
  if (!isPositiveInteger(req.params.id)) return sendError(res, 400, "Room ID must be a positive integer.");
  const room = db.prepare("SELECT * FROM rooms WHERE id = ?").get(req.params.id);
  if (!room) return sendError(res, 404, "Room not found.");
  res.status(200).json(room);
});

// POST /rooms - add room
app.post("/rooms", (req, res) => {
  const { name, block, status = "available" } = req.body || {};
  if (typeof name !== "string" || !name.trim()) return sendError(res, 400, "Room name is required.");
  if (typeof block !== "string" || !block.trim()) return sendError(res, 400, "Block is required.");
  if (!VALID_STATUSES.includes(status)) return sendError(res, 400, "Status must be available, occupied, or maintenance.");
  try {
    const result = db.prepare("INSERT INTO rooms (name, block, status) VALUES (?, ?, ?)")
      .run(name.trim(), block.trim(), status);
    res.status(201).json(db.prepare("SELECT * FROM rooms WHERE id = ?").get(result.lastInsertRowid));
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// PUT /rooms/:id - update room name, block and/or status
app.put("/rooms/:id", (req, res) => {
  if (!isPositiveInteger(req.params.id)) return sendError(res, 400, "Room ID must be a positive integer.");
  const existing = db.prepare("SELECT * FROM rooms WHERE id = ?").get(req.params.id);
  if (!existing) return sendError(res, 404, "Room not found.");
  const name = req.body?.name ?? existing.name;
  const block = req.body?.block ?? existing.block;
  const status = req.body?.status ?? existing.status;
  if (typeof name !== "string" || !name.trim()) return sendError(res, 400, "Room name cannot be empty.");
  if (typeof block !== "string" || !block.trim()) return sendError(res, 400, "Block cannot be empty.");
  if (!VALID_STATUSES.includes(status)) return sendError(res, 400, "Status must be available, occupied, or maintenance.");
  try {
    db.prepare("UPDATE rooms SET name = ?, block = ?, status = ? WHERE id = ?")
      .run(name.trim(), block.trim(), status, req.params.id);
    res.status(200).json(db.prepare("SELECT * FROM rooms WHERE id = ?").get(req.params.id));
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// DELETE /rooms/:id - blocked if allotment history exists
app.delete("/rooms/:id", (req, res) => {
  if (!isPositiveInteger(req.params.id)) return sendError(res, 400, "Room ID must be a positive integer.");
  try {
    const result = db.prepare("DELETE FROM rooms WHERE id = ?").run(req.params.id);
    if (!result.changes) return sendError(res, 404, "Room not found.");
    res.status(204).send();
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

/* ------------------------ ALLOTMENT ENDPOINTS ------------------------- */

// GET /allotments - list allotment history
app.get("/allotments", (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, r.name AS room_name, r.block, residents.name AS resident_name
    FROM allotments a
    JOIN rooms r ON r.id = a.room_id
    JOIN residents ON residents.id = a.resident_id
    ORDER BY a.id DESC
  `).all();
  res.status(200).json(rows);
});

// GET /allotments/join - required join endpoint
app.get("/allotments/join", (req, res) => {
  const rows = db.prepare(`
    SELECT a.id AS allotment_id, residents.name AS resident_name,
           residents.email, rooms.name AS room_name, rooms.block,
           a.allotted_at, a.vacated_at
    FROM allotments a
    INNER JOIN residents ON residents.id = a.resident_id
    INNER JOIN rooms ON rooms.id = a.room_id
    ORDER BY a.id
  `).all();
  res.status(200).json(rows);
});

// POST /allotments - create an allotment (201); room must be available
app.post("/allotments", (req, res) => {
  const { resident_id, room_id } = req.body || {};
  if (!isPositiveInteger(resident_id)) return sendError(res, 400, "resident_id must be a positive integer.");
  if (!isPositiveInteger(room_id)) return sendError(res, 400, "room_id must be a positive integer.");
  const resident = db.prepare("SELECT * FROM residents WHERE id = ?").get(resident_id);
  if (!resident) return sendError(res, 404, "Resident not found.");
  const room = db.prepare("SELECT * FROM rooms WHERE id = ?").get(room_id);
  if (!room) return sendError(res, 404, "Room not found.");
  if (room.status !== "available") return sendError(res, 409, "Room is not available.");
  const active = db.prepare("SELECT id FROM allotments WHERE resident_id = ? AND vacated_at IS NULL").get(resident_id);
  if (active) return sendError(res, 409, "Resident already has an active allotment.");
  const create = db.transaction(() => {
    const result = db.prepare("INSERT INTO allotments (resident_id, room_id) VALUES (?, ?)").run(resident_id, room_id);
    db.prepare("UPDATE rooms SET status = 'occupied' WHERE id = ?").run(room_id);
    return result.lastInsertRowid;
  });
  const id = create();
  res.status(201).json(db.prepare("SELECT * FROM allotments WHERE id = ?").get(id));
});

// PATCH /allotments/:id/vacate - close historical allotment and free room
app.patch("/allotments/:id/vacate", (req, res) => {
  if (!isPositiveInteger(req.params.id)) return sendError(res, 400, "Allotment ID must be a positive integer.");
  const allotment = db.prepare("SELECT * FROM allotments WHERE id = ?").get(req.params.id);
  if (!allotment) return sendError(res, 404, "Allotment not found.");
  if (allotment.vacated_at) return sendError(res, 409, "This allotment has already been vacated.");
  const vacate = db.transaction(() => {
    db.prepare("UPDATE allotments SET vacated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
    db.prepare("UPDATE rooms SET status = 'available' WHERE id = ?").run(allotment.room_id);
  });
  vacate();
  res.status(200).json(db.prepare("SELECT * FROM allotments WHERE id = ?").get(req.params.id));
});

// DELETE /allotments/:id - remove a history record
app.delete("/allotments/:id", (req, res) => {
  if (!isPositiveInteger(req.params.id)) return sendError(res, 400, "Allotment ID must be a positive integer.");
  const result = db.prepare("DELETE FROM allotments WHERE id = ?").run(req.params.id);
  if (!result.changes) return sendError(res, 404, "Allotment not found.");
  res.status(204).send();
});

// JSON parsing and unknown-route errors
app.use((req, res) => sendError(res, 404, "API route not found."));
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) return sendError(res, 400, "Invalid JSON request body.");
  console.error(err);
  return sendError(res, 500, "Internal server error.");
});

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => console.log(`HostelHub API is running at http://localhost:${port}`));
}

module.exports = { app, db };
