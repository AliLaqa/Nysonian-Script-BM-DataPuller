## Architecture Refactor Roadmap

This document outlines the step‑by‑step plan to evolve this codebase from a single‑device implementation to a clean, scalable, multi‑device biometric service. Backward compatibility with old routes is not required.

### Goals
- Support multiple biometric devices (e.g., `pk01`, `us01`, `uk01`) in a uniform way
- Consistent, device‑scoped API and fleet‑level aggregation endpoints
- Clear layered architecture (controllers → services → device adapters)
- Observable, testable, and operable (health, retries, scheduling, metrics)

### Guiding Principles
- Single responsibility per module; thin controllers, fat services
- Device‑aware by default; no hardcoded `pk01`
- Explicit configuration via environment variables
- Fail fast, return structured errors, and log with request correlation
- Concurrency controls around device I/O; resilient retries and timeouts

---

## 1) Target Folder Structure

```
src/
  config/               # env, constants, validation
  routes/               # express route definitions only
    attendanceRoutes.js
    shiftRoutes.js
    deviceRoutes.js
    webhookRoutes.js
    rootRoutes.js
  controllers/          # HTTP controllers (validation + response shaping)
    attendanceController.js
    shiftController.js
    deviceController.js
    webhookController.js
  services/             # business logic
    attendanceService.js
    shiftService.js
    webhookService.js
    deviceService.js
  devices/              # device adapters (ZKLib, future vendors)
    zk/
      zkClient.js       # wraps node-zklib, connection mgmt, retries
  utils/                # shared utils
    errorTracker.js
    dateUtils.js
  triggers/
    webhookScheduler.js # scheduler orchestrating per-device webhooks

api-server.js           # bootstraps express, mounts routes
```

Notes:
- Existing helpers (`utils/zkHelper.js`, `utils/errorTracker.js`) will be migrated and renamed under `src/devices/zk` and `src/utils` respectively.
- `config.js` will be moved to `src/config` and exposed as a single import surface.

---

## 2) Environment & Configuration

Standardize per-device env variables using lowercase prefix names:
- `<prefix>_IP`, `<prefix>_PORT`, `<prefix>_TIMEOUT`, `<prefix>_INPORT`, `<prefix>_NAME`, `<prefix>_LOCATION`, `<prefix>_MODEL` (optional)

Example `.env.example` entries:
```
API_HOST=0.0.0.0
API_PORT=3000

pk01_IP=10.0.0.10
pk01_PORT=4370
pk01_TIMEOUT=10000
pk01_INPORT=4000
pk01_NAME=ZKTeco MB460 (PK Office)
pk01_LOCATION=Pakistan

us01_IP=174.71.242.68
us01_PORT=4370
us01_TIMEOUT=10000
us01_INPORT=4000
us01_NAME=ZKTeco MB460 (US Office)
us01_LOCATION=USA
```

`config` will:
- Parse devices dynamically by scanning known prefixes (e.g., `pk01`, `us01`, `uk01`), or simply by detecting `*_IP` pairs
- Expose `ENV.DEVICES` (array with `id`, `ip`, `port`, `timeout`, `inport`, `location`, `country`)
- Provide `API.BASE_URL`, `API.TIMEOUT`, standardized headers
- Provide device management settings (retries, concurrency)

---

## 3) Public API Design

### Device‑scoped endpoints (primary)
- `GET /:prefix/health`
- `GET /:prefix/device/info`
- `GET /:prefix/attendance`
- `GET /:prefix/attendance/date/:date` (YYYY‑MM‑DD)
- `GET /:prefix/attendance/filter/:start&/:end` (YYYY‑MM‑DD)
- `GET /:prefix/attendance/today`
- `GET /:prefix/attendance/todayShift`

### Fleet‑level endpoints
- `GET /devices` — list configured devices with summary
- `GET /attendance/all-devices` — batched retrieval with per‑device results
- Optional: `GET /country/:code/attendance`

### Webhook endpoints
- `POST /:prefix/attendance/webhook/today`
- `GET  /:prefix/attendance/webhook/todayShift`
- `POST /devices/webhook/todayShift?country=US` — broadcast by selector

Response shape will be consistent across endpoints:
```
{
  success: boolean,
  timestamp: ISOString,
  data: any,
  summary?: { ... },
  error?: string,
  details?: any,
  requestId?: string
}
```

---

## 4) Services & Device Adapter

### Device Adapter (`devices/zk/zkClient.js`)
- `connect(prefix)` → opens socket; retry/backoff
- `getAttendances(prefix)` → validated, retried fetch
- `getInfo(prefix)` → device info/health
- `disconnect()` → safe disconnect

### Attendance Service
- Functions: `getLatest(prefix)`, `getByDate(prefix, date)`, `getByRange(prefix, start, end)`, `getToday(prefix)`
- Returns normalized records with counts and unique employee metrics

### Shift Service
- Config‑driven shift window (`START_HOUR`, `END_HOUR`)
- Implements “spanning midnight” logic; returns `employeeShiftSummary`, `validRecordsCount`, `hasValidData`

### Webhook Service
- Wraps attendance/shift services; posts to N8N URLs
- Supports per‑device and fleet broadcasts

---

## 5) Cross‑cutting Concerns

### Error Handling
- Centralized error tracker with step constants
- Controllers translate errors to consistent HTTP responses

### Logging
- Use `LOGGING.LEVELS` and include `requestId`
- Log device prefix, timings, retry counts, and record metrics

### Concurrency & Performance
- Cap simultaneous device connections (`MAX_CONCURRENT_DEVICES`)
- Exponential backoff on device reads
- Timeouts for all network calls

### Scheduling
- Scheduler iterates configured devices and triggers `/:prefix/attendance/webhook/todayShift`
- Prevent overlapping runs; configurable interval via env

### Testing
- Unit tests for services and adapter
- Integration tests for device‑scoped and fleet endpoints

---

## 6) Implementation Plan (Phases)

1. Baseline & Setup
   - Create `src/` structure and move files (no behavior changes)
   - Normalize config usage (`API.BASE_URL`, port from env)
   - Add `.env.example`

2. Device Adapter
   - Migrate `utils/zkHelper.js` to `devices/zk/zkClient.js`
   - Keep safe disconnect, retries, exponential backoff

3. Services
   - Implement `attendanceService`, `shiftService`, `deviceService`, `webhookService`
   - Port existing logic from helpers and routes into services

4. Controllers & Routes
   - Implement device‑scoped routes and controllers
   - Add fleet endpoints

5. Scheduler
   - Update to iterate devices and guard against overlapping runs

6. Observability & Hardening
   - Uniform error responses, logging, timeouts
   - Health endpoints and optional metrics

7. Tests & Docs
   - Add unit/integration tests and CI script entries
   - Update `API-ENDPOINTS.md` and developer docs

Deliverables per phase will be merged only when tests are green and lints pass.

---

## 7) Acceptance Criteria
- Device‑scoped endpoints return correct data for at least `pk01` and `us01`
- Fleet endpoints aggregate with per‑device breakdown and totals
- Scheduler triggers per‑device webhooks reliably
- Timeouts, retries, and concurrency limits enforced
- Consistent error shapes and logs across the system


