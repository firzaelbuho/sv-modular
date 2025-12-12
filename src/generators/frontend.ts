import * as fs from "fs";
import * as path from "path";
import pc from "picocolors";

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
// Main Generator Function
// ----------------------------------------------------------

export function generateFrontendModule(inputName: string, options: { route?: string }) {
    const cwd = process.cwd();
    const rawModuleName = toKebab(inputName);
    
    // Default route = module name
    const routePath = options.route ? options.route : rawModuleName;

    // File names
    const pascal = toPascal(rawModuleName);
    const pageName = `${pascal}Page`;

    console.log(pc.cyan(`\n🎨 Generating Frontend Module: ${pc.bold(rawModuleName)}`));

    // ----------------------------------------------------------
    // Paths
    // ----------------------------------------------------------

    const modulePath = path.join(cwd, "src", "lib", "modules", rawModuleName);
    const routeFullPath = path.join(cwd, "src", "routes", routePath);

    const logFile = path.join(cwd, "module.log");
    const jsonFile = path.join(cwd, "module.json");

    // ----------------------------------------------------------
    // Create folder structure
    // ----------------------------------------------------------

    try {
        fs.mkdirSync(path.join(modulePath, "components"), { recursive: true });
        fs.mkdirSync(routeFullPath, { recursive: true });
    } catch (e) {
        console.error(pc.red(`❌ Failed to create directories. Are you in a SvelteKit project root?`));
        process.exit(1);
    }

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

    let jsonData: any = { modules: [] };

    if (fs.existsSync(jsonFile)) {
        try {
            jsonData = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
        } catch (error) {
            console.error(pc.yellow("Warning: Error reading module.json, creating new one..."));
        }
    }

    // Handle existing structure differences (compatibility)
    if (!jsonData.modules) jsonData.modules = [];

    // Filter logic specific to this schema
    jsonData.modules = jsonData.modules.filter((m: any) => m.name !== rawModuleName);

    // Add new entry
    jsonData.modules.push({
        name: rawModuleName,
        route: routePath
    });

    // Save file
    fs.writeFileSync(jsonFile, JSON.stringify(jsonData, null, 2));

    console.log(`
${pc.green('✔')} Module created: ${rawModuleName}
${pc.green('✔')} Page component: ${pageName}.svelte
${pc.green('✔')} Route generated: /${routePath}
${pc.green('✔')} Logged to module.log
${pc.green('✔')} Updated module.json
`);
}