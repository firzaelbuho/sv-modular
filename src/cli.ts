#!/usr/bin/env node
import { Command } from 'commander';

import pc from 'picocolors';
import { generateFrontendModule } from './generators/frontend';
import { generateServerModule } from './generators/server';

const version = "1.0.0";

const program = new Command();

program
  .name('sv-modular')
  .description('CLI Generator untuk SvelteKit Modular Architecture')
  .version(version);

// COMMAND 1: create (Frontend Module)
// npx sv-modular create user-profile
program
  .command('create')
  .description('Generate frontend module (UI, Store, Service)')
  .argument('<name>', 'Nama module (kebab-case)')
  .option('-r, --route <path>', 'Custom route path')
  .action((name, options) => {
    generateFrontendModule(name, options);
  });

// COMMAND 2: create-server (Backend/API Module)
// npx sv-modular create-server 
program
  .command('create-server')
  .description('Generate backend/server module (API Routes, Services, Types)')
  .argument('<path>', 'Path module (Example: barcelona/player)')
  .action((path) => {
    generateServerModule(path);
  });

program.parse(process.argv);