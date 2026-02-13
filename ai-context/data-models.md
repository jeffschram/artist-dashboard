# Data Models

This document describes the four main data models in the Artist Dashboard application. All data is stored in Convex and defined in `convex/schema.ts`.

---

## Venues

Performance venues that the artist may contact, has contacted, or has worked with.

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Venue name |
| `url` | `string` | No | Venue website URL |
| `submissionFormUrl` | `string` | No | URL for the venue's submission/booking form |
| `locations` | `array<Location>` | Yes | One or more physical locations (see below) |
| `contacts` | `array<InlineContact>` | Yes | Legacy inline contacts (kept for backward compatibility) |
| `contactIds` | `array<Id<contacts>>` | No | References to People (relational) |
| `status` | `enum` | Yes | One of: `"Contacted"`, `"To Contact"`, `"Ignore"`, `"Previous Client"` |
| `category` | `enum` | Yes | One of: `"Ultimate Dream Goal"`, `"Accessible"`, `"Unconventional"` |
| `notes` | `string` | No | Markdown notes |
| `orderNum` | `number` | Yes | Sort order for the Kanban board |

### Location (embedded object)

| Field | Type | Required |
|---|---|---|
| `city` | `string` | No |
| `state` | `string` | No |
| `country` | `string` | No |
| `phoneNumber` | `string` | No |

### InlineContact (legacy embedded object)

| Field | Type | Required |
|---|---|---|
| `name` | `string` | No |
| `title` | `string` | No |
| `email` | `string` | No |
| `notes` | `string` | No |

### Indexes

- `by_order` — `[orderNum]`

---

## Projects

Creative projects, gigs, or engagements. A project can optionally be associated with one or more venues and one or more people.

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Project name |
| `venueIds` | `array<Id<venues>>` | No | Associated venues |
| `venueId` | `Id<venues>` | No | Legacy single-venue reference (migration) |
| `startDate` | `string` | No | ISO date string |
| `endDate` | `string` | No | ISO date string |
| `description` | `string` | No | Brief description |
| `status` | `enum` | Yes | One of: `"Planning"`, `"In Progress"`, `"Completed"`, `"Cancelled"` |
| `notes` | `string` | No | Markdown notes |
| `budget` | `number` | No | Budget in USD |
| `profit` | `number` | No | Profit in USD |

### Relationships

- **Venues** — direct `venueIds` array on the project
- **People** — many-to-many via `projectContacts` join table
- **Collaborators** — many-to-many via `projectCollaborators` join table

---

## People (contacts table)

People associated with the artist's work: venue contacts, colleagues, other artists, clients, patrons, etc.

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Person's name |
| `email` | `string` | No | Email address |
| `phone` | `string` | No | Phone number |
| `role` | `string` | No | Free-text role or title |
| `types` | `array<PersonType>` | No | Categorization tags (see below) |
| `notes` | `string` | No | Markdown notes |
| `venueIds` | `array<Id<venues>>` | No | Associated venues |
| `venueId` | `Id<venues>` | No | Legacy single-venue reference (migration) |
| `collaboratorId` | `Id<collaborators>` | No | Link to legacy collaborator record |

### PersonType (enum values)

- `"Venue Contact"` — primary contact at a venue
- `"Colleague"` — professional peer
- `"Artist"` — fellow artist
- `"Client"` — someone who hires the artist
- `"Patron"` — financial supporter
- `"Customer"` — buyer of work/services
- `"Agent"` — booking or talent agent
- `"Vendor"` — supplier or service provider
- `"Other"` — anything else

### Indexes

- `by_collaborator` — `[collaboratorId]`

### Relationships

- **Venues** — direct `venueIds` array on the person
- **Projects** — many-to-many via `projectContacts` join table
- **Tasks** — many-to-many via `taskContacts` join table

---

## Tasks

To-do items that can be linked to venues, projects, and/or people. Displayed as a Kanban board organized by status.

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | Yes | Task title |
| `description` | `string` | No | Brief description |
| `status` | `enum` | Yes | One of: `"To Do"`, `"In Progress"`, `"Completed"`, `"Cancelled"` |
| `priority` | `enum` | Yes | One of: `"Low"`, `"Medium"`, `"High"`, `"Urgent"` |
| `dueDate` | `string` | No | ISO date string |
| `completedDate` | `string` | No | ISO date string |
| `notes` | `string` | No | Markdown notes |

### Indexes

- `by_status` — `[status]`
- `by_due_date` — `[dueDate]`

### Relationships (all many-to-many via join tables)

| Join Table | Fields | Description |
|---|---|---|
| `taskVenues` | `taskId`, `venueId` | Links tasks to venues |
| `taskProjects` | `taskId`, `projectId` | Links tasks to projects |
| `taskContacts` | `taskId`, `contactId` | Links tasks to people |

Each join table has indexes on both foreign keys (e.g. `by_task` and `by_venue`).

---

## Other Tables

| Table | Purpose |
|---|---|
| `collaborators` | Legacy table for project collaborators (name, url, email, phone, role, notes) |
| `projectCollaborators` | Join table linking projects to collaborators |
| `projectContacts` | Join table linking projects to people |
