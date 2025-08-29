# Route Inventory & Migration Mapping

This document inventories all current API endpoints and maps them to the new device-scoped architecture.

## Current Route Structure

### Simple Routes (`simple_routes/`)
- `GET /attendance/health` → Health check
- `GET /attendance/apiDocumentation` → API documentation  
- `GET /attendance` → Get all attendance logs (currently pk01 only)
- `GET /attendance/filter/:start/:end` → Filtered attendance logs
- `GET /attendance/date/:date` → Specific date attendance with names
- `GET /attendance/today` → Today's attendance with names
- `GET /attendance/todayShift` → Complete shift data (spanning midnight)
- `GET /attendance/todayShift/checkin` → Shift check-in data
- `GET /attendance/todayShift/checkout` → Shift check-out data
- `GET /attendance/device/info` → Device information
- `GET /attendance/device/status` → Device connection status

### Shift Routes (`shift_routes/`)
- `GET /attendance/todayShift/checkin` → Shift check-in data
- `GET /attendance/todayShift/checkout` → Shift check-out data
- `GET /attendance/todayShift` → Complete shift data

### Webhook Routes (`webhook_routes/`)
- `GET /attendance/webhook/test` → Test endpoint with instructions
- `GET /attendance/webhook/today` → Trigger webhook with today's data
- `GET /attendance/webhook/date/:date` → Trigger webhook with specific date
- `GET /attendance/webhook/todayShift` → Trigger webhook with today's shift data
- `POST /attendance/webhook/today` → Accept webhook URL in body

## New Device-Scoped Architecture

### Device-Scoped Endpoints (Primary)
```
GET /:prefix/health                    → Device health check
GET /:prefix/device/info              → Device information  
GET /:prefix/attendance               → Latest attendance for device
GET /:prefix/attendance/date/:date    → Date-specific attendance
GET /:prefix/attendance/filter/:start/:end → Filtered attendance
GET /:prefix/attendance/today         → Today's attendance
GET /:prefix/attendance/todayShift    → Today's shift data
```

### Fleet-Level Endpoints
```
GET /devices                          → List all configured devices
GET /attendance/all-devices           → Aggregate from all devices
GET /country/:code/attendance         → Group by country (optional)
```

### Webhook Endpoints
```
GET  /:prefix/attendance/webhook/todayShift → Device-specific webhook
POST /:prefix/attendance/webhook/today      → Device-specific webhook with custom URL
POST /:prefix/attendance/webhook/all        → Device-specific webhook with enriched data (employee names)
POST /devices/webhook/todayShift            → Broadcast to all devices
POST /devices/webhook/todayShift?country=US → Broadcast by country
```

## Migration Mapping

### Phase 1: Route Migration
| Current Route | New Route | Notes |
|---------------|-----------|-------|
| `GET /attendance/health` | `GET /:prefix/health` | Add prefix parameter |
| `GET /attendance/device/info` | `GET /:prefix/device/info` | Add prefix parameter |
| `GET /attendance` | `GET /:prefix/attendance` | Add prefix parameter |
| `GET /attendance/filter/:start/:end` | `GET /:prefix/attendance/filter/:start/:end` | Add prefix parameter |
| `GET /attendance/date/:date` | `GET /:prefix/attendance/date/:date` | Add prefix parameter |
| `GET /attendance/today` | `GET /:prefix/attendance/today` | Add prefix parameter |
| `GET /attendance/todayShift` | `GET /:prefix/attendance/todayShift` | Add prefix parameter |

### Phase 2: New Fleet Endpoints
| New Endpoint | Purpose | Implementation |
|--------------|---------|----------------|
| `GET /devices` | List devices with status | Aggregate from `config.ENV.DEVICES` |
| `GET /attendance/all-devices` | Multi-device data | Parallel fetch from all devices |
| `GET /country/:code/attendance` | Country-grouped data | Filter devices by country code |

### Phase 3: Webhook Migration
| Current Route | New Route | Changes |
|---------------|-----------|---------|
| `GET /attendance/webhook/today` | `GET /:prefix/attendance/webhook/today` | Add prefix parameter |
| `GET /attendance/webhook/todayShift` | `GET /:prefix/attendance/webhook/todayShift` | Add prefix parameter |
| `GET /attendance/webhook/date/:date` | `GET /:prefix/attendance/webhook/date/:date` | Add prefix parameter |

## Implementation Notes

### Prefix Validation
- All `:prefix` parameters must be validated against `config.ENV.DEVICES`
- Return 404 if prefix not found
- Use `zkHelper.isValidDeviceId(prefix)` for validation

### Response Consistency
- All endpoints return consistent JSON structure
- Include `requestId` from error tracker
- Standardize error responses across all endpoints

### Device Selection
- `pk01` = Pakistan primary device
- `us01` = USA primary device
- Future: `uk01`, `ae01`, etc.

### Backward Compatibility
- **No backward compatibility required** per roadmap
- All old routes will be replaced with device-scoped versions
- Update all client code to use new endpoint structure
