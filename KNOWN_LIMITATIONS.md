# Known Limitations

The following features are not available because the corresponding backend endpoints
do not exist in the current API version. Each is wired to throw an error when called
in live mode so that any attempt to use them surfaces a clear message rather than
silently succeeding.

## Missing backend endpoints

| Feature | HTTP method + path | Affected file |
|---|---|---|
| Edit tenant | `PUT /system/tenants/:id` | `lib/api/system.ts` → `updateSystemTenant` |
| Create group | `POST /tenant/admin/groups` | `lib/api/tenant.ts` → `createTenantGroup` |
| Edit group | `PUT /tenant/admin/groups/:id` | `lib/api/tenant.ts` → `updateTenantGroup` |
| Provision admin user (ministry) | `POST /tenant/admin/users/provision` | `lib/api/tenant.ts` → `provisionTenantUser` |
| Upgrade guest to customer | `POST /tenant/admin/users/guests/upgrade-to-customer` | `lib/api/auth.ts` → `upgradeGuestToCustomer` |
| Support tickets | `GET /system/support/tickets` | `app/system/(portal)/support/page.tsx` |
| Create / edit sermon tag | `POST/PUT /tenant/admin/sermon/tags` | `components/sermon-admin/tag-form.tsx` |

## Read endpoints that return empty data

These endpoints do not exist in the backend. The frontend returns an empty collection
rather than an error because an empty list is a valid, non-misleading state for a
read-only view.

| Feature | Missing path | Affected file |
|---|---|---|
| Group list (ministry / group-leader portals) | `GET /tenant/admin/groups` | `lib/api/tenant.ts` → `getTenantGroups` |
| Group detail | `GET /tenant/admin/groups/:id` | `lib/api/tenant.ts` → `getTenantGroup` |
| Member groups | `GET /self/groups` | `lib/api/tenant.ts` → `getSelfGroups` |
| Member group activities | `GET /self/groups/activities` | `lib/api/tenant.ts` → `getSelfGroupActivities` |
| Uploaded media list | `GET /tenant/admin/media` | `app/ministry/(portal)/media/uploads/page.tsx` |
| Sub-admin detail | `GET /tenant/admin/sub-admins/:id` | `components/ministry/view-account.tsx` |
