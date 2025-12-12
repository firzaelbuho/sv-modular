#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";

// ----------------------------------------------------------
// Helpers
// ----------------------------------------------------------

function toKebab(input: string): string {
	return input.trim().toLowerCase().replace(/[\s_]+/g, "-");
}

function toPascal(input: string): string {
	return input
		.split(/[-/]/g)
		.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
		.join("");
}

function timestamp(): string {
	const d = new Date();
	const pad = (n: number) => (n < 10 ? "0" + n : n);
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// ----------------------------------------------------------
// CLI Args
// ----------------------------------------------------------

const args = process.argv.slice(2);

if (args.length === 0) {
	console.error("Usage: npx tsx create-module.ts <module-name> [--route <route-path>]");
	process.exit(1);
}

const rawModuleName = toKebab(args[0]);
let customRoute: string | null = null;

// Parse flags
for (let i = 1; i < args.length; i++) {
	if (args[i] === "--route" && args[i + 1]) {
		customRoute = args[i + 1];
	}
}

// Default route = module name
const routePath = customRoute ? customRoute : rawModuleName;

// File names
const pascal = toPascal(rawModuleName);
const pageName = `${pascal}Page`;

// ----------------------------------------------------------
// Paths
// ----------------------------------------------------------

const modulePath = path.join("src", "lib", "modules", rawModuleName);
const routeFullPath = path.join("src", "routes", routePath);

const logFile = "module.log";
const jsonFile = "module.json";

// ----------------------------------------------------------
// Create folder structure
// ----------------------------------------------------------

fs.mkdirSync(path.join(modulePath, "components"), { recursive: true });
fs.mkdirSync(routeFullPath, { recursive: true });

// ----------------------------------------------------------
// Generate module files
// ----------------------------------------------------------

// store.ts
fs.writeFileSync(
	path.join(modulePath, "store.ts"),
	`import { writable } from 'svelte/store';
import type { ${pascal}State } from './types';

export function create${pascal}Store() {
  return writable<${pascal}State>({
    count: 0
  });
}

export const use${pascal} = create${pascal}Store();
`
);

// types.ts
fs.writeFileSync(
	path.join(modulePath, "types.ts"),
	`export interface ${pascal}State {
  count: number;
}
`
);

// service.ts
fs.writeFileSync(
	path.join(modulePath, "service.ts"),
	`import { use${pascal} } from './store';

export function increment() {
  use${pascal}.update(s => ({ ...s, count: s.count + 1 }));
}

export function decrement() {
  use${pascal}.update(s => ({ ...s, count: s.count - 1 }));
}
`
);

// values.ts
fs.writeFileSync(
	path.join(modulePath, "values.ts"),
	`export const DEFAULT_${rawModuleName.toUpperCase().replace(/-/g, "_")} = {};
`
);

// Page Svelte
fs.writeFileSync(
	path.join(modulePath, `${pageName}.svelte`),
	`<script lang="ts">
  import { use${pascal} } from './store';
  import { increment, decrement } from './service';
  $: state = $use${pascal};
</script>

<div class="space-y-4">
  <h1 class="text-2xl font-bold">Hello, this is ${pageName}.</h1>

  <p>Count: {state.count}</p>

  <div class="flex gap-2">
    <button class="btn btn-primary" on:click={increment}>Increase</button>
    <button class="btn btn-secondary" on:click={decrement}>Decrease</button>
  </div>
</div>
`
);

// ----------------------------------------------------------
// Create +page.svelte route
// ----------------------------------------------------------

fs.writeFileSync(
	path.join(routeFullPath, "+page.svelte"),
	`<script lang="ts">
  import ${pageName} from '$lib/modules/${rawModuleName}/${pageName}.svelte';
</script>

<${pageName} />
`
);

// ----------------------------------------------------------
// Write module.log
// ----------------------------------------------------------

const logLine = `[${timestamp()}] Created module: ${rawModuleName} | route: ${routePath}\n`;
fs.appendFileSync(logFile, logLine);

// ----------------------------------------------------------
// Update module.json
// ----------------------------------------------------------

let jsonData = { modules: [] as Array<{ name: string; route: string }> };

if (fs.existsSync(jsonFile)) {
	try {
		jsonData = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
	} catch (error) {
		console.error("Error reading module.json, regenerating...");
	}
}

// Remove duplicate if exists
jsonData.modules = jsonData.modules.filter((m) => m.name !== rawModuleName);

// Add new entry
jsonData.modules.push({
	name: rawModuleName,
	route: routePath
});

// Save file
fs.writeFileSync(jsonFile, JSON.stringify(jsonData, null, 2));

console.log(`
✔ Module created: ${rawModuleName}
✔ Page component: ${pageName}.svelte
✔ Route generated: /${routePath}
✔ Logged to module.log
✔ Updated module.json
`);
