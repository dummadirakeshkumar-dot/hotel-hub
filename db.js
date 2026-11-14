const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const dbFile = process.env.DB_FILE || path.join(__dirname, "data", "hostelhub.db");
fs.mkdirSync(path.dirname(dbFile), { recursive: true });

const db = new Database(dbFile);
db.pragma("foreign_keys = ON");

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS residents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL CHECK(length(trim(name)) > 0),
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL CHECK(length(trim(name)) > 0),
      block TEXT NOT NULL CHECK(length(trim(block)) > 0),
      status TEXT NOT NULL DEFAULT 'available'
        CHECK(status IN ('available', 'occupied', 'maintenance')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(name, block)
    );

    CREATE TABLE IF NOT EXISTS allotments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resident_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      allotted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      vacated_at TEXT,
      FOREIGN KEY(resident_id) REFERENCES residents(id) ON DELETE RESTRICT,
      FOREIGN KEY(room_id) REFERENCES rooms(id) ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_rooms_block ON rooms(block);
    CREATE INDEX IF NOT EXISTS idx_allotments_room ON allotments(room_id);
    CREATE INDEX IF NOT EXISTS idx_allotments_resident ON allotments(resident_id);
  `);
}

module.exports = { db, initializeDatabase, dbFile };
