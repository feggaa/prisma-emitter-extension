#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const generator_1 = require("./generator");
async function main() {
    const argv = (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
        .command('generate', 'Generate prisma-emit type augmentations', (yargs) => yargs
        .option('schema', { alias: 's', type: 'string', default: 'prisma/schema.prisma' })
        .option('output', { alias: 'o', type: 'string', default: 'types' }))
        .help()
        .parseSync();
    const schemaPath = String(argv.schema);
    const outDir = String(argv.output);
    if (argv._.includes('generate')) {
        await (0, generator_1.generateTypes)({ schemaPath, outDir });
        console.log('✅ prisma-emit types generated');
    }
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
