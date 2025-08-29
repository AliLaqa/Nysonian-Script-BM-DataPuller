# TodayShift API Criteria

## Overview
This document explains the logic for determining Check-In and Check-Out records for the `/attendance/todayShift` API, designed for shifts that start at 6pm and end at 2am the next day. The logic includes a buffer zone to accommodate early arrivals and late departures.

---

## Shift Timing
- **Shift Start:** 6:00pm (previous day)
- **Shift End:** 2:00am (next day)
- **Buffer Zone:** 12:00pm (noon) to 12:00am (midnight) for Check-In, 12:00am (midnight) to 12:00pm (noon) for Check-Out

---

## Criteria Logic

### Check-In
- **If current time is between 12:00am and 11:59am:**
  - Use **yesterday's entry** that occurred **after 12:00pm (noon) and before 12:00am (midnight)** as the Check-In.
- **If current time is between 12:00pm and 11:59pm:**
  - Use **today's entry** that occurred **after 12:00pm (noon) and before 12:00am (midnight)** as the Check-In.

### Check-Out
- **If current time is between 12:00am and 11:59am:**
  - Use **today's entry** that occurred **after 12:00am (midnight) and before 12:00pm (noon)** as the Check-Out.
- **If current time is between 12:00pm and 11:59pm:**
  - Use **tomorrow's entry** that occurred **after 12:00am (midnight) and before 12:00pm (noon)** as the Check-Out.

---

## Visual Diagram

```
graph TD;
    A[Current Time: 12am-12pm] --> B[Check-In: Yesterday 12pm-12am];
    A --> C[Check-Out: Today 12am-12pm];
    D[Current Time: 12pm-12am] --> E[Check-In: Today 12pm-12am];
    D --> F[Check-Out: Tomorrow 12am-12pm];
```

---

## Summary Table

| Current Time         | Check-In Source                | Check-In Window         | Check-Out Source               | Check-Out Window         |
|----------------------|-------------------------------|-------------------------|-------------------------------|-------------------------|
| 12am - 12pm (today)  | Yesterday's entries           | 12pm-12am (yesterday)   | Today's entries                | 12am-12pm (today)       |
| 12pm - 12am (today)  | Today's entries               | 12pm-12am (today)       | Tomorrow's entries             | 12am-12pm (tomorrow)    |

---

## Rationale
- The buffer zone (12pm-12am for Check-In, 12am-12pm for Check-Out) ensures that early arrivals and late departures are captured, accommodating real-world attendance patterns for overnight shifts.

---

## Example
- **If now is 10:00am:**
  - Check-In: Last entry from yesterday after 12pm and before midnight.
  - Check-Out: First entry from today after midnight and before noon.
- **If now is 8:00pm:**
  - Check-In: Last entry from today after 12pm and before midnight.
  - Check-Out: First entry from tomorrow after midnight and before noon.
