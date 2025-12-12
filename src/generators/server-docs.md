Below is the **updated full architecture documentation**, now using **international band examples (Linkin Park)** instead of JKT48.
Everything else remains fully accurate, clean, and production-ready.

---

# **SvelteKit REST API Module Architecture – Final Documentation (v2)**

## **1. Overview**

This architecture defines a clean, modular, and scalable pattern for building REST APIs in **SvelteKit**, using **TypeScript-first** development and isolated module design.

Each **module represents one API domain**, containing:

* Data model (`types.ts`)
* Dummy dataset (`values.ts`)
* Business logic (`services.ts`)
* API documentation (`spec.md`)
* REST route handlers (`+server.ts`)

This design ensures:

* Strict modular isolation
* Predictable and clean structure
* Standardized JSON responses
* Fast prototyping with in-memory CRUD
* Automatic module generation via CLI

---

# **2. Directory Structure**

```
src/
│
├── lib/
│   ├── helpers/
│   │   └── response.ts
│   │
│   └── modules/
│       └── <nested>/<module>/
│           ├── types.ts
│           ├── values.ts
│           ├── services.ts
│           └── spec.md
│
└── routes/
    └── api/
        └── <nested>/<plural-module>/
            ├── +server.ts
            └── [id]/
                └── +server.ts
```

### **Example with music domain**

If the module is:

```
bands/linkinpark/song
```

Routes will be generated as:

```
/api/bands/linkinparks/songs
```

---

# **3. Naming Rules**

### **3.1 Module Folders**

* Lowercase
* Nested allowed
* Example:

  ```
  bands/linkinpark/song
  music/rock/album
  ```

### **3.2 Interfaces**

* PascalCase
* Singular

```ts
export interface Song {}
```

### **3.3 Services Naming Pattern**

```
getAllSong()
getSongById(id)
insertSong(request)
editSongById(id, request)
deleteSongById(id)
```

### **3.4 Dummy Data Constants**

Uppercase:

```
FAKE_SONG
FAKE_ALBUM
FAKE_MEMBER
```

---

# **4. Route Structure**

### Folder Layout:

```
src/routes/api/<nested>/<plural-module>/+server.ts
```

Example:

```
src/routes/api/bands/linkinpark/songs/+server.ts
```

---

## **4.1 Root Route (+server.ts)**

Handles:

* `GET` → List all items (with filters & search)
* `POST` → Create item

Example:

```ts
export const GET = ({ url }) => getAllSong(url.searchParams);
export const POST = ({ request }) => insertSong(request);
```

---

## **4.2 Detail Route ([id]/+server.ts)**

Handles:

* `GET` → Get single item
* `PUT` → Update
* `DELETE` → Remove

### ID Validation Rule:

```ts
if (!id || id.trim() === "") {
	return responseBadRequest("Invalid ID");
}
```

---

# **5. Standard Response Format**

All API responses MUST use helpers in:

```
src/lib/helpers/response.ts
```

### JSON Structure:

```json
{
  "success": true,
  "status": 200,
  "message": "Success",
  "data": {},
  "error": null
}
```

### Response Helpers:

* `responseOk(data, message?)`
* `responseCreated(data, message?)`
* `responseBadRequest(message, error?)`
* `responseUnauthorized(message?)`
* `responseForbidden(message?)`
* `responseNotFound(message, error?)`
* `responseValidationError(message, error?)`
* `responseServerError(message, error?)`

Every service must return one of these.

---

# **6. Services Layer**

Service rules:

1. Must be async
2. Must NOT contain routing logic
3. Must not depend on SvelteKit internals except request body
4. Must return response helpers
5. Operate directly on dummy dataset (mutable)

Example:

```ts
export async function getSongById(id: string) {
	const found = FAKE_SONG.find(x => x.id === id);
	if (!found) return responseNotFound("Song not found");
	return responseOk(found);
}
```

---

# **7. Dummy Data (values.ts)**

Default template model:

```ts
export interface Model {
	id: string;
	name: string;
	email: string;
	address: string;
	age: number;
}
```

Dummy example for a band member:

```ts
export let FAKE_MEMBER = [
	{
		id: "uuid",
		name: "Chester Bennington",
		email: "chester@example.com",
		address: "Los Angeles",
		age: 41
	},
	...
];
```

Properties:

* Editable (mutable memory)
* Non-persistent
* Used for prototyping/testing
* Updated by CRUD services

---

# **8. Filtering and Searching**

Root GET supports these query parameters:

### **Filters**

| Query Key | Description                  |
| --------- | ---------------------------- |
| `address` | case-insensitive exact match |
| `age`     | exact numeric match          |

### **Search**

```
?s=keyword
```

Search happens on:

* `name` (case-insensitive)

Modules can define additional filters (e.g., albums, release dates).

---

# **9. Module Specification File (spec.md)**

Each module must include a structured inline doc:

```
# Song API Specification

## LIST & FILTER
GET /api/bands/linkinpark/songs

Query Filters:
- age
- address
- s (search by name)

## DETAIL
GET /api/bands/linkinpark/songs/:id

## CREATE
POST /api/bands/linkinpark/songs

## UPDATE
PUT /api/bands/linkinpark/songs/:id

## DELETE
DELETE /api/bands/linkinpark/songs/:id
```

---

# **10. Module Generator (create-module.ts)**

Usage:

```
bun run create-module.ts bands/linkinpark/song
```

It automatically generates:

* `types.ts`
* `values.ts`
* `services.ts`
* `spec.md`
* `+server.ts`
* `[id]/+server.ts`
* Ensures response helper exists
* Logs events → `module.log`
* Registers module → `module.json`
* Creates nested folder structure
* Pluralizes route folder name

### Example:

Command:

```
bun run create-module.ts bands/linkinpark/song
```

Generated routes:

```
src/routes/api/bands/linkinpark/songs/+server.ts
src/routes/api/bands/linkinpark/songs/[id]/+server.ts
```

---

# **11. Code Quality Standards**

### TypeScript & ESLint

* No implicit `any`
* No business logic in routes
* No console logs inside service
* Prefer descriptive naming

### Clean Architecture Principles

* Route → Service → Values
* Service must not import routes
* Dummy data used only as memory store

---

# **12. File Naming Summary**

| File / Folder                                             | Description            |
| --------------------------------------------------------- | ---------------------- |
| `src/lib/modules/<nested>/<module>/types.ts`              | Interface / data model |
| `src/lib/modules/<nested>/<module>/values.ts`             | Mutable dummy data     |
| `src/lib/modules/<nested>/<module>/services.ts`           | CRUD, filters, search  |
| `src/lib/modules/<nested>/<module>/spec.md`               | API spec               |
| `src/routes/api/<nested>/<plural-module>/+server.ts`      | GET all, POST          |
| `src/routes/api/<nested>/<plural-module>/[id]/+server.ts` | GET / PUT / DELETE     |
| `src/lib/helpers/response.ts`                             | Response helpers       |

---

# **13. Example API Workflow (Linkin Park Domain)**

Assume module:

```
bands/linkinpark/member
```

### GET `/api/bands/linkinpark/members`

Returns at least 5 dummy members.

### GET `/api/bands/linkinpark/members/:id`

Returns the member or 404.

### POST `/api/bands/linkinpark/members`

Adds a member (memory only).

### PUT `/api/bands/linkinpark/members/:id`

Updates the selected member.

### DELETE `/api/bands/linkinpark/members/:id`

Deletes the member.

---

# **14. Versioning Strategy**

* Architecture version: **v2.0**
* Any new module must follow this structure
* Major updates must be reflected in this document

---

# **15. Summary**

This API architecture is:

* Highly modular
* Clean and consistent
* Easy to scale
* TypeScript-first
* SvelteKit-native
* Fast to prototype
* Standardized via generator script

This document serves as the **official reference** for all API modules.

---

If you want a **root README.md**, **contribution guide**, or **generator auto-test suite**, tell me and I’ll generate it.