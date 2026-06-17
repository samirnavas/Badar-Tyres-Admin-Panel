# Badar Tyres — Mock API Server

A small Node/Express server that mimics a real backend/database for the Badar
Tyres Flutter app. Data is seeded from JSON files in `data/` and kept in memory;
newly created jobs are persisted back to `data/jobs.json`.

## Run

```bash
cd js
npm install
npm start
```

The server starts on `http://localhost:3000`. A ~250ms delay is added to every
request to simulate network/database latency.

## Endpoints

| Method | Path                          | Description                                  |
| ------ | ----------------------------- | -------------------------------------------- |
| GET    | `/api/metrics`                | Dashboard counts (total/running/completed/…) |
| GET    | `/api/jobs?status=&search=`   | List jobs, filtered by status + search text  |
| GET    | `/api/jobs/:id`               | Single job by id                             |
| GET    | `/api/technicians`            | List of technician names                     |
| POST   | `/api/jobs`                   | Create a job (computes subtotal/GST/total)   |
| GET    | `/api/health`                 | Health check                                 |

`status` accepts `all`, `running`, `completed`, `delayed`, `pending`.

## Connecting the Flutter app

The app reads its base URL from `lib/core/api/api_config.dart`:

- Android emulator: `http://10.0.2.2:3000/api`
- Everything else (web, desktop, iOS sim): `http://localhost:3000/api`

For a physical device, set `BadarApiConfig.overrideBaseUrl` (or run with
`--dart-define=API_BASE_URL=http://<your-ip>:3000/api`).
