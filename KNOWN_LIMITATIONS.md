# Known Limitations

The following features are not yet available because the corresponding backend endpoints do not exist in the current backend version. Each function throws an `Error` at call time so callers receive a clear message rather than silent failure.

| Reference | Function | Endpoint | Notes |
|-----------|----------|----------|-------|
| — | `updateSystemTenant` (`lib/api/system.ts`) | `PUT /system/tenants/:id` | Tenant editing not supported by backend |
| — | `createTenantGroup` (`lib/api/tenant.ts`) | `POST /tenant/admin/groups` | Group creation not yet exposed |
| — | `updateTenantGroup` (`lib/api/tenant.ts`) | `PUT /tenant/admin/groups/:id` | Group editing not yet exposed |
| TN-006 | `provisionTenantUser` (`lib/api/tenant.ts`) | `POST /tenant/admin/users/provision` | Admin user provisioning pending |
| — | `upgradeGuestToCustomer` (`lib/api/auth.ts`) | `POST /tenant/admin/users/guests/upgrade-to-customer` | Guest upgrade flow pending |

## UI placeholders pending backend support

| Area | Status |
|------|--------|
| Sermon audio upload (`components/sermon-admin/sermon-form.tsx`) | Drop zone renders but file is not sent — no audio upload endpoint in current API |
| Sermon cover image upload (`components/sermon-admin/sermon-form.tsx`) | Drop zone renders but file is not sent — no image upload endpoint in current API |
