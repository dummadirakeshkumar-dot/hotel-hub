# HostelHub SQL Query Reference

## 1. Create residents table
```sql
CREATE TABLE residents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## 2. Create rooms table
```sql
CREATE TABLE rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  block TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('available','occupied','maintenance')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, block)
);
```

## 3. Create allotments table
```sql
CREATE TABLE allotments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resident_id INTEGER NOT NULL REFERENCES residents(id),
  room_id INTEGER NOT NULL REFERENCES rooms(id),
  allotted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  vacated_at TEXT
);
```

## 4. Get all rooms
```sql
SELECT * FROM rooms ORDER BY block, name;
```

## 5. Search rooms by block
```sql
SELECT * FROM rooms WHERE block = ? ORDER BY name;
```

## 6. Get one room
```sql
SELECT * FROM rooms WHERE id = ?;
```

## 7. Insert a room
```sql
INSERT INTO rooms (name, block, status) VALUES (?, ?, ?);
```

## 8. Update a room
```sql
UPDATE rooms SET name = ?, block = ?, status = ? WHERE id = ?;
```

## 9. Delete a room
```sql
DELETE FROM rooms WHERE id = ?;
```

## 10. Required JOIN endpoint
```sql
SELECT a.id AS allotment_id, residents.name AS resident_name,
       rooms.name AS room_name, rooms.block, a.allotted_at, a.vacated_at
FROM allotments a
INNER JOIN residents ON residents.id = a.resident_id
INNER JOIN rooms ON rooms.id = a.room_id;
```

## 11. Top Three
```sql
SELECT rooms.id, rooms.name, rooms.block,
       COUNT(allotments.id) AS allotment_count
FROM rooms
INNER JOIN allotments ON allotments.room_id = rooms.id
GROUP BY rooms.id, rooms.name, rooms.block
ORDER BY allotment_count DESC, rooms.name COLLATE NOCASE ASC
LIMIT 3;
```

The INNER JOIN means rooms with zero allotments do not appear. If only two rooms have allotments, the query returns two rows rather than inventing a third.
