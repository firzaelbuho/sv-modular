
-----

# 💎 sv-modular

**The Strict Modular Architecture Generator for SvelteKit**

`sv-modular` is a CLI tool designed to generate scalable, type-safe, and modular SvelteKit project structures. This tool enforces an architecture where every feature is perfectly isolated, enforcing a strict separation between UI State (Frontend) and Domain Logic (Backend/API).

-----

## 📋 Table of Contents

1.  [Installation](https://www.google.com/search?q=%23-installation)
2.  [Quick Start](https://www.google.com/search?q=%23-quick-start)
3.  [CLI Commands](https://www.google.com/search?q=%23-cli-commands)
4.  [Architecture Philosophy](https://www.google.com/search?q=%23-architecture-philosophy)
5.  [Frontend Architecture (UI Modules)](https://www.google.com/search?q=%23-frontend-architecture-ui-modules)
6.  [Backend Architecture (REST API)](https://www.google.com/search?q=%23-backend-architecture-rest-api)
7.  [Styling & UI Rules](https://www.google.com/search?q=%23-styling--ui-rules)

-----

## 📦 Installation

You can run this library directly using `npx` / `bunx` or install it globally.

### Using Bun (Recommended)

```bash
# Run directly without installation
bunx sv-modular create my-feature

# Or install globally
bun add -g sv-modular
```

### Using NPM / PNPM

```bash
npm install -g sv-modular
# or
pnpm add -g sv-modular
```

### Development Mode (Local Link)

If you are developing this library yourself:

```bash
cd /path/to/sv-modular
bun install
bun link
# The 'sv-modular' command is now available globally in your terminal
```

-----

## 🚀 Quick Start

### 1\. Create a UI Module (Frontend)

Creates a new page complete with an isolated Store, Service, and Components.

```bash
# Create a "user-dashboard" module
sv-modular create user-dashboard

# With a custom route path
sv-modular create auth-login --route auth/login
```

### 2\. Create an API Module (Backend)

Creates REST API endpoints complete with CRUD Services, Dummy Data, and Specs.

```bash
# Format: <nested-folder>/<module-name>
sv-modular create-server bands/linkinpark/songs
```

-----

## 🛠 CLI Commands

### `create <name>`

Generates a **Frontend/UI Module** structure.

| Argument | Description | Example |
| :--- | :--- | :--- |
| `<name>` | Module name in kebab-case format. | `product-list` |
| `--route` | (Optional) Custom path for the SvelteKit route. | `--route app/products` |

**Output:**

  - Creates `src/lib/modules/<name>/` (Store, UI, Logic)
  - Creates `src/routes/<route>/+page.svelte` (Routing)
  - Updates `module.json`

### `create-server <path>`

Generates a **Backend/REST API Module** structure.

| Argument | Description | Example |
| :--- | :--- | :--- |
| `<path>` | Module path (can be nested). The final name will be pluralized for the route. | `music/rock/albums` |

**Output:**

  - Creates `src/lib/modules/<path>/` (Services, Types, Values, Spec)
  - Creates `src/routes/api/<plural-path>/+server.ts` (API Endpoints)
  - Creates `src/lib/helpers/response.ts` (Standard JSON Response)

-----

## 🏛 Architecture Philosophy

This project adopts a **Strict Modularity** approach:

1.  **Zero Circular Dependencies:** Modules must not import other modules.
2.  **Shared Logic:** All common/reusable logic goes into `src/lib/shared/`.
3.  **Strict Types:** No `any`. All data types must be defined.
4.  **Separation of Concerns:**
      * **UI** must not mutate state directly.
      * **Services** handle business logic.
      * **Stores** only hold state.

-----

## 🎨 Frontend Architecture (UI Modules)

Every page is a module. The folder structure for UI modules is located in `src/lib/modules/`.

### Module File Structure

Example for `user-profile`:

```text
src/lib/modules/user-profile/
├── UserProfilePage.svelte  <- Main UI Component
├── store.ts                <- Writable Store (State)
├── service.ts              <- Business Logic (Mutations)
├── types.ts                <- UI State Interfaces
├── values.ts               <- Default Constants
└── components/             <- Module-specific Components
```

### Key Rules

1.  **Route Layer (`src/routes/...`)** must only contain imports to `ModulePage.svelte`. No logic is allowed in `+page.svelte`.
2.  **State Mutation:**
      * ❌ **FORBIDDEN:** `store.update(...)` inside `.svelte` files.
      * ✅ **MANDATORY:** Call functions from `service.ts` (e.g., `increment()`, `fetchUser()`).
3.  **Cross-Import:** Module A cannot import files from Module B. Use `src/lib/shared` for shared code.

-----

## ⚙️ Backend Architecture (REST API)

The Backend is structured based on simple **Domain Driven Design**. API module structures are also located in `src/lib/modules/` but are separate from the UI, and exposed via `src/routes/api/`.

### Module File Structure

Example command: `sv-modular create-server bands/linkinpark/songs`

```text
src/lib/modules/bands/linkinpark/songs/
├── types.ts      <- Data Model (Interface Song)
├── values.ts     <- In-Memory Dummy Data (FAKE_SONG)
├── services.ts   <- CRUD Logic (getAll, getById, insert...)
└── spec.md       <- API Endpoint Documentation
```

### Route Generation

The CLI automatically generates API routes with a **Plural** format:

  - `GET /api/bands/linkinpark/songs` (List & Filter)
  - `POST /api/bands/linkinpark/songs` (Create)
  - `GET /api/bands/linkinpark/songs/:id` (Detail)
  - `PUT /api/bands/linkinpark/songs/:id` (Update)
  - `DELETE /api/bands/linkinpark/songs/:id` (Remove)

### Built-in API Features

1.  **Standard Response:** Uses helpers like `responseOk`, `responseBadRequest`, etc.
2.  **Filtering:** Supports query params `?address=...` and `?age=...`.
3.  **Searching:** Supports query param `?s=keyword`.
4.  **Dummy Data:** Uses in-memory arrays that are editable (mutable) for rapid prototyping.

-----

## 💅 Styling & UI Rules

This library mandates the use of **TailwindCSS** and **DaisyUI** to ensure consistency.

### 1\. Frameworks

  - **TailwindCSS:** For utility classes (`p-4`, `flex`, `text-center`).
  - **DaisyUI:** For components (`btn`, `card`, `modal`) and theming.

### 2\. Layout Guidelines

  - **Container:** Use `max-w-5xl mx-auto` for main content.
  - **Sectioning:** Split the page into section components (e.g., `HeroSection.svelte`, `ListSection.svelte`) inside the module's `components/` folder.
  - **Spacing:** Consistently use `py-10` or `gap-6`.

### 3\. Responsive Design

  - **Mobile First:** Design for mobile first, then use `md:` and `lg:` for larger screens.
  - **Grid:** 1 column on mobile, 2-3 columns on desktop.

### 4\. Code Style

  - **Comments:** Mandatory descriptive comments for every logic block.
  - **Semantic HTML:** Use `<header>`, `<main>`, `<section>`, `<footer>`.
  - **No Hardcoded Colors:** Use semantic classes (`bg-primary`, `text-error`) from the DaisyUI theme.

-----

## 📄 License

This project is licensed under the **MIT License**.

-----

*Generated by sv-modular CLI*