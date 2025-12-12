// src/generator.ts
import fs from 'node:fs';
import path from 'node:path';
import pc from 'picocolors';

export interface ModuleConfig {
  name: string;
  version: string;
  type: 'module' | 'commonjs';
  routes: string[];
}

export function generateModuleJson() {
  const cwd = process.cwd();
  const filePath = path.join(cwd, 'module.json');

  // Cek jika file sudah ada
  if (fs.existsSync(filePath)) {
    console.error(pc.red(`❌ Error: "module.json" sudah ada di direktori ini.`));
    process.exit(1);
  }

  // Template default module.json
  const content: ModuleConfig = {
    name: "sv-modular-app",
    version: "1.0.0",
    type: "module",
    routes: ["/src/routes"]
  };

  try {
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
    
    // Output sukses a la Prisma
    console.log(pc.green(`\n✔ Success!`) + ` Created ${pc.bold('module.json')}`);
    console.log(pc.dim(`\nNext steps:`));
    console.log(`  1. Edit module.json configuration`);
    console.log(`  2. Run ${pc.cyan('npx sv-modular generate')} (future feature)\n`);
    
  } catch (error) {
    console.error(pc.red(`❌ Gagal membuat file:`), error);
  }
}