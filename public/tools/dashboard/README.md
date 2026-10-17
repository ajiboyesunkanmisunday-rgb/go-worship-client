# Go Worship canonical dashboard frontend

This package implements the single read-only dashboard represented by `DashboardController` and `DashboardResponse`.

## Files

- `index.html` - accessible dashboard document.
- `dashboard.css` - responsive Leadremit/Go Worship presentation.
- `dashboard.js` - API client and schema-driven renderers.

## Runtime contract

The page calls only:

```http
GET /api/v1/dashboard
```

Supported query parameters are `family`, `period`, `granularity`, `dimension`, `campusId`, `from`, `to`, `zoneId`, `currency`, and `limit`.

The request uses `credentials: include`, which supports the recommended secure HttpOnly session-cookie flow. If Go-Worship uses bearer tokens, expose the current in-memory token through `window.goWorshipAuth.getAccessToken()`. The dashboard deliberately does not read access tokens from local storage or session storage.

Example adapter registered by the authenticated application shell before `dashboard.js` executes:

```javascript
window.goWorshipAuth = {
  getAccessToken: async () => authSession.currentAccessToken()
};
```

No tenant ID, tenant domain, user ID, role, permission, or account type is sent by the page. Tenant context comes from the browser hostname; identity and authorization come from the server session or bearer token.

## Role-aware behavior

The frontend does not grant views by inspecting roles. It renders `availableFamilies`, `selectedFamily`, `sections`, `alerts`, metrics, series, breakdowns, tables, and navigation actions returned by the backend. Consequently, system, tenant, campus, customer, and guest users receive different content while using the same files.

## Supported presentation types

- KPI cards
- line and area charts
- vertical and horizontal bars
- stacked-bar-compatible series
- pie and donut charts
- gauges
- heatmaps
- bounded data tables
- alert panels
- authorized relative navigation links

Charts use native SVG and CSS, so no third-party charting dependency or CDN is required.

## Deployment

Serve these files from the same browser origin as Go Worship, or configure the reverse proxy so `/api/v1/dashboard` reaches `go-worship-api`. Same-origin hosting preserves domain-based tenant resolution and avoids requiring tenant headers.

## Required backend correction for CUSTOM ranges

`DashboardController.normalizePeriod(...)` returns `DashboardPeriod.CUSTOM` when `from` and `to` are supplied. The supplied `DashboardQuery.validateRange(...)` currently rejects every non-null period with an explicit range. Change that validation to allow exactly `CUSTOM` with `from/to`, and to require `from/to` whenever the period is `CUSTOM`:

```java
if (hasFrom && period != DashboardPeriod.CUSTOM) {
    throw new IllegalArgumentException(
            "An explicit dashboard range requires period CUSTOM"
    );
}

if (!hasFrom && period == DashboardPeriod.CUSTOM) {
    throw new IllegalArgumentException(
            "CUSTOM dashboard period requires from and to"
    );
}

if (!hasFrom && period == null) {
    throw new IllegalArgumentException(
            "Dashboard period or an explicit from/to range is required"
    );
}
```
