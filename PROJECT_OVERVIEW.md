# HostelHub – Project Overview

## Problem statement
Hostel room availability is tracked using paper records. Wardens cannot quickly identify free rooms in each block or review room allotment history.

## Objective
Build a REST API that stores residents, rooms and allotments in SQLite and allows the warden to manage room information, search by block and identify the three most frequently allotted rooms.

## Technology stack
- JavaScript / Node.js: server-side runtime
- Express.js: REST API routing and middleware
- SQLite: relational database
- better-sqlite3: SQLite driver
- Postman and VS Code REST Client: API testing

## Architecture
Client (Postman / REST Client) → Express application (`app.js`) → SQLite access (`db.js`) → `residents`, `rooms`, `allotments`.

## Database relationships
- One resident can have multiple allotment history records over time.
- One room can have multiple allotment history records over time.
- Each allotment references exactly one resident and one room.
- Foreign keys prevent deleting residents or rooms that are still referenced by allotment history.

## Main workflow
1. Create resident records.
2. Create room records with a block and status.
3. Create an allotment for a resident and an available room.
4. The room status changes to occupied.
5. Vacating an allotment records the vacated timestamp and marks the room available.
6. Search rooms by block or status.
7. View the JOIN endpoint to see resident and room names together.
8. View `/rooms/top` to rank rooms by total historical allotments.

## Top Three SQL logic
The query joins rooms to allotments, counts allotment IDs per room, groups by room, orders by count descending and room name alphabetically for ties, then limits the result to three rows. If only two rooms have allotment history, only two rows are returned.

## Validation and response behavior
The API validates required text fields, email format, positive integer IDs and room status. It returns clear JSON error messages and suitable HTTP status codes.

## Scope note
The assignment asks for an Express server, three related SQLite tables, room CRUD, one JOIN endpoint, validation, block search and the Top Three twist. Resident and allotment endpoints are included to make the related data manageable and the demonstration complete.
