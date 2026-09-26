# CoachDesk: Tuition & Coaching Manager

A web app for tutors and coaching centres to manage **batches, students, daily attendance and monthly fees**, with WhatsApp fee reminders. It runs in any browser, on desktop and mobile.

| Layer | Tech |
| --- | --- |
| Backend | Java 21, Spring Boot 3.5, Spring Security (JWT), Spring Data JPA, Flyway |
| Database | PostgreSQL 16 |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, TanStack Query, React Router |
| Hosting (free) | Render (API), Neon (Postgres), Vercel (frontend) |

```
coachdesk/
├── backend/            Spring Boot API  (Maven)
├── frontend/           React app        (Vite)
├── docker-compose.yml  Local Postgres
├── render.yaml         One-click Render setup
└── .github/workflows/  CI: tests on every push
```

---

## Part 1: Run it on your laptop

### Step 1. Start the database

You need Docker Desktop running. From the `coachdesk` folder:

```bash
docker compose up -d
```

This starts Postgres on `localhost:5432` (database, user and password are all `coachdesk`).

> No Docker? Install PostgreSQL 16, then create a user and database called `coachdesk` with password `coachdesk`.

### Step 2. Start the backend

```bash
cd backend
mvn spring-boot:run
```

- The first run downloads dependencies, which takes a few minutes.
- Flyway creates all the tables automatically from `src/main/resources/db/migration/V1__init.sql`.
- API: <http://localhost:8080>
- Swagger UI (try every endpoint in the browser): <http://localhost:8080/swagger-ui.html>
- Health check: <http://localhost:8080/actuator/health>

In IntelliJ you can instead open the `backend` folder and run `CoachDeskApplication`.

### Step 3. Start the frontend

```bash
cd frontend
cp .env.example .env        # on Windows: copy .env.example .env
npm install
npm run dev
```

Open <http://localhost:5173>, create an account, and you're in.

### Step 4. Run the tests (optional)

```bash
cd backend
mvn test
```

The integration test starts a real Postgres in Docker (Testcontainers). If Docker isn't running, it's skipped.

---

## Part 2: Deploy for free

You will create 4 free accounts: **GitHub**, **Neon** (database), **Render** (backend) and **Vercel** (frontend). Deploy in this order.

### Step 1. Push the code to GitHub

```bash
cd coachdesk
git init
git add .
git commit -m "CoachDesk first version"
git branch -M main
git remote add origin https://github.com/<your-username>/coachdesk.git
git push -u origin main
```

(Create the empty `coachdesk` repository on github.com first.)

### Step 2. Create the database on Neon

1. Sign up at <https://neon.tech> and create a project (pick the region closest to India, e.g. Singapore).
2. Open **Connection details** and copy the connection string. It looks like:
   `postgresql://neondb_owner:AbC123@ep-cool-name-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
3. Split it into the 3 values Spring needs:

| Env variable | Value from the example |
| --- | --- |
| `DATABASE_URL` | `jdbc:postgresql://ep-cool-name-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` |
| `DATABASE_USERNAME` | `neondb_owner` |
| `DATABASE_PASSWORD` | `AbC123` |

The URL is the same string with `postgresql://user:password@` swapped for `jdbc:postgresql://`.

> Using **Supabase** instead? Use the **Session pooler** connection string (it works over IPv4, which Render needs) and convert it the same way.

### Step 3. Deploy the backend on Render

1. Sign up at <https://render.com> with GitHub.
2. Click **New → Blueprint** and pick your `coachdesk` repo. Render reads `render.yaml`.
3. Enter the values it asks for:
   - `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` from Step 2
   - `CORS_ORIGINS`: type `http://localhost:5173` for now (you'll add the Vercel URL in Step 5)
4. Click **Apply**. The first Docker build takes about 5–10 minutes.
5. When it's live, open `https://coachdesk-api-XXXX.onrender.com/actuator/health`. You should see `{"status":"UP"}`.

<details>
<summary>Manual setup instead of Blueprint</summary>

New → Web Service → pick the repo → Root Directory `backend` → Runtime **Docker** → Instance type **Free** → add the env variables above, plus `JWT_SECRET` (any random string of 32+ characters) → Health Check Path `/actuator/health`.
</details>

### Step 4. Deploy the frontend on Vercel

1. Sign up at <https://vercel.com> with GitHub.
2. **Add New → Project** → import `coachdesk`.
3. Set **Root Directory** to `frontend`. Vercel detects Vite automatically.
4. Under **Environment Variables**, add:
   `VITE_API_URL` = `https://coachdesk-api-XXXX.onrender.com` (your Render URL, with no `/` at the end)
5. Click **Deploy**. You get a URL like `https://coachdesk-xyz.vercel.app`.

`frontend/vercel.json` already makes page refreshes work on routes like `/students/5`.

### Step 5. Connect the two

On Render, go to your service → **Environment** and set:

```
CORS_ORIGINS = https://coachdesk-xyz.vercel.app,http://localhost:5173
```

Save. Render redeploys. Now open your Vercel URL and register. Your app is live.

### From now on

Every `git push` to `main` redeploys Render and Vercel automatically, and GitHub Actions runs the tests.

---

## Free plan limits

- **Render free** puts the API to sleep after about 15 minutes idle. The next request takes 30–60 seconds while it wakes up, and the app shows a "server was sleeping" message if it times out. Once tutors pay you, switch to a paid always-on instance.
- **Neon free** has limited storage and compute. That's plenty for hundreds of students.
- **Vercel Hobby** is meant for non-commercial use. When you start charging, move to Vercel Pro or host the `frontend/dist` folder on **Cloudflare Pages** (free; the `public/_redirects` file is already included).

---

## API reference

All endpoints except register, login and health need the header `Authorization: Bearer <token>`.

| Method | Path | What it does |
| --- | --- | --- |
| POST | `/api/auth/register` | Create a teacher account and return a token |
| POST | `/api/auth/login` | Log in and return a token |
| GET | `/api/auth/me` | Current teacher |
| GET | `/api/dashboard` | Counts, this month's fees, today's attendance, top dues |
| GET / POST | `/api/batches` | List or create batches |
| PUT / DELETE | `/api/batches/{id}` | Update or delete a batch (its students are kept) |
| GET | `/api/students?batchId=&q=&includeInactive=` | List or search students |
| POST | `/api/students` | Add a student |
| GET / PUT / DELETE | `/api/students/{id}` | View, update or delete a student |
| GET | `/api/attendance?batchId=&date=` | Attendance sheet for a batch on a day |
| PUT | `/api/attendance` | Save attendance `{date, entries:[{studentId, present}]}` |
| GET | `/api/attendance/student/{id}?month=YYYY-MM` | One student's month |
| GET | `/api/fees?month=YYYY-MM&batchId=` | Fee status of every student for a month |
| POST | `/api/fees/payments` | Record a payment `{studentId, month, amount, mode, paidOn?, note?}` |
| GET | `/api/fees/payments?studentId=` | Payment history |
| DELETE | `/api/fees/payments/{id}` | Delete a payment |

### How fees are worked out

- Each student's monthly fee is their **personal fee** if one is set, otherwise their **batch fee**.
- A student is charged for a month if they are **active** and **joined on or before the last day** of that month.
- `due = fee − payments for that month`. The status is **Paid**, **Partial**, **Unpaid** or **No fee**.

---

## Backend code map

```
com.coachdesk
├── config/SecurityConfig      JWT (HS256), CORS, password hashing, public routes
├── common/                    Error handling → {"message", "errors"} JSON
├── auth/                      Teacher entity, register/login, TokenService, CurrentTeacher
├── batch/                     Batch CRUD
├── student/                   Student CRUD + effective fee logic
├── attendance/                Mark per day (upsert), monthly report
├── fee/                       Payments + monthly fee summary
└── dashboard/                 One call for the home screen
```

Every table has a `teacher_id`, and every query filters by the logged-in teacher, so tutors can never see each other's data.

## Ideas for version 2

- Parent login to see attendance and fees
- Razorpay/UPI payment links and automatic receipts (PDF)
- SMS/WhatsApp API reminders on a schedule (`@Scheduled`)
- Subscription plans for tutors (Free: 1 batch, Pro: unlimited)
- Installable app on phones (PWA), plus Hindi and other languages
