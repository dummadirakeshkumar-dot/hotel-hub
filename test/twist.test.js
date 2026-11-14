const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const fs = require("fs");
const path = require("path");

const testDb = path.join(__dirname, "..", "data", "hostelhub-twist.db");
process.env.DB_FILE = testDb;
const { app, db } = require("../app");

test.beforeEach(() => {
  db.exec("DELETE FROM allotments; DELETE FROM residents; DELETE FROM rooms;");
});

test.after(() => {
  db.close();
  for (const suffix of ["", "-shm", "-wal"]) {
    try { fs.unlinkSync(testDb + suffix); } catch {}
  }
});

function makeRoom(name, block = "A") {
  return db.prepare("INSERT INTO rooms (name, block, status) VALUES (?, ?, 'available')").run(name, block).lastInsertRowid;
}
function makeResident(i) {
  return db.prepare("INSERT INTO residents (name, email) VALUES (?, ?)").run(`Resident ${i}`, `resident${i}@example.com`).lastInsertRowid;
}
function addHistoricalAllotments(roomId, count, start) {
  const insert = db.prepare("INSERT INTO allotments (resident_id, room_id, vacated_at) VALUES (?, ?, CURRENT_TIMESTAMP)");
  for (let i = 0; i < count; i++) insert.run(makeResident(start + i), roomId);
}

test("TWIST TEST 1: multiple allotment creations each return HTTP 201", async () => {
  const roomId = makeRoom("101");
  for (let i = 1; i <= 3; i++) {
    const resident = await request(app).post("/residents").send({ name: `Resident ${i}`, email: `r${i}@example.com` });
    const room = db.prepare("SELECT * FROM rooms WHERE id = ?").get(roomId);
    if (i > 1) db.prepare("UPDATE rooms SET status = 'available' WHERE id = ?").run(roomId);
    const res = await request(app).post("/allotments").send({ resident_id: resident.body.id, room_id: roomId });
    assert.equal(res.status, 201);
    await request(app).patch(`/allotments/${res.body.id}/vacate`);
  }
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM allotments WHERE room_id = ?").get(roomId).n, 3);
});

test("TWIST TEST 2: Top Three returns three highest-count rooms in descending count order", async () => {
  const room1 = makeRoom("101");
  const room2 = makeRoom("102");
  const room3 = makeRoom("103");
  const room4 = makeRoom("104");
  addHistoricalAllotments(room1, 5, 1);
  addHistoricalAllotments(room2, 4, 10);
  addHistoricalAllotments(room3, 3, 20);
  addHistoricalAllotments(room4, 1, 30);

  const res = await request(app).get("/rooms/top");
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 3);
  assert.deepEqual(res.body.map(x => x.allotment_count), [5, 4, 3]);
  assert.deepEqual(res.body.map(x => x.name), ["101", "102", "103"]);
});

test("TWIST TEST 3: when only two rooms have allotment history, return only two", async () => {
  const room1 = makeRoom("201");
  const room2 = makeRoom("202");
  addHistoricalAllotments(room1, 3, 1);
  addHistoricalAllotments(room2, 2, 10);

  const res = await request(app).get("/rooms/top");
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 2);
  assert.deepEqual(res.body.map(x => x.allotment_count), [3, 2]);
});
