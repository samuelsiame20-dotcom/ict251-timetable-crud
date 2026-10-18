# ICT251 Activity 4 — Q3 Student Timetable & Goals

Node.js + Express REST API over a single PostgreSQL table (`timetable`), with a plain HTML/JS frontend served by the same Express app.

**Why PostgreSQL (Supabase) instead of SQLite/MySQL:** the system had to be deployed to the cloud, and Supabase was one of the listed options. SQLite stores data in a local file, which free cloud hosts erase on every restart, so a hosted Postgres database keeps the data persistent.

```
timetable-crud/
├─ backend/
│  ├─ .env.example   (copy to .env — never commit .env)
│  ├─ package.json
│  ├─ schema.sql     (table + trigger + 13 sample rows)
│  ├─ db.js          (connection pool)
│  └─ server.js      (API + serves ../frontend)
├─ frontend/
│  ├─ index.html
│  └─ app.js
└─ postman_collection.json
```

## Endpoints

| Method | URL | Purpose |
|---|---|---|
| GET | /api/timetable | List all |
| GET | /api/timetable/:id | Get one |
| POST | /api/timetable | Create (JSON body) |
| PUT | /api/timetable/:id | Update (send only the fields to change) |
| DELETE | /api/timetable/:id | Delete |

Required on POST: `course_code`, `day_of_week`, `start_time`, `end_time`.

## 1. Database — Supabase (≈5 min)
1. supabase.com → New project. Save the database password.
2. **SQL Editor** → paste all of `backend/schema.sql` → Run. Check **Table Editor** shows 13 rows.
3. **Connect** (top bar) → copy the **Session pooler** connection string (URI). Replace `[YOUR-PASSWORD]`.

## 2. Run locally (PowerShell)
```powershell
cd backend
copy .env.example .env      # then paste your Supabase URI into DATABASE_URL
npm install
npm start
```
Open http://localhost:3000. The frontend and API are on the same port.

## 3. Deploy the API — Render (≈10 min)
1. Push this folder to a GitHub repo (`.gitignore` already excludes `.env` and `node_modules`).
2. render.com → New → **Web Service** → pick the repo.
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance: Free
3. **Environment** → add `DATABASE_URL` (Supabase URI) and `DB_SSL=true`. Don't set PORT; Render provides it.
4. Deploy → your app is at `https://<name>.onrender.com`. Free instances sleep after ~15 min idle; the first request takes ~30–50 s to wake up.

## 4. Postman video
Import `postman_collection.json`, set the `baseUrl` collection variable to your Render URL, and run requests 1 → 5 in order. POST stores the new id automatically, so PUT and DELETE act on the record you just created. Show the method, URL, body and JSON response for each.

## Links to submit
- Frontend: `https://<name>.onrender.com/`
- GET all: `https://<name>.onrender.com/api/timetable`
- GET one / PUT / DELETE: `https://<name>.onrender.com/api/timetable/1`
- POST: `https://<name>.onrender.com/api/timetable`
