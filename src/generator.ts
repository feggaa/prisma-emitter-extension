import { getDMMF } from '@prisma/internals';
import { promises as fs } from 'fs';
import { resolve } from 'path';

export async function generateTypes(opts: {
  schemaPath: string;
  outDir: string;
}) {
  const schema = await fs.readFile(opts.schemaPath, 'utf-8');
  const dmmf = await getDMMF({ datamodel: schema });
  const models = dmmf.datamodel.models.map((m) => m.name);

  const lines = [
    `// Generated by prisma-extension-emitter, do not edit`,
    `import { Prisma } from '@prisma/client'`,
    ``,
    `declare module '@prisma/client' {`,
    `  namespace Prisma {`,
  ];

  for (const model of models) {
    for (const op of ['Create', 'Update', 'Upsert', 'updateMany'] as const) {
      lines.push(
        `    interface ${model}${op}Args {`,
        `      emit?: boolean`,
        `    }`
      );
    }
  }

  lines.push(`  }`, `}`);

  await fs.mkdir(opts.outDir, { recursive: true });
  const outFile = resolve(opts.outDir, 'prisma-emit.d.ts');
  await fs.writeFile(outFile, lines.join('\n') + '\n');
}
