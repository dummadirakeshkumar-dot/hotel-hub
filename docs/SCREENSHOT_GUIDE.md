# HostelHub Screenshot Guide

Take screenshots from your own running project. Do not use sample or internet images as proof of execution.

## Recommended screenshots for the Word report

1. **Project folder in VS Code Explorer** – show `app.js`, `db.js`, `package.json`, `seed.js`, `requests.http`, `test`, `docs` and `postman`.
2. **package.json** – show scripts and dependencies.
3. **app.js** – show Express setup and endpoint definitions.
4. **db.js** – show the three SQLite table definitions and foreign keys.
5. **Terminal installation** – show `npm install` completed.
6. **Database seeding** – show `npm run seed` output.
7. **Server running** – show `npm start` and the localhost URL.
8. **GET rooms** – Postman response with room records.
9. **POST room** – Postman request body and HTTP 201 response.
10. **Validation** – invalid request and clear HTTP 400 response.
11. **Block search** – `GET /rooms?block=A` and filtered response.
12. **JOIN endpoint** – `GET /allotments/join` with resident and room names.
13. **Top Three** – `GET /rooms/top` with counts in descending order.
14. **Twist Test 1** – terminal output showing test success.
15. **Twist Test 2** – terminal output showing test success.
16. **Twist Test 3** – terminal output showing test success and only two rooms returned.
17. **GitHub repository** – show the committed project files.

## How to capture on Windows
- Press `Win + Shift + S`.
- Drag around the VS Code or Postman area.
- Save the screenshot in `docs/screenshots/`.
- Use filenames such as `01-project-structure.png`, `02-database-schema.png`, `03-server-running.png`.

## Suggested caption format
**Figure 1: HostelHub project structure in Visual Studio Code.** The Explorer panel displays the main application, database, test, documentation and Postman files.

Use a short caption below every screenshot explaining what it proves.
