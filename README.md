# BUP Smart Complaint & Maintenance System

A campus portal for Bangladesh University of Professionals. Students and faculty file maintenance complaints. Officers work the assigned tickets. Administrators review every complaint, user access, and performance.

The interface is a React single-page application. Records are stored in MySQL and served by an Express API on the same machine.

## Problem and objectives

Campus maintenance requests are easy to lose when they move through phone calls and paper. This portal gives each complaint one record, a responsible officer, a deadline, and a visible history.

- A general user can register, file a complaint, attach photo proof, and follow its status.
- An officer sees the complaints assigned to them, can record progress, and can pass a ticket to the next office with a written reason.
- If a deadline passes and the ticket is still open, the API moves it to the next office and keeps that fact on the officer's record.
- An administrator sees all complaints, analytics, users, categories, locations, and solved-work history.
- Administrators are not created from the registration form. They are inserted in MySQL.

## Features

- Sign-in with a BUP ID or email. Sessions end after 30 minutes without activity.
- Registration creates a general user. The form does not ask for a role. The department list ends with Administration and Others.
- Complaint filing with category, campus location, priority, and an optional photo (PNG, JPG, or WEBP, up to 8 MB).
- Direct routing to the desk that owns the category, then escalation to the next office and finally to the Vice Chancellor, Pro-Vice Chancellor, Treasurer, or Registrar.
- SLA targets: Urgent 2 hours, High 8 hours, Normal 24 hours, Low 72 hours.
- In-app notifications only. Email and SMS are not sent.
- Spam limits for general users: 3 complaints in 10 minutes, 8 in a day, and the same title cannot be sent again for 24 hours. A flagged account cannot file until an administrator clears the flag.
- Officers and administrators cannot file from their own accounts.
- Officers see Active tasks. Administrators do not see My complaints.
- A custom 404 page for unknown addresses and for pages the signed-in role cannot open.
- Search with ⌘K or Ctrl+K.
- Hourly SQL backups written under `server/backups/`.

## Screenshots

Screenshots are not included in this repository yet.

| Screen | Suggested file |
| --- | --- |
| Sign in and registration | `docs/screenshots/sign-in.png` |
| Student overview | `docs/screenshots/overview.png` |
| New complaint | `docs/screenshots/new-complaint.png` |
| Officer work orders | `docs/screenshots/work-orders.png` |
| Admin analytics | `docs/screenshots/analytics.png` |

Create the `docs/screenshots/` folder locally and add the images when you have them. The folder is not required to run the app.

## Technologies

| Area | Choice |
| --- | --- |
| Interface | React 19, TypeScript, Tailwind CSS 4, Vite 8 |
| API | Node.js, Express 4 (ES modules) |
| Database | MySQL 8, `mysql2` |
| Passwords | `bcryptjs` (plain demo passwords are hashed on first sign-in) |
| Process runner | `concurrently` for the web app and API together |

`@google/genai` is listed in `package.json` but is not imported by the application source. There is no separate test runner.

## Architecture

```text
Browser (http://localhost:3000)
        |
        |  Vite dev server
        |  proxies /api and /uploads
        v
Express API (http://127.0.0.1:4000)
        |
        v
MySQL database bup_maintenance
```

Navigation is handled in `src/routes.ts` and `src/App.tsx`. There is no React Router package. The API entry point is `server/index.js`. The browser entry point is `src/main.tsx`.

On startup the API adds any missing escalation columns, inserts section-authority accounts that are not already present, and normalizes campus locations.

## Folder structure

```text
.
├── database_schema.sql     # Tables, roles, demo users, sample complaints
├── index.html              # HTML shell and meta description
├── package.json
├── scripts/add-admin.sql   # Commented SQL for an extra administrator
├── server/
│   ├── index.js            # Express API
│   ├── catalog.js          # Departments, offices, and location cleanup
│   ├── db.js               # MySQL connection settings from .env
│   ├── setup.js            # Imports database_schema.sql
│   ├── uploads/            # Photo proof (not committed)
│   └── backups/            # Generated SQL backups (not committed)
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes.ts
│   ├── api/client.ts
│   ├── components/
│   ├── context/AppContext.tsx
│   ├── features/           # Sign-in, dashboards, admin, officers, campus map
│   ├── pages/NotFoundPage.tsx
│   └── types/complaint.ts
├── .env.example
└── vite.config.ts          # Proxies /api and /uploads to port 4000
```

## Prerequisites

- Node.js 18 or newer, with npm
- MySQL 8 running locally, with a user that can create the `bup_maintenance` database

The checked commands in this repository were run with Node.js on macOS. The same npm scripts are what the project defines for other systems.

## Installation

From the project directory:

```bash
npm install
cp .env.example .env
```

Edit `.env` and set `DB_PASSWORD` to the MySQL user's password. If that password contains `#`, keep the double quotes shown in `.env.example`.

Import the schema:

```bash
npm run db:setup
```

`npm run db:setup` runs `database_schema.sql`. That script drops the application tables and reloads the demo users and sample complaints. Do not run it against a database whose complaints you want to keep.

To add another administrator later, edit and run the commented `INSERT` in `scripts/add-admin.sql` inside the `bup_maintenance` database. The registration form will not create an administrator.

## Run

Start the website and the API together:

```bash
npm run dev:full
```

Open [http://localhost:3000](http://localhost:3000).

You can also start them separately:

```bash
npm run server
npm run dev
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite on port 3000 |
| `npm run server` | Express on port 4000 |
| `npm run dev:full` | Both processes |
| `npm run db:setup` | Reimport `database_schema.sql` |
| `npm run build` | Production build in `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | Type-check with `tsc --noEmit` |

`npm run build` builds the React app only. It does not package the Express API. A production host still needs Node, MySQL, `.env`, and `npm run server`.

Closing the terminal stops both processes. Start them again with `npm run dev:full`. MySQL itself keeps running as its own service.

## Environment variables

Copy `.env.example` to `.env`.

| Variable | Purpose | Example |
| --- | --- | --- |
| `DB_HOST` | MySQL host | `127.0.0.1` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | set locally, never commit it |
| `DB_NAME` | Database name | `bup_maintenance` |
| `PORT` | API port | `4000` |
| `SESSION_IDLE_MINUTES` | Idle sign-out | `30` |

## Database

The schema creates these tables:

`ROLE`, `USER`, `USER_SESSION`, `DEPARTMENT`, `MAINTENANCE_STAFF`, `COMPLAINT_CATEGORY`, `LOCATION`, `COMPLAINT`, `COMPLAINT_ASSIGNMENT`, `COMPLAINT_STATUS_HISTORY`, `NOTIFICATION`, `EMERGENCY_CONTACTS`.

Useful checks after import:

```sql
USE bup_maintenance;
SHOW TABLES;
SELECT Complaint_ID_PK, Title, Priority, Current_Status FROM COMPLAINT;
```

The first API start also inserts the section offices `AUTH-01` through `AUTH-36` when those employee IDs are missing, and it adds campus places such as Academic Building, the faculty towers, Shadhinota Auditorium, Bijoy Auditorium, and Utility Building.

## Demo accounts

Every account loaded by the schema uses the local password `123456`. Change these passwords before any shared or public deployment.

| Person | Sign-in ID | Email |
| --- | --- | --- |
| Nusrat Jahan, student | `24549010088` | `nusrat@bup.edu.bd` |
| Dr. Suman Saha, faculty | `FAC-IOT-108` | `suman.saha@bup.edu.bd` |
| Brigadier General Zahid Hasan, administrator | `ADM-BUP-001` | `admin.maintenance@bup.edu.bd` |
| Rafiqul Islam, electrical | `STF-ELEC-401` | `rafiqul.maint@bup.edu.bd` |
| Tariqul Alam, ICT | `STF-ICT-220` | `tariqul.ict@bup.edu.bd` |
| Nurul Huda, estate | `STF-EST-118` | `nurul.estate@bup.edu.bd` |
| Ayesha Akter, harassment desk | `STF-HAR-501` | `ayesha.harassment@bup.edu.bd` |
| Kamrul Hasan, drug desk | `STF-DRG-502` | `kamrul.drug@bup.edu.bd` |
| Hasan Hafiz, security | `STF-SEC-503` | `hasan.security@bup.edu.bd` |
| Minhaz Chowdhury, miscellaneous | `STF-MSC-504` | `minhaz.misc@bup.edu.bd` |
| Tanzim Ahmed, flagged student | `24549010999` | `tanzim.spam@bup.edu.bd` |

Section and final offices created on API startup use the same password and the IDs `AUTH-01` through `AUTH-36`. The names are in `server/catalog.js`.

## API

The browser calls these routes through the Vite proxy. All routes except health and the auth routes below require `Authorization: Bearer <session token>`.

| Method | Path | Who |
| --- | --- | --- |
| `GET` | `/api/health` | Anyone |
| `POST` | `/api/auth/register` | Anyone |
| `POST` | `/api/auth/login` | Anyone |
| `POST` | `/api/auth/forgot` | Anyone |
| `POST` | `/api/auth/reset-password` | Anyone |
| `POST` | `/api/auth/logout` | Signed in |
| `POST` | `/api/auth/touch` | Signed in |
| `POST` | `/api/auth/password` | Signed in |
| `POST` | `/api/auth/security-question` | Signed in |
| `GET` | `/api/state` | Signed in |
| `POST` | `/api/complaints` | Student or faculty |
| `POST` | `/api/complaints/:id/status` | Assigned officer or administrator |
| `POST` | `/api/complaints/:id/progress` | Assigned officer or administrator |
| `POST` | `/api/complaints/:id/escalate` | Assigned officer or administrator; remarks required |
| `POST` | `/api/complaints/:id/follow-up` | Complaint owner |
| `POST` | `/api/complaints/:id/feedback` | Complaint owner |
| `POST` | `/api/complaints/:id/assign` | Administrator |
| `POST` | `/api/complaints/:id/reject` | Administrator |
| `POST` | `/api/complaints/:id/close` | Administrator |
| `POST` | `/api/officers` | Administrator |
| `POST` | `/api/users/:id/flag` | Administrator |
| `POST` | `/api/categories` | Administrator |
| `POST` | `/api/locations` | Administrator |
| `GET` | `/api/admin/backup` | Administrator |
| `POST` | `/api/admin/reset` | Administrator; reloads the schema and sample data |

Sign in:

```bash
curl -s -X POST http://127.0.0.1:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"24549010088","password":"123456"}'
```

The JSON response includes a `token`. Send it as `Authorization: Bearer <token>` on later requests. Do not print or commit that token.

## Roles and main pages

| Path | Who can open it |
| --- | --- |
| `/` | Signed-out visitors |
| `/overview`, `/complaints`, `/notifications`, `/settings` | Any signed-in user. Administrators who open `/complaints` are sent to All complaints. |
| `/complaints/new` | Students and faculty |
| `/campus-map` | Everyone except maintenance officers |
| `/work-orders` | Maintenance officers |
| `/solved` | Administrators and maintenance officers |
| `/admin/analytics`, `/admin/complaints`, `/admin/users`, `/admin/categories` | Administrators |

## Testing

There is no unit or end-to-end test suite. The available check is:

```bash
npm run lint
```

To exercise the app, start `npm run dev:full`, sign in as Nusrat Jahan, file one complaint, then sign in as the assigned officer and as the administrator.

## Troubleshooting

| What you see | What to check |
| --- | --- |
| `MySQL is not ready` or registration says MySQL is not connected | MySQL is running, `.env` exists, and `DB_PASSWORD` is the MySQL user's password. |
| The password looks right but MySQL still rejects it | A `#` in the password was not quoted, so dotenv ignored the rest of the line. |
| `npm run db:setup` asks for a password in the terminal | That prompt is the operating-system password if a command used `sudo`. The project scripts read MySQL credentials from `.env`. |
| The site opens but complaints fail | The API is not running. Use `npm run dev:full`, or run `npm run server` as well as `npm run dev`. |
| Port 3000 or 4000 is already in use | Stop the older `npm run dev:full` process before starting another one. |
| Overview counts are not zero | `npm run db:setup` loads the sample complaints from `database_schema.sql`. |
| A flagged student cannot file | An administrator must clear the flag. Tanzim Ahmed is seeded as flagged. |

## Limitations

- Notifications stay inside the portal. Email and SMS are not implemented.
- `npm run build` does not deploy the API.
- `@google/genai` is installed but unused.
- Some older dashboard components under `src/features/admin/AdminDashboard.tsx`, `src/features/user/UserDashboard.tsx`, and `src/features/maintenance/MaintenanceDashboard.tsx` are not mounted by `src/App.tsx`.
- Demo passwords are stored in the schema as plain text until the first sign-in, which hashes them.

## Future improvements

- Replace the shared demo password before any deployment beyond one computer.
- Add an automated test for sign-in, filing, and escalation.
- Remove the unused `@google/genai` dependency if Gemini is not part of the plan.
- Add the screenshots listed above.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

No license has been selected. Until the maintainer adds one, do not assume permission to copy or reuse this project.

## Author

Maintainer name and contact are not recorded in this repository.

- Name: [your name]
- Email: [your email]
- GitHub: [your GitHub username]
