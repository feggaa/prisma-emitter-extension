#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { generateTypes } from './generator';

async function main() {
  const argv = yargs(hideBin(process.argv))
    .command(
      'generate',
      'Generate prisma-emit type augmentations',
      (yargs) => yargs
        .option('schema', { alias: 's', type: 'string', default: 'prisma/schema.prisma' })
        .option('output', { alias: 'o', type: 'string', default: 'types' })
    )
    .help()
    .parseSync();

  const schemaPath = String(argv.schema);
  const outDir = String(argv.output);

  if (argv._.includes('generate')) {
    await generateTypes({ schemaPath, outDir });
    console.log('✅ prisma-emit types generated');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
