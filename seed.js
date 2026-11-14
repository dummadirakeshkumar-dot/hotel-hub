const { db, initializeDatabase } = require("./db");

initializeDatabase();

const seed = db.transaction(() => {
  db.exec("DELETE FROM allotments; DELETE FROM residents; DELETE FROM rooms;");
  db.pragma("foreign_keys = ON");

  const addResident = db.prepare("INSERT INTO residents (name, email, phone) VALUES (?, ?, ?)");
  const residents = [
    ["Aarav Kumar", "aarav@example.com", "9000000001"],
    ["Diya Sharma", "diya@example.com", "9000000002"],
    ["Ishaan Reddy", "ishaan@example.com", "9000000003"],
    ["Meera Rao", "meera@example.com", "9000000004"],
    ["Kabir Patel", "kabir@example.com", "9000000005"],
    ["Ananya Das", "ananya@example.com", "9000000006"]
  ];
  residents.forEach(r => addResident.run(...r));

  const addRoom = db.prepare("INSERT INTO rooms (name, block, status) VALUES (?, ?, 'available')");
  const rooms = [
    ["101", "A"], ["102", "A"], ["103", "A"],
    ["201", "B"], ["202", "B"]
  ];
  rooms.forEach(r => addRoom.run(...r));

  const addAllotment = db.prepare("INSERT INTO allotments (resident_id, room_id, vacated_at) VALUES (?, ?, CURRENT_TIMESTAMP)");
  // Historical records: repeated room use creates meaningful Top Three counts.
  const history = [
    [1, 1], [2, 1], [3, 1], [4, 1], [5, 1],
    [1, 2], [2, 2], [3, 2], [4, 2],
    [1, 3], [2, 3], [3, 3],
    [4, 4], [5, 4],
    [6, 5]
  ];
  history.forEach(a => addAllotment.run(...a));
});
seed();

console.log("HostelHub demo data inserted successfully.");
console.log("Historical allotment counts: room 101 = 5, 102 = 4, 103 = 3.");
console.log("All rooms are available because the seeded allotments are historical.");
db.close();
