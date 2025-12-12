#!/usr/bin/env bun
/**
 * Module Generator (Nested Module + Plural Routes + Simple Model)
 *
 * Usage:
 *    bun run create-module.ts jkt48/member
 */

import {
	mkdirSync,
	existsSync,
	writeFileSync,
	appendFileSync,
	readFileSync
} from "node:fs";
import { join } from "node:path";

// ------------------------------------------------------------
// UTILITIES
// ------------------------------------------------------------
function log(message: string) {
	const ts = new Date().toISOString();
	appendFileSync("module.log", `[${ts}] ${message}\n`);
}

function updateModuleJson(pathString: string) {
	const file = "module.json";
	let json: any = { modules: [] };

	if (existsSync(file)) {
		json = JSON.parse(readFileSync(file, "utf8"));
	}
	if (!Array.isArray(json.modules)) json.modules = [];

	if (!json.modules.includes(pathString)) {
		json.modules.push(pathString);
		writeFileSync(file, JSON.stringify(json, null, 2));
	}
}

function capitalize(str: string) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

/** simple pluralizer */
function plural(str: string): string {
	if (str.endsWith("s")) return str;
	if (str.endsWith("y")) return str.slice(0, -1) + "ies";
	return str + "s";
}

/** parse input module path like: jkt48/member */
function parseModulePath(input: string) {
	const parts = input.split("/").filter((v) => v.trim() !== "");
	const moduleName = parts[parts.length - 1];
	const folderPath = parts.join("/");
	return { moduleName, folderPath, parts };
}

// ------------------------------------------------------------
// ROUTE PATH RESOLUTION
// ------------------------------------------------------------
/**
 * Build plural route path with nested folders.
 * Example:
 *   ["jkt48", "member"] → "jkt48/members"
 */
function buildRoutePath(parts: string[]) {
	const parents = parts.slice(0, -1).join("/");
	const leaf = parts[parts.length - 1];
	const leafPlural = plural(leaf);
	return parents ? `${parents}/${leafPlural}` : leafPlural;
}

// ------------------------------------------------------------
// TEMPLATES
// ------------------------------------------------------------

// ---------------------------------------------
// TYPES TEMPLATE
// ---------------------------------------------
function templateTypes(name: string) {
	const Class = capitalize(name);
	return `// Types for ${name} module

export interface ${Class} {
	id: string;
	name: string;
	email: string;
	address: string;
	age: number;
}
`;
}

// ---------------------------------------------
// VALUES TEMPLATE (5 dummy data)
// ---------------------------------------------
function templateValues(name: string) {
	const Class = capitalize(name);
	const UPPER = name.toUpperCase();

	const dummy = Array.from({ length: 5 })
		.map((_, i) => {
			return `\t{
\t\tid: crypto.randomUUID(),
\t\tname: "${Class} User ${i + 1}",
\t\temail: "${name}${i + 1}@example.com",
\t\taddress: "City ${i + 1}",
\t\tage: ${20 + i}
\t}`;
		})
		.join(",\n");

	return `// Values for ${name} module

import type { ${Class} } from "./types";

export let FAKE_${UPPER}: ${Class}[] = [
${dummy}
];
`;
}

// ---------------------------------------------
// SERVICES TEMPLATE (CRUD + FILTER + SEARCH)
// ---------------------------------------------
function templateServices(name: string) {
	const Class = capitalize(name);
	const UPPER = name.toUpperCase();

	return `// Services for ${name} module (simple CRUD + filter + search)

import type { ${Class} } from "./types";
import {
	responseOk,
	responseCreated,
	responseNotFound,
	responseBadRequest
} from "$lib/helpers/response";
import { FAKE_${UPPER} } from "./values";

// internal filtering
function filter${Class}(query: URLSearchParams): ${Class}[] {
	let list = [...FAKE_${UPPER}];

	// filter: address
	const address = query.get("address");
	if (address) {
		list = list.filter(
			(x) => x.address.toLowerCase() === address.toLowerCase()
		);
	}

	// filter: age
	const age = query.get("age");
	if (age && !Number.isNaN(Number(age))) {
		list = list.filter((x) => x.age === Number(age));
	}

	// search: name
	const s = query.get("s");
	if (s) {
		const k = s.toLowerCase();
		list = list.filter((x) => x.name.toLowerCase().includes(k));
	}

	return list;
}

/** GET ALL + FILTER */
export async function getAll${Class}(query?: URLSearchParams) {
	if (!query) return responseOk(FAKE_${UPPER});
	return responseOk(filter${Class}(query));
}

/** GET BY ID */
export async function get${Class}ById(id: string) {
	const found = FAKE_${UPPER}.find((x) => x.id === id);
	if (!found) return responseNotFound("${Class} not found");
	return responseOk(found);
}

/** INSERT */
export async function insert${Class}(request: Request) {
	try {
		const body = await request.json();

		if (!body.name || !body.email) return responseBadRequest("Invalid payload");

		const item: ${Class} = {
			id: crypto.randomUUID(),
			name: body.name,
			email: body.email,
			address: body.address ?? "",
			age: Number(body.age) || 0
		};

		FAKE_${UPPER}.push(item);
		return responseCreated(item);
	} catch (err) {
		return responseBadRequest("Invalid JSON body", err);
	}
}

/** EDIT */
export async function edit${Class}ById(id: string, request: Request) {
	const index = FAKE_${UPPER}.findIndex((x) => x.id === id);
	if (index === -1) return responseNotFound("${Class} not found");

	const body = await request.json();
	FAKE_${UPPER}[index] = { ...FAKE_${UPPER}[index], ...body };

	return responseOk(FAKE_${UPPER}[index]);
}

/** DELETE */
export async function delete${Class}ById(id: string) {
	const index = FAKE_${UPPER}.findIndex((x) => x.id === id);
	if (index === -1) return responseNotFound("${Class} not found");

	const removed = FAKE_${UPPER}.splice(index, 1)[0];
	return responseOk(removed, "${Class} deleted");
}
`;
}

// ---------------------------------------------
// ROUTE TEMPLATES
// ---------------------------------------------
function templateRouteList(moduleName: string, routePlural: string, modulePath: string) {
	const Class = capitalize(moduleName);

	return `// Route: /api/${routePlural}
// Methods: GET (list + filter), POST (insert)

import type { RequestHandler } from "@sveltejs/kit";
import {
	getAll${Class},
	insert${Class}
} from "$lib/modules/${modulePath}/services";

export const GET: RequestHandler = async ({ url }) => {
	return getAll${Class}(url.searchParams);
};

export const POST: RequestHandler = async ({ request }) => {
	return insert${Class}(request);
};
`;
}

function templateRouteDetail(moduleName: string, routePlural: string, modulePath: string) {
	const Class = capitalize(moduleName);

	return `// Route: /api/${routePlural}/:id

import type { RequestHandler } from "@sveltejs/kit";
import {
	get${Class}ById,
	edit${Class}ById,
	delete${Class}ById
} from "$lib/modules/${modulePath}/services";

import { responseBadRequest } from "$lib/helpers/response";

function validateId(id: string | undefined): string | null {
	if (!id || id.trim() === "") return null;
	return id;
}

export const GET: RequestHandler = async ({ params }) => {
	const id = validateId(params.id);
	if (!id) return responseBadRequest("Invalid ID");
	return get${Class}ById(id);
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const id = validateId(params.id);
	if (!id) return responseBadRequest("Invalid ID");
	return edit${Class}ById(id, request);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = validateId(params.id);
	if (!id) return responseBadRequest("Invalid ID");
	return delete${Class}ById(id);
};
`;
}

// ---------------------------------------------
// SPEC TEMPLATE
// ---------------------------------------------
function templateSpec(name: string, pluralRoute: string) {
	const Class = capitalize(name);

	return `# ${Class} API Specification

## LIST & FILTER
GET /api/${pluralRoute}

Query Filters:
- address
- age
- s (search by name)

## DETAIL
GET /api/${pluralRoute}/:id

## CREATE
POST /api/${pluralRoute}

## UPDATE
PUT /api/${pluralRoute}/:id

## DELETE
DELETE /api/${pluralRoute}/:id
`;
}

// ------------------------------------------------------------
// MAIN EXECUTION
// ------------------------------------------------------------

const rawPath = process.argv[2];
if (!rawPath) {
	console.error("Usage: bun run create-module.ts <module-path>");
	process.exit(1);
}

const { moduleName, folderPath, parts } = parseModulePath(rawPath);

// plural for ROUTE ONLY
const pluralRouteName = buildRoutePath(parts);

// module folder full path
const moduleFolderFullPath = join("src/lib/modules", folderPath);

// guard
if (existsSync(moduleFolderFullPath)) {
	console.error(`Error: Module '${folderPath}' already exists.`);
	process.exit(1);
}

// Ensure helper exist
const helperDir = "src/lib/helpers";
const helperFile = join(helperDir, "response.ts");

if (!existsSync(helperDir)) mkdirSync(helperDir, { recursive: true });
if (!existsSync(helperFile)) {
	writeFileSync(
		helperFile,
		`/** A collection of helpers to create consistent JSON Responses */

function jsonResponse(status: number, success: boolean, message: string, data?: any, error?: any): Response {
	const body: any = { success, status, message };
	if (data !== undefined) body.data = data;
	if (error !== undefined) body.error = error;

	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" }
	});
}

export async function responseOk(data: any, message?: string): Promise<Response> {
	return jsonResponse(200, true, message ?? "Success", data);
}

export async function responseCreated(data: any, message?: string): Promise<Response> {
	return jsonResponse(201, true, message ?? "Created successfully", data);
}

export async function responseBadRequest(message: string, error?: any): Promise<Response> {
	return jsonResponse(400, false, message, null, error);
}

export async function responseUnauthorized(message?: string): Promise<Response> {
	return jsonResponse(401, false, message ?? "Unauthorized");
}

export async function responseForbidden(message?: string): Promise<Response> {
	return jsonResponse(403, false, message ?? "Forbidden");
}

export async function responseNotFound(message: string, error?: any): Promise<Response> {
	return jsonResponse(404, false, message, null, error);
}

export async function responseServerError(message: string, error?: any): Promise<Response> {
	return jsonResponse(500, false, message, null, error);
}

export async function responseValidationError(message: string, error?: any): Promise<Response> {
	return jsonResponse(422, false, message, null, error);
}`
	);
	log("Created response helper");
}

// create module folder structure
mkdirSync(moduleFolderFullPath, { recursive: true });

// Write MODULE FILES
writeFileSync(join(moduleFolderFullPath, "types.ts"), templateTypes(moduleName));
writeFileSync(join(moduleFolderFullPath, "values.ts"), templateValues(moduleName));
writeFileSync(join(moduleFolderFullPath, "services.ts"), templateServices(moduleName));
writeFileSync(join(moduleFolderFullPath, "spec.md"), templateSpec(moduleName, pluralRouteName));

// Create ROUTES
const routeDir = join("src/routes/api", pluralRouteName);
mkdirSync(routeDir, { recursive: true });
mkdirSync(join(routeDir, "[id]"), { recursive: true });

writeFileSync(
	join(routeDir, "+server.ts"),
	templateRouteList(moduleName, pluralRouteName, folderPath)
);

writeFileSync(
	join(routeDir, "[id]", "+server.ts"),
	templateRouteDetail(moduleName, pluralRouteName, folderPath)
);

// Log output
log(`Generated module: ${rawPath}`);
updateModuleJson(rawPath);

console.log(`Module '${rawPath}' created successfully.`);
