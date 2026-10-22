---
name: audira-telemetry-engine
description: >-
  Test, validate, and simulate mission-critical DCIM telemetry ingestion, ASHRAE TC 9.9 thermal envelopes, 2N ATS power failovers, closed-loop alert triggers, and autonomous AI Specialist dispatches. Use when working on telemetry API endpoints, IoT sensors, or alerting logic.
---

# AUDIRA DCOS Telemetry Engine & Ingestion Skill

This skill provides procedures for testing, simulating, and validating DCIM telemetry data streams in AUDIRA DCOS.

## API Gateway Architecture

- **Primary Ingestion Endpoint**: `POST /api/v1/telemetry/ingest`
- **Environmental Endpoint**: `POST /api/v1/environmental`
- **Rate Limit**: 600 requests per minute per IP / API key.
- **Authentication**: `Authorization: Bearer audira_sec_token_dcim_live_v2`

---

## ASHRAE TC 9.9 Thermal Envelope Standards

| Class / Severity | Temperature Range | Humidity Range | System Action |
| :--- | :--- | :--- | :--- |
| **Recommended** | $18.0^\circ\text{C} - 27.0^\circ\text{C}$ | $40\% - 60\%\text{ RH}$ | Normal operation. Status green. PUE target 1.21. |
| **Allowable (Warning)**| $15.0^\circ\text{C} - 32.0^\circ\text{C}$ | $20\% - 80\%\text{ RH}$ | Advisory logged. CRAH fan CFM modulation adjusted. |
| **Critical Breach** | $< 15.0^\circ\text{C}$ or $> 32.0^\circ\text{C}$ | $< 20\%$ or $> 80\%$ | P1 Emergency Alert. 3D beacon activated. THERMAX dispatched. |

---

## Telemetry Ingestion Testing Workflows

### Test 1: Normal Telemetry Ingestion (Power & Thermal)

```bash
curl -X POST http://localhost:3214/api/v1/telemetry/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer audira_sec_token_dcim_live_v2" \
  -d '{
    "facility_id": "DC-JKT-01",
    "timestamp": "2026-10-08T21:00:00Z",
    "power": {
      "transformer_load_pct": 68.4,
      "ats_status": "NORMAL_FEED_A",
      "ups_bus_a_load_kw": 412.5,
      "ups_bus_b_load_kw": 410.2,
      "battery_string_voltage": 542.1
    },
    "cooling": {
      "chilled_water_temp_in": 7.2,
      "chilled_water_temp_out": 12.8,
      "crah_airflow_cfm": 18500,
      "cold_aisle_avg_temp": 21.4
    },
    "pue": 1.21
  }'
```

Expected Response: `{"success": true, "code": "TELEMETRY_RECORDED", "pue": 1.21}`

### Test 2: Emergency Thermal Breach (Simulate Hot Spot)

```bash
curl -X POST http://localhost:3214/api/v1/telemetry/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer audira_sec_token_dcim_live_v2" \
  -d '{
    "facility_id": "DC-JKT-01",
    "rack_id": "RACK-DCO-A04",
    "timestamp": "2026-10-08T21:05:00Z",
    "sensor_type": "THERMAL_EXHAUST",
    "temperature_celsius": 36.8,
    "humidity_pct": 32.0,
    "alert_level": "CRITICAL"
  }'
```

Expected Behavior:
1. HTTP 200 with `alert_triggered: true`.
2. Firestore document created in `alerts/`.
3. Telegram message broadcast to NOC topic 88.
4. In `/agent-world`: 3D beacon lights up at `RACK-DCO-A04` and AI specialist THERMAX sprints to inspect.
