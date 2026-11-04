# What Is Valencia PowerWatch?

Valencia PowerWatch is a web-based power interruption reporting, verification,
and information management system for Valencia City, Bukidnon.

The system connects residents who experience an interruption with the people
who verify reports, coordinate repairs, and monitor service activity. It gives
each user group a role-specific portal while keeping reports and operational
updates in one application.

## What the system does

Valencia PowerWatch helps the city and its response teams:

- receive power interruption reports from residents;
- record the reported location, barangay, outage type, description, and
  optional evidence;
- show active and scheduled outage information on a map;
- verify resident reports and group related reports into incidents;
- assign incidents to field personnel;
- track field response stages, notes, locations, and evidence;
- notify users about relevant reports and updates;
- provide administrators with history, analytics, audit logs, user management,
  barangay management, and system settings.

## Who uses it

| User | Main purpose |
| --- | --- |
| Resident | Report an interruption, view outage information, follow personal reports, and receive updates |
| Field personnel | View assigned work, navigate to an incident, verify conditions, record field progress, and upload evidence |
| Administrator or utility user | Review reports, coordinate incidents and repairs, manage users and reference data, and monitor system activity |

## How a report moves through the system

1. A resident signs in through the Community Portal and submits an interruption
   report.
2. The system records the report and its location in the operational database.
3. Authorized personnel review the report and verify its details.
4. An administrator can connect related reports to one incident and dispatch a
   response team.
5. Field personnel use the Staff Portal to acknowledge the assignment, share
   location information, add notes, and upload permitted evidence.
6. Administrators review the response and update the incident status.
7. Residents can view relevant outage information and the status of their own
   reports.

## The three portals

### Community Portal

The Community Portal is the resident-facing experience at `/community`. It is
designed for phones and can be installed as a Progressive Web App (PWA).
Residents can view outage information, use the map, submit reports, review
their report history, manage their profile, and use the PowerWatch assistant.

### Staff Portal

The Staff Portal is the mobile field workspace at `/staff`. Assigned personnel
can review work orders, follow response stages, use location and navigation
features, confirm report details, record field notes, and upload evidence.

### Administrator Portal

The Administrator Portal is the desktop and tablet workspace at `/admin`.
Administrators and utility users can manage reports, incidents, dispatch,
outages, users, barangays, analytics, notifications, audit logs, and settings.

## How it is built

- **Frontend:** React and Vite, with Leaflet for maps.
- **Planned backend:** Supabase, using its PostgreSQL database, authentication,
  storage, and row-level security features.
- **Current backend implementation:** Node.js and Express, with SQLite for
  operational workflows and Neon PostgreSQL for durable snapshots, uploaded
  files, and resident authentication.
- **Current hosting:** The production Node.js service runs on Render.

Supabase is the planned backend direction for the system. The target design
will move application data and authentication into Supabase, use Supabase
Storage for report and field evidence, and enforce access through
row-level-security policies for residents, field personnel, administrators, and
utility users.

The migration has not yet been completed. Until the application code,
database schema, authentication flow, storage flow, and authorization policies
are migrated and tested, the deployed system continues to use its existing
Express, SQLite, and Neon design. See [Database Architecture](./DATABASE_ARCHITECTURE.md)
for the current production arrangement.

## What the system is not

Valencia PowerWatch does not directly control electrical equipment or restore
electricity. It records reports, supports verification and response
coordination, and gives authorized users a shared view of outage activity.

Location information from a browser GPS device or map service supports report
handling, but it is not an official cadastral boundary determination.

The current PWA service workers support installable portal shells and cached
navigation. They do not provide a complete offline report queue, background
synchronization, or complete push-notification delivery.

## Where to read more

- [System Overview](./SYSTEM_OVERVIEW.md): current routes, portal capabilities,
  backend flow, and PWA behavior.
- [System Deployment and User Guide](./SYSTEM_DEPLOYMENT_AND_USER_GUIDE.md):
  deployment links, setup, operations, and role-based workflows.
- [Database Architecture](./DATABASE_ARCHITECTURE.md): current SQLite and Neon
  persistence design.
- [Database Design Mapping](./DATABASE_DESIGN_MAPPING.md): mapping between the
  current implementation and the normalized domain schema.
