const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const fs = require("fs");
const path = require("path");

const testDb = path.join(__dirname, "..", "data", "hostelhub-test.db");
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

test("GET / returns API status", async () => {
  const res = await request(app).get("/");
  assert.equal(res.status, 200);
  assert.equal(res.body.status, "running");
});

test("room CRUD: create, read, update and delete", async () => {
  let res = await request(app).post("/rooms").send({ name: "101", block: "A", status: "available" });
  assert.equal(res.status, 201);
  const id = res.body.id;

  res = await request(app).get(`/rooms/${id}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.name, "101");

  res = await request(app).put(`/rooms/${id}`).send({ name: "102", block: "B", status: "maintenance" });
  assert.equal(res.status, 200);
  assert.equal(res.body.name, "102");
  assert.equal(res.body.status, "maintenance");

  res = await request(app).delete(`/rooms/${id}`);
  assert.equal(res.status, 204);
});

test("room validation returns clear 400 message", async () => {
  const res = await request(app).post("/rooms").send({ name: "", block: "A", status: "free" });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /Room name is required|Status must be/);
});

test("search filters rooms by block", async () => {
  await request(app).post("/rooms").send({ name: "101", block: "A" });
  await request(app).post("/rooms").send({ name: "201", block: "B" });
  const res = await request(app).get("/rooms?block=A");
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].block, "A");
});

test("allotment creation returns 201 and join returns resident and room names", async () => {
  const resident = await request(app).post("/residents").send({ name: "Test Resident", email: "test@example.com" });
  const room = await request(app).post("/rooms").send({ name: "101", block: "A" });
  const allocation = await request(app).post("/allotments").send({ resident_id: resident.body.id, room_id: room.body.id });
  assert.equal(allocation.status, 201);
  const joined = await request(app).get("/allotments/join");
  assert.equal(joined.status, 200);
  assert.equal(joined.body[0].resident_name, "Test Resident");
  assert.equal(joined.body[0].room_name, "101");
});
